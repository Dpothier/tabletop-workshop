import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { validateTargeting } from '@src/combat/ActionPipeline';
import { resolveSpellCast } from '@src/combat/CastResolver';
import type { AnimationEvent, AttackEvent, HitEvent, DamageEvent } from '@src/types/AnimationEvent';

/**
 * CastEffect — thin wrapper around spell resolution using CastResolver.
 * CastResolver handles cost reduction, intensity, damage, ward check, and ally logic.
 */
export class CastEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetEntity as string;
    const range = (params.range as number) ?? 99;
    const attackerId = context.actorId!;

    const baseDamage = (params.baseDamage as number) ?? (params.spellPower as number) ?? 1;
    const extraBeads = (params.extraBeads as number) ?? 0;
    const baseCost = (params.baseCost as number) ?? 0;
    const channelStacks = (params.channelStacks as number) ?? 0;
    const isAlly = (params.isAlly as boolean) ?? false;

    // Pipeline: validate targeting
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

    const targetWard = target.getWard();

    // Build spell definition for the resolver
    const spellDef = {
      id: (params.spellId as string) ?? 'spell',
      name: (params.spellName as string) ?? 'Spell',
      color: ((params.spellColor as string) ?? 'blue') as import('@src/types/Beads').BeadColor,
      baseCost,
      baseDamage,
      range: range,
      targetType: (isAlly ? 'ally' : 'enemy') as 'enemy' | 'ally' | 'any',
      enhancements: (params.spellEnhancements as Record<string, { extraDamage?: number }>) ?? {},
    };

    // CastResolver handles everything: cost, intensity, damage, ward, ally logic
    const castResult = resolveSpellCast(
      {
        spell: spellDef,
        extraBeads,
        channelStacks,
        enhancements: (params.selectedEnhancements as string[]) ?? [],
      },
      { ward: targetWard },
      isAlly ? 'ally' : 'enemy',
      isAlly ? true : undefined
    );

    const events: AnimationEvent[] = [];
    const manifests = castResult.outcome === 'hit';

    events.push({
      type: 'attack',
      attackerId,
      targetId,
      damage: castResult.damage,
    } as AttackEvent);

    let actualDamage = 0;

    if (manifests) {
      actualDamage = Math.min(castResult.damage, target.currentHealth);

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

      target.receiveDamage(actualDamage);
    }

    return {
      success: true,
      data: {
        hit: manifests,
        damage: actualDamage,
        outcome: castResult.outcome,
        intensity: castResult.intensity,
        effectiveCost: castResult.effectiveCost,
        manifests,
        blocked: !manifests,
      },
      events,
    };
  }
}
