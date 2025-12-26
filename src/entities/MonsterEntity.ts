import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BeadPile } from '@src/systems/BeadPile';
import { BeadPool } from '@src/systems/BeadPool';
import { MonsterStateMachine, MonsterStateDefinition } from '@src/systems/MonsterStateMachine';
import type { AnimationEvent } from '@src/types/AnimationEvent';

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
      wheel_cost: state.wheel_cost,
      range: state.range,
      area: state.area,
      transitions: state.transitions,
    }));

    this.stateMachine = new MonsterStateMachine(stateDefinitions, startState);
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
   */
  executeDecision(decision: MonsterAction): AnimationEvent[] {
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
      const damage = decision.state.damage ?? 1;
      decision.target.receiveAttack(damage);

      events.push({
        type: 'attack',
        attackerId: this.id,
        targetId: decision.target.id,
        damage,
      });
      events.push({
        type: 'damage',
        entityId: decision.target.id,
        newHealth: decision.target.currentHealth,
        maxHealth: decision.target.maxHealth,
      });
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
