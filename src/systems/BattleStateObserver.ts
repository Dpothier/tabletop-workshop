import type { BeadCounts } from '@src/types/Beads';
import type { UIStateSubscriber } from '@src/types/UIStateEvents';

/**
 * BattleStateObserver manages subscriptions to battle state changes.
 * UI components subscribe to specific events, and the scene emits events
 * when state changes occur.
 */
export class BattleStateObserver {
  private subscribers: Map<number, UIStateSubscriber> = new Map();
  private nextSubscriberId = 0;

  /**
   * Subscribe to state changes.
   * Returns a subscriber ID that can be used to unsubscribe.
   */
  subscribe(subscriber: UIStateSubscriber): number {
    const id = this.nextSubscriberId++;
    this.subscribers.set(id, subscriber);
    return id;
  }

  /**
   * Unsubscribe from state changes.
   */
  unsubscribe(subscriberId: number): void {
    this.subscribers.delete(subscriberId);
  }

  /**
   * Emit actorChanged event to all subscribers.
   */
  emitActorChanged(actorId: string | null): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.actorChanged?.(actorId);
    }
  }

  /**
   * Emit selectionChanged event to all subscribers.
   */
  emitSelectionChanged(characterId: string | null): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.selectionChanged?.(characterId);
    }
  }

  /**
   * Emit wheelAdvanced event to all subscribers.
   */
  emitWheelAdvanced(entityId: string, newPosition: number): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.wheelAdvanced?.(entityId, newPosition);
    }
  }

  /**
   * Emit heroHealthChanged event to all subscribers.
   */
  emitHeroHealthChanged(heroId: string, current: number, max: number): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.heroHealthChanged?.(heroId, current, max);
    }
  }

  /**
   * Emit heroBeadsChanged event to all subscribers.
   */
  emitHeroBeadsChanged(heroId: string, counts: BeadCounts): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.heroBeadsChanged?.(heroId, counts);
    }
  }

  /**
   * Emit monsterHealthChanged event to all subscribers.
   */
  emitMonsterHealthChanged(current: number, max: number): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.monsterHealthChanged?.(current, max);
    }
  }

  /**
   * Emit monsterBeadsChanged event to all subscribers.
   */
  emitMonsterBeadsChanged(counts: BeadCounts | null): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.monsterBeadsChanged?.(counts);
    }
  }

  /**
   * Emit heroMoved event to all subscribers.
   */
  emitHeroMoved(heroId: string, worldX: number, worldY: number): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.heroMoved?.(heroId, worldX, worldY);
    }
  }

  /**
   * Emit monsterMoved event to all subscribers.
   */
  emitMonsterMoved(worldX: number, worldY: number): void {
    for (const subscriber of this.subscribers.values()) {
      subscriber.monsterMoved?.(worldX, worldY);
    }
  }
}
