import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

export class SweepEffect implements Effect {
  execute(
    _context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetIds = params.targetIds as string[];

    return {
      success: true,
      data: {
        targetsHit: targetIds.length,
        targetIds,
      },
      events: [],
    };
  }
}
