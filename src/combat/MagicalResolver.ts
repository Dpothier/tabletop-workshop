/**
 * Magical Combat Resolution (MFG-13)
 *
 * This module implements the Intensity vs Ward system for magical effects.
 * It determines whether a spell's magical effect manifests on a target.
 *
 * Resolution Logic:
 * 1. If targetType is 'ally' and allyAccepts is false: effect does NOT manifest (resisted)
 * 2. If targetType is 'ally' and allyAccepts is true: effect MANIFESTS (ward bypassed)
 * 3. If targetType is 'enemy': effect manifests if intensity > ward (strictly greater)
 */

export interface MagicalInput {
  /**
   * Calculated intensity: base intensity (1) + extra beads spent
   * At minimum 0
   */
  intensity: number;
}

export interface MagicalResult {
  /**
   * Whether the magical effect successfully manifested on the target
   */
  manifests: boolean;

  /**
   * The calculated intensity used in resolution
   */
  intensity: number;

  /**
   * The target's ward defense value
   */
  ward: number;
}

/**
 * Resolve whether a magical effect manifests on a target.
 *
 * @param input The magical input containing intensity
 * @param ward The target's magical defense stat
 * @param targetType Whether the target is an 'enemy' or 'ally'
 * @param allyAccepts Optional: For ally targets, whether they accept the effect
 * @returns MagicalResult indicating if the effect manifests
 */
export function resolveMagicalEffect(
  input: MagicalInput,
  ward: number,
  targetType: 'enemy' | 'ally',
  allyAccepts?: boolean
): MagicalResult {
  let manifests: boolean;

  if (targetType === 'ally') {
    manifests = allyAccepts === true;
  } else {
    manifests = input.intensity > ward;
  }

  return {
    manifests,
    intensity: input.intensity,
    ward,
  };
}
