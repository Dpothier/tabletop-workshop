import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

/**
 * RiposteEffect - Post-guard reaction that inflicts direct damage to attacker
 *
 * MFG-36: Buckler with Block and Riposte
 * - Cost: 1 green bead
 * - Only available after successful Block (guardOutcome must be "guarded")
 * - Inflicts 1 direct damage to attacker (no attack roll)
 *
 * Params: { targetId: string, guardOutcome: "guarded" | "hit" | "dodged" }
 */
export class RiposteEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const guardOutcome = params.guardOutcome as string;

    if (!targetId || !context.actorId) {
      return { success: false, data: {}, events: [] };
    }

    // Riposte only triggers after a successful block (guarded outcome)
    if (guardOutcome !== 'guarded') {
      return { success: false, data: {}, events: [] };
    }

    const target = context.getEntity(targetId);
    if (!target) {
      return { success: false, data: {}, events: [] };
    }

    // Inflict 1 direct damage to the attacker
    target.receiveDamage(1);

    return {
      success: true,
      data: {
        targetId,
        damage: 1,
      },
      events: [],
    };
  }
}
