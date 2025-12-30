import type { Position } from '@src/state/BattleGrid';
import type { OptionPrompt } from '@src/types/ParameterPrompt';
import type { AnimationEvent } from '@src/types/AnimationEvent';

/**
 * BattleAdapter abstracts UI interactions for action execution.
 * Allows Action/ActionResolution to be tested without Phaser.
 */
export interface BattleAdapter {
  // ===== Phase 3: Action Execution =====

  /**
   * Prompt user to select a tile within range.
   * @returns Selected position or null if cancelled
   */
  promptTile(params: { range: number }): Promise<Position | null>;

  /**
   * Prompt user to select from a list of options.
   * @returns Selected option IDs or null if cancelled
   */
  promptOptions(prompt: OptionPrompt): Promise<string[] | null>;

  /**
   * Animate a sequence of events.
   */
  animate(events: AnimationEvent[]): Promise<void>;

  /**
   * Log a message to the battle log.
   */
  log(message: string): void;

  // ===== Phase 4: Turn Management & Scene Control =====

  /**
   * Setup UI for player turn (auto-select actor, make characters clickable).
   * Called at the start of each player turn.
   */
  showPlayerTurn(actorId: string): void;

  /**
   * Wait for player to select an action.
   * @returns Action ID selected by the player
   */
  awaitPlayerAction(actorId: string): Promise<string>;

  /**
   * Transition to another scene.
   */
  transition(scene: string, data: object): void;

  /**
   * Delay execution for a specified duration.
   */
  delay(ms: number): Promise<void>;
}
