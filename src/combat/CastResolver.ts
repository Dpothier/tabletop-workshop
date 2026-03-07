export interface CastParams {
  baseCost: number;
  baseDamage: number;
  channelStacks: number;
  extraBeads: number;
  targetWard: number;
}

export interface CastResult {
  effectiveCost: number;
  intensity: number;
  damage: number;
}

export function resolveCast(params: CastParams): CastResult {
  const effectiveCost: number = Math.max(0, params.baseCost - params.channelStacks);
  const intensity: number = params.baseDamage + params.extraBeads;
  const damage: number = intensity;

  return {
    effectiveCost,
    intensity,
    damage,
  };
}
