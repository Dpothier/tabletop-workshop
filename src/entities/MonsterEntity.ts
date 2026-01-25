import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BeadPile } from '@src/systems/BeadPile';
import { BeadPool } from '@src/systems/BeadPool';
import { MonsterStateMachine, MonsterStateDefinition } from '@src/systems/MonsterStateMachine';
import type { AnimationEvent, DodgeEvent, GuardedEvent, HitEvent } from '@src/types/AnimationEvent';
import type { AttackModifier } from '@src/types/Combat';
import { resolveAttack } from '@src/combat/CombatResolver';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import { Character } from '@src/entities/Character';
import type { OptionPrompt, OptionChoice } from '@src/types/ParameterPrompt';

/**
 * Configuration for a monster.
 */
export interface MonsterConfig {
  id: string;
  maxHealth: number;
}

/**
 * State configuration for monster AI.
 */
export interface StateConfig {
  name: string;
  damage?: number;
  agility?: number;
  wheel_cost?: number;
  range?: number;
  area?: string;
  transitions: Record<string, string>;
}

/**
 * Result of monster AI decision.
 */
export interface MonsterAction {
  type: 'attack' | 'move' | 'idle';
  target?: Entity;
  destination?: { x: number; y: number };
  drawnBead?: BeadColor;
  state?: MonsterStateDefinition;
  wheelCost: number;
}

/**
 * MonsterEntity represents an enemy controlled by bead-based AI.
 * It integrates BeadPool + BeadPile for randomness and MonsterStateMachine for behavior.
 */
export class MonsterEntity extends Entity {
  private beadPool?: BeadPool;
  private beadDiscard?: BeadPile;
  private stateMachine?: MonsterStateMachine;
  private previousStateName?: string;

  constructor(id: string, maxHealth: number, grid: BattleGrid) {
    super(id, maxHealth, grid);
  }

  /**
   * Initialize the bead bag for this monster.
   */
  initializeBeadBag(beads: BeadCounts): void {
    this.beadDiscard = new BeadPile();
    this.beadPool = new BeadPool(beads, this.beadDiscard);
  }

  /**
   * Initialize the state machine for this monster.
   */
  initializeStateMachine(states: StateConfig[], startState: string): void {
    const stateDefinitions: MonsterStateDefinition[] = states.map((state) => ({
      name: state.name,
      damage: state.damage,
      agility: state.agility,
      wheel_cost: state.wheel_cost,
      range: state.range,
      area: state.area,
      transitions: state.transitions,
    }));

    this.stateMachine = new MonsterStateMachine(stateDefinitions, startState);
  }

  /**
   * Apply stats from monster configuration.
   * Used when loading monster from YAML data.
   */
  applyStats(stats: { armor?: number; evasion?: number }): void {
    if (stats.armor !== undefined) {
      this.setArmor(stats.armor);
    }
    if (stats.evasion !== undefined) {
      this.setEvasion(stats.evasion);
    }
  }

  /**
   * Check if this monster has a bead bag initialized.
   */
  hasBeadBag(): boolean {
    return this.beadPool !== undefined;
  }

  /**
   * Check if this monster has a state machine initialized.
   */
  hasStateMachine(): boolean {
    return this.stateMachine !== undefined;
  }

  /**
   * Get the discarded bead counts from the bead bag.
   */
  getDiscardedCounts(): BeadCounts | undefined {
    return this.beadDiscard?.getCounts();
  }

  /**
   * Decide what action to take this turn.
   * Draws a bead, transitions state, and determines attack or move.
   * Does NOT execute the action - call executeDecision() for that.
   */
  decideTurn(targets: Entity[]): MonsterAction {
    // Default action if no bead system
    if (!this.beadPool || !this.beadDiscard || !this.stateMachine) {
      return {
        type: 'idle',
        wheelCost: 1,
      };
    }

    // Store previous state name before transition
    this.previousStateName = this.stateMachine.getCurrentState().name;

    // Draw bead and transition state
    const drawnBead = this.beadPool.draw();
    const state = this.stateMachine.transition(drawnBead);

    // Discard the bead after using it for state transition
    this.beadDiscard.add(drawnBead);

    // Find closest target
    const target = this.findClosestTarget(targets);

    const wheelCost = state.wheel_cost ?? 1;
    const range = state.range ?? 1;

    if (!target) {
      return {
        type: 'idle',
        drawnBead,
        state,
        wheelCost,
      };
    }

    // Check if target is in range
    const distance = this.grid.getDistance(this.id, target.id);

    if (distance <= range) {
      // Attack the target
      return {
        type: 'attack',
        target,
        drawnBead,
        state,
        wheelCost,
      };
    } else {
      // Move toward target
      const destination = this.calculateMoveToward(target);
      return {
        type: 'move',
        target,
        destination,
        drawnBead,
        state,
        wheelCost,
      };
    }
  }

  /**
   * Execute a decided action and return animation events.
   * This method applies state changes and returns events describing what happened.
   * Prompts player characters for defensive reactions before combat resolution.
   */
  async executeDecision(decision: MonsterAction, adapter?: BattleAdapter): Promise<AnimationEvent[]> {
    const events: AnimationEvent[] = [];

    // Add bead draw event if a bead was drawn
    if (decision.drawnBead) {
      events.push({ type: 'beadDraw', color: decision.drawnBead });
    }

    // Add state change event if state changed
    if (decision.state && this.previousStateName) {
      events.push({
        type: 'stateChange',
        fromState: this.previousStateName,
        toState: decision.state.name,
      });
    }

    // Execute the action based on type
    if (decision.type === 'attack' && decision.target && decision.state) {
      const power = decision.state.damage ?? 1;
      const agility = decision.state.agility ?? 1;

      // Prompt for defensive reaction if target is a Character
      if (decision.target instanceof Character) {
        await this.promptDefensiveReaction(decision.target, power, agility, adapter);
      }

      // Get target's defense stats
      const defenseStats = decision.target.getDefenseStats();

      // Resolve combat
      const combatResult = resolveAttack({ power, agility }, defenseStats, [] as AttackModifier[]);

      // Add legacy attack event for backward compatibility
      events.push({
        type: 'attack',
        attackerId: this.id,
        targetId: decision.target.id,
        damage: combatResult.damage,
      });

      // Add outcome-specific event
      if (combatResult.outcome === 'dodged') {
        events.push({
          type: 'dodge',
          entityId: decision.target.id,
          attackerId: this.id,
          canReact: combatResult.canReact,
        } as DodgeEvent);
      } else if (combatResult.outcome === 'guarded') {
        events.push({
          type: 'guarded',
          entityId: decision.target.id,
          attackerId: this.id,
          blockedDamage: power - combatResult.damage,
        } as GuardedEvent);
      } else {
        // Hit - cap damage at target's current health
        const actualDamage = Math.min(combatResult.damage, decision.target.currentHealth);

        events.push({
          type: 'hit',
          entityId: decision.target.id,
          attackerId: this.id,
          damage: actualDamage,
        } as HitEvent);

        // Only apply damage on hit
        decision.target.receiveDamage(actualDamage);

        // Add damage event for UI health bar update
        events.push({
          type: 'damage',
          entityId: decision.target.id,
          newHealth: decision.target.currentHealth,
          maxHealth: decision.target.maxHealth,
        });
      }
    } else if (decision.type === 'move' && decision.destination) {
      const from = this.getPosition();
      this.moveTo(decision.destination);

      if (from) {
        events.push({
          type: 'move',
          entityId: this.id,
          from,
          to: decision.destination,
        });
      }
    }

    return events;
  }

  /**
   * Prompt the target character for defensive reactions (guard or evasion).
   * Allows spending beads to boost defense stats before combat resolution.
   */
  private async promptDefensiveReaction(
    target: Character,
    power: number,
    agility: number,
    adapter?: BattleAdapter
  ): Promise<void> {
    const beadHand = target.getBeadHand();
    if (!beadHand) {
      return;
    }

    const handCounts = beadHand.getHandCounts();
    const hasDefensiveBeads = handCounts.red > 0 || handCounts.green > 0;

    if (!hasDefensiveBeads || !adapter) {
      return;
    }

    // Build options for defensive reaction
    const options: OptionChoice[] = [];

    // Add options for red beads (guard)
    for (let i = 1; i <= handCounts.red; i++) {
      options.push({
        id: `guard-${i}`,
        label: `Spend ${i} red bead${i > 1 ? 's' : ''} for +${i} Guard`,
      });
    }

    // Add options for green beads (evasion)
    for (let i = 1; i <= handCounts.green; i++) {
      options.push({
        id: `evade-${i}`,
        label: `Spend ${i} green bead${i > 1 ? 's' : ''} for +${i} Evasion`,
      });
    }

    // Always include pass option
    options.push({
      id: 'pass',
      label: 'Pass',
    });

    const prompt: OptionPrompt = {
      type: 'option',
      key: 'defensiveReaction',
      prompt: 'Incoming Attack! Boost your defenses?',
      subtitle: `⚔ Power ${power}    💨 Agility ${agility}`,
      optional: true,
      multiSelect: false,
      options,
    };

    const selected = await adapter.promptOptions(prompt);
    if (!selected || selected.length === 0) {
      return;
    }

    const reactionId = selected[0];
    let beadsSpent = false;

    // Handle guard reaction
    if (reactionId.startsWith('guard-')) {
      const count = parseInt(reactionId.substring(6), 10);
      for (let i = 0; i < count; i++) {
        beadHand.spend('red');
      }
      target.setGuard(target.guard + count);
      beadsSpent = true;
    }

    // Handle evasion reaction
    if (reactionId.startsWith('evade-')) {
      const count = parseInt(reactionId.substring(6), 10);
      for (let i = 0; i < count; i++) {
        beadHand.spend('green');
      }
      target.setEvasion(target.evasion + count);
      beadsSpent = true;
    }

    // Notify UI that beads have changed
    if (beadsSpent) {
      adapter.notifyBeadsChanged(target.id, beadHand.getHandCounts());
    }
  }

  /**
   * Find the closest target entity.
   */
  private findClosestTarget(targets: Entity[]): Entity | undefined {
    if (targets.length === 0) {
      return undefined;
    }

    let closest = targets[0];
    let closestDistance = this.grid.getDistance(this.id, closest.id);

    for (let i = 1; i < targets.length; i++) {
      const distance = this.grid.getDistance(this.id, targets[i].id);
      if (distance < closestDistance) {
        closest = targets[i];
        closestDistance = distance;
      }
    }

    return closest;
  }

  /**
   * Calculate the best move position toward a target.
   */
  private calculateMoveToward(target: Entity): { x: number; y: number } | undefined {
    const myPos = this.getPosition();
    const targetPos = target.getPosition();

    if (!myPos || !targetPos) {
      return undefined;
    }

    // Simple movement: move one step toward target
    let dx = 0;
    let dy = 0;

    if (targetPos.x > myPos.x) dx = 1;
    else if (targetPos.x < myPos.x) dx = -1;

    if (targetPos.y > myPos.y) dy = 1;
    else if (targetPos.y < myPos.y) dy = -1;

    // Prefer horizontal movement first
    if (dx !== 0) {
      const newPos = { x: myPos.x + dx, y: myPos.y };
      if (this.grid.isInBounds(newPos.x, newPos.y) && !this.grid.getEntityAt(newPos.x, newPos.y)) {
        return newPos;
      }
    }

    // Try vertical movement
    if (dy !== 0) {
      const newPos = { x: myPos.x, y: myPos.y + dy };
      if (this.grid.isInBounds(newPos.x, newPos.y) && !this.grid.getEntityAt(newPos.x, newPos.y)) {
        return newPos;
      }
    }

    return undefined;
  }
}
