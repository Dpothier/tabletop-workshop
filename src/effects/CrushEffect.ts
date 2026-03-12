import type { Effect, EffectResult, GameContext } from '@src/types/Effect';

export class CrushEffect implements Effect {
  execute(
    _context: GameContext,
    params: Record<string, unknown>,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, unknown>
  ): EffectResult {
    const targetId = params.targetId as string;
    const guard = params.guard as number;

    if (!targetId) {
      return { success: false, data: {}, events: [] };
    }

    // Crush ignores Guard - effective guard is always 0
    return {
      success: true,
      data: { targetId, originalGuard: guard ?? 0, effectiveGuard: 0 },
      events: [],
    };
  }
}
