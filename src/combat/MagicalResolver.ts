export interface MagicalParams {
  intensity: number;
  ward: number;
  isAlly: boolean;
}

export interface MagicalResult {
  manifests: boolean;
  damage: number;
}

export function resolveMagicalEffect(params: MagicalParams): MagicalResult {
  // Ally targets voluntarily accept - skip ward check
  if (params.isAlly) {
    return {
      manifests: true,
      damage: params.intensity,
    };
  }

  // Enemy targets: intensity must exceed ward
  if (params.intensity > params.ward) {
    return {
      manifests: true,
      damage: params.intensity,
    };
  }

  return {
    manifests: false,
    damage: 0,
  };
}
