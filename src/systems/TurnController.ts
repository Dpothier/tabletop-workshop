import type { ActionWheel } from '@src/systems/ActionWheel';

/**
 * Interface for entities that can be queried for alive status.
 * Minimal interface - only what TurnController needs.
 */
export interface AliveQueryable {
  isAlive(): boolean;
}

/**
 * Battle status result.
 */
export type BattleStatus = 'ongoing' | 'victory' | 'defeat';

/**
 * TurnController manages turn flow and win/lose conditions.
 *
 * This is a pure logic class with no Phaser dependencies,
 * making it easily testable. It delegates wheel operations
 * to ActionWheel and queries entities for alive status.
 */
export class TurnController {
  constructor(
    private readonly wheel: ActionWheel,
    private readonly monster: AliveQueryable,
    private readonly characters: AliveQueryable[]
  ) {}

  /**
   * Get the next actor from the action wheel.
   * @returns Entity ID of next actor, or null if wheel is empty
   */
  getNextActor(): string | null {
    return this.wheel.getNextActor();
  }

  /**
   * Advance an entity on the wheel by a cost amount.
   * @param entityId - Entity to advance
   * @param cost - Wheel cost of the action taken
   */
  advanceTurn(entityId: string, cost: number): void {
    this.wheel.advanceEntity(entityId, cost);
  }

  /**
   * Check if victory condition is met (monster defeated).
   * @returns true if monster is dead
   */
  checkVictory(): boolean {
    return !this.monster.isAlive();
  }

  /**
   * Check if defeat condition is met (all characters dead).
   * @returns true if no characters are alive
   */
  checkDefeat(): boolean {
    return this.characters.filter((c) => c.isAlive()).length === 0;
  }

  /**
   * Get the current battle status.
   * Checks victory and defeat conditions.
   * @returns 'victory', 'defeat', or 'ongoing'
   */
  getBattleStatus(): BattleStatus {
    if (this.checkVictory()) {
      return 'victory';
    }
    if (this.checkDefeat()) {
      return 'defeat';
    }
    return 'ongoing';
  }
}
