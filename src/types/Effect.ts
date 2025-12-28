import type { BattleGrid, Position } from '@src/state/BattleGrid';
import type { Entity } from '@src/entities/Entity';
import type { AnimationEvent } from '@src/types/AnimationEvent';
import type { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';

/**
 * EffectResult indicates the outcome of an effect execution.
 * - success: whether effect executed without errors
 * - data: arbitrary result data for chaining (e.g., { hit: true, damage: 2 })
 * - events: animation events produced by the effect
 */
export interface EffectResult {
  success: boolean;
  data: Record<string, unknown>;
  events: AnimationEvent[];
}

/**
 * ResolvedParams represents the parameters passed to an effect.
 * Contains arbitrary key-value pairs specific to each effect type.
 */
export type ResolvedParams = Record<string, unknown>;

/**
 * Effect interface - single responsibility: execute and return result.
 * Effects are stateless, reusable objects that apply game logic.
 */
export interface Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    chainResults: Map<string, EffectResult>
  ): EffectResult;
}

/**
 * GameContext provides effects with access to game state.
 * Passed to all effects during execution.
 */
export interface GameContext {
  grid: BattleGrid;
  getEntity(id: string): Entity | undefined;
  getBeadHand(entityId: string): PlayerBeadSystem | undefined;
}
