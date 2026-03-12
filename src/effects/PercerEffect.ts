import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

/**
 * PercerEffect: Ignores Armor when target has no Guard and no Evasion.
 * Used as a modifier on light weapons that pierces through armor
 * when the defender has no defensive capabilities.
 *
 * Params: { targetId, guard, evasion, armor }
 * Returns: EffectResult with effectiveArmor (0 if pierces, original armor otherwise)
 */
export class PercerEffect implements Effect {
  execute(
    _context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const guard = (params.guard as number) ?? 0;
    const evasion = (params.evasion as number) ?? 0;
    const armor = (params.armor as number) ?? 0;

    if (!targetId) {
      return { success: false, data: {}, events: [] };
    }

    // Percer only ignores armor when target has no defensive capabilities
    const canPierce = guard === 0 && evasion === 0;
    const effectiveArmor = canPierce ? 0 : armor;

    return {
      success: true,
      data: {
        targetId,
        canPierce,
        originalArmor: armor,
        effectiveArmor,
        guard,
        evasion,
      },
      events: [],
    };
  }
}
