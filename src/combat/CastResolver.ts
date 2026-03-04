import type { SpellDefinition } from '@src/types/SpellDefinition';

/**
 * Input for spell cast resolution.
 */
export interface CastInput {
  spell: SpellDefinition;
  extraBeads: number;
  channelStacks: number;
  enhancements: string[];
}

/**
 * Ward defensive stats against magic.
 */
export interface WardStats {
  ward: number;
}

/**
 * Result of spell cast resolution.
 */
export interface CastResult {
  outcome: 'hit' | 'warded' | 'resisted';
  damage: number;
  intensity: number;
  effectiveCost: number;
}

/**
 * Resolves a spell cast against a target.
 *
 * Spell Cast Resolution Flow:
 * 1. Calculate effective cost: max(0, baseCost - channelStacks)
 * 2. Calculate intensity: 1 + extraBeads
 * 3. Sum enhancement damage from selected enhancements
 * 4. Calculate raw damage: (baseDamage + enhancementDamage) * intensity
 * 5. Check ally resistance: if ally and not accepts, return resisted
 * 6. Check ally acceptance: if ally and accepts, skip ward, return hit
 * 7. Check ward: if ward >= rawDamage, return warded
 * 8. Calculate final damage: rawDamage - ward, return hit
 */
export function resolveSpellCast(
  input: CastInput,
  ward: WardStats,
  targetType: 'enemy' | 'ally',
  allyAccepts?: boolean
): CastResult {
  // Step 1: Calculate effective cost
  const effectiveCost: number = Math.max(0, input.spell.baseCost - input.channelStacks);

  // Step 2: Calculate intensity
  const intensity: number = 1 + input.extraBeads;

  // Step 3: Sum enhancement damage
  let enhancementDamage: number = 0;
  if (input.spell.enhancements) {
    for (const enhancementId of input.enhancements) {
      const enhancement = input.spell.enhancements[enhancementId];
      if (enhancement?.extraDamage) {
        enhancementDamage += enhancement.extraDamage;
      }
    }
  }

  // Step 4: Calculate raw damage
  const rawDamage: number = (input.spell.baseDamage + enhancementDamage) * intensity;

  // Step 5: Check ally resistance
  if (targetType === 'ally' && allyAccepts !== true) {
    return {
      outcome: 'resisted',
      damage: 0,
      intensity,
      effectiveCost,
    };
  }

  // Step 6: Check ally acceptance (skip ward check)
  if (targetType === 'ally' && allyAccepts === true) {
    return {
      outcome: 'hit',
      damage: rawDamage,
      intensity,
      effectiveCost,
    };
  }

  // Step 7: Check ward
  if (ward.ward >= rawDamage) {
    return {
      outcome: 'warded',
      damage: 0,
      intensity,
      effectiveCost,
    };
  }

  // Step 8: Calculate final damage and return hit
  const damage: number = rawDamage - ward.ward;

  return {
    outcome: 'hit',
    damage,
    intensity,
    effectiveCost,
  };
}
