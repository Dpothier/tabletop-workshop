import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { validateTargeting } from '@src/combat/ActionPipeline';
import { resolveCast } from '@src/combat/CastResolver';
import { resolveMagicalEffect } from '@src/combat/MagicalResolver';
import type { AnimationEvent, AttackEvent, HitEvent, DamageEvent } from '@src/types/AnimationEvent';

/**
 * CastEffect — thin wrapper around spell resolution using Intensity vs Ward.
 * Supports both new parameter-based resolution and backward-compatible spellPower.
 */
export class CastEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetEntity as string;
    const range = (params.range as number) ?? 99; // Spells have unlimited range by default
    const attackerId = context.actorId!;

    // Spell params - support both new params and backward-compatible spellPower
    const baseDamage = (params.baseDamage as number) ?? (params.spellPower as number) ?? 1;
    const extraBeads = (params.extraBeads as number) ?? 0;
    const baseCost = (params.baseCost as number) ?? 0;
    const channelStacks = (params.channelStacks as number) ?? 0;
    const isAlly = (params.isAlly as boolean) ?? false;

    // Pipeline: validate targeting (ranged)
    const targeting = validateTargeting(context, attackerId, targetId, range);
    if (!targeting.valid) {
      return {
        success: false,
        reason: targeting.reason ?? 'target out of range',
        data: {},
        events: [],
      };
    }

    const target = context.getEntity(targetId);
    if (!target) {
      return { success: false, reason: 'Target not found', data: {}, events: [] };
    }

    // Get target's ward from buffs
    const targetWard = target.getStacks('ward');

    // Resolve cast: compute intensity and cost
    const castResult = resolveCast({
      baseCost,
      baseDamage,
      channelStacks,
      extraBeads,
      targetWard,
    });

    // Resolve magical effect: intensity vs ward gate check
    const magicalResult = resolveMagicalEffect({
      intensity: castResult.intensity,
      ward: targetWard,
      isAlly,
    });

    const events: AnimationEvent[] = [];

    // Add attack event for backward compatibility
    events.push({
      type: 'attack',
      attackerId,
      targetId,
      damage: magicalResult.damage,
    } as AttackEvent);

    let actualDamage = 0;

    if (magicalResult.manifests) {
      actualDamage = Math.min(magicalResult.damage, target.currentHealth);

      events.push({
        type: 'hit',
        entityId: targetId,
        attackerId,
        damage: actualDamage,
      } as HitEvent);

      events.push({
        type: 'damage',
        entityId: targetId,
        newHealth: target.currentHealth - actualDamage,
        maxHealth: target.maxHealth,
      } as DamageEvent);

      // Apply damage
      target.receiveDamage(actualDamage);
    }

    return {
      success: true,
      data: {
        hit: magicalResult.manifests,
        damage: actualDamage,
        outcome: magicalResult.manifests ? 'hit' : 'blocked',
        intensity: castResult.intensity,
        effectiveCost: castResult.effectiveCost,
        manifests: magicalResult.manifests,
        blocked: !magicalResult.manifests,
      },
      events,
    };
  }
}
