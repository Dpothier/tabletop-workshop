import type { AnimationEvent } from '@src/types/AnimationEvent';
import type { GridSystem } from '@src/systems/GridSystem';
import type { CharacterVisual } from '@src/visuals/CharacterVisual';
import type { MonsterVisual } from '@src/visuals/MonsterVisual';
import type { EntityVisual } from '@src/visuals/EntityVisual';
import type { BattleUI } from '@src/ui/BattleUI';
import type { BattleStateObserver } from '@src/systems/BattleStateObserver';
import type { BeadCounts } from '@src/types/Beads';

export interface EntityAccessors {
  getHeroBeadCounts: (heroId: string) => BeadCounts | undefined;
  getMonsterDiscardedCounts: () => BeadCounts | null;
}

/**
 * AnimationExecutor coordinates visual animations based on animation events.
 * It is the bridge between state changes and visual representation.
 */
export class AnimationExecutor {
  constructor(
    private readonly gridSystem: GridSystem,
    private readonly characterVisuals: Map<string, CharacterVisual>,
    private readonly monsterVisual: MonsterVisual,
    private readonly battleUI: BattleUI,
    private readonly stateObserver?: BattleStateObserver,
    private readonly entityAccessors?: EntityAccessors
  ) {}

  /**
   * Execute a sequence of animation events.
   * Events are processed sequentially, waiting for each animation to complete.
   */
  async execute(events: AnimationEvent[]): Promise<void> {
    for (const event of events) {
      await this.executeOne(event);
    }
  }

  /**
   * Execute a single animation event.
   */
  private async executeOne(event: AnimationEvent): Promise<void> {
    switch (event.type) {
      case 'move':
        await this.executeMove(event);
        break;
      case 'attack':
        await this.executeAttack(event);
        break;
      case 'damage':
        await this.executeDamage(event);
        break;
      case 'beadDraw':
        await this.executeBeadDraw(event);
        break;
      case 'stateChange':
        await this.executeStateChange(event);
        break;
      case 'rest':
        await this.executeRest(event);
        break;
    }
  }

  private async executeMove(event: AnimationEvent & { type: 'move' }): Promise<void> {
    const visual = this.getVisual(event.entityId);
    if (!visual) return;

    const worldX = this.gridSystem.gridToWorld(event.to.x);
    const worldY = this.gridSystem.gridToWorld(event.to.y);
    await visual.animateToPosition(worldX, worldY);
  }

  private async executeAttack(event: AnimationEvent & { type: 'attack' }): Promise<void> {
    const targetVisual = this.getVisual(event.targetId);
    if (!targetVisual) return;

    await targetVisual.animateDamage();
    this.battleUI.log(`${this.getEntityName(event.attackerId)} attacks for ${event.damage}!`);
  }

  private async executeDamage(event: AnimationEvent & { type: 'damage' }): Promise<void> {
    const visual = this.getVisual(event.entityId);
    if (!visual) return;

    await visual.animateHealthChange(event.newHealth, event.maxHealth);

    if (event.entityId === 'monster') {
      this.stateObserver?.emitMonsterHealthChanged(event.newHealth, event.maxHealth);
    } else if (event.entityId.startsWith('hero-')) {
      this.stateObserver?.emitHeroHealthChanged(event.entityId, event.newHealth, event.maxHealth);
    }
  }

  private async executeBeadDraw(event: AnimationEvent & { type: 'beadDraw' }): Promise<void> {
    await this.monsterVisual.animateBeadDraw(event.color);
    this.battleUI.log(`Drew ${event.color} bead`);

    const discardedCounts = this.entityAccessors?.getMonsterDiscardedCounts();
    this.stateObserver?.emitMonsterBeadsChanged(discardedCounts ?? null);
  }

  private async executeStateChange(event: AnimationEvent & { type: 'stateChange' }): Promise<void> {
    await this.monsterVisual.animateStateChange(event.fromState, event.toState);
    this.battleUI.log(`→ ${event.toState}`);
  }

  private async executeRest(event: AnimationEvent & { type: 'rest' }): Promise<void> {
    const visual = this.characterVisuals.get(event.entityId);
    if (!visual) return;

    await visual.animateRest(event.beadsDrawn);
    this.battleUI.log(`Rested, drew ${event.beadsDrawn.length} beads`);

    const counts = this.entityAccessors?.getHeroBeadCounts(event.entityId);
    if (counts) {
      this.stateObserver?.emitHeroBeadsChanged(event.entityId, counts);
    }
  }

  /**
   * Get the visual for an entity by ID.
   */
  private getVisual(entityId: string): EntityVisual | undefined {
    if (entityId === 'monster') {
      return this.monsterVisual;
    }
    return this.characterVisuals.get(entityId);
  }

  /**
   * Get a display name for an entity.
   */
  private getEntityName(entityId: string): string {
    if (entityId === 'monster') {
      return this.monsterVisual.getMonsterName();
    }
    const visual = this.characterVisuals.get(entityId);
    if (visual) {
      return visual.getClassName();
    }
    return entityId;
  }
}
