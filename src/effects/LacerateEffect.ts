import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

/**
 * LacerateEffect: Applies Bleed stacks on hit.
 * Used by Slicing Dagger to apply status effects.
 *
 * Params: { targetId, hitOutcome } - The entity to apply Bleed to and whether the attack hit
 * Returns: EffectResult with success=true and bleedApplied flag
 */
export class LacerateEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const hitOutcome = params.hitOutcome as string;

    if (!targetId) {
      return { success: false, data: {}, events: [] };
    }

    // Lacerate only applies on hit
    if (hitOutcome !== 'hit') {
      return {
        success: true,
        data: { targetId, bleedApplied: false, hitOutcome },
        events: [],
      };
    }

    const target = context.getEntity(targetId);
    if (!target) {
      return { success: false, data: {}, events: [] };
    }

    // Apply 1 Bleed stack
    target.addStacks('bleed', 1);
    return {
      success: true,
      data: { targetId, bleedApplied: true, bleedStacks: target.getStacks('bleed') },
      events: [],
    };
  }
}
