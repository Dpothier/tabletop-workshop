import type { Position } from '@src/state/BattleGrid';
import type { OptionPrompt } from '@src/types/ParameterPrompt';
import type { AnimationEvent } from '@src/types/AnimationEvent';

/**
 * BattleAdapter abstracts UI interactions for action execution.
 * Allows Action/ActionResolution to be tested without Phaser.
 */
export interface BattleAdapter {
  /**
   * Prompt user to select a tile within range.
   * @returns Selected position or null if cancelled
   */
  promptTile(range: number): Promise<Position | null>;

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
}
