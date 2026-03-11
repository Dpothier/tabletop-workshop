import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { resolveMagicalEffect } from '@src/combat/MagicalResolver';

export class PhoenixBurstEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetPosition = params.targetPosition as { x: number; y: number };
    const ignite = modifiers.ignite as boolean | undefined;
    const allyAcceptance = modifiers.allyAcceptance as Map<string, boolean> | undefined;

    if (!targetPosition) {
      return { success: false, data: {}, events: [] };
    }

    const hitTargets: string[] = [];

    // Scan all 8 adjacent cells around the target position
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const checkX = targetPosition.x + dx;
        const checkY = targetPosition.y + dy;

        const entityId = context.grid.getEntityAt(checkX, checkY);
        if (!entityId) continue;

        // Skip the caster
        if (entityId === context.actorId) continue;

        const entity = context.getEntity(entityId);
        if (!entity) continue;

        // Determine if this entity is an ally (has acceptance entry) or enemy
        const isAlly = allyAcceptance?.has(entityId);

        if (isAlly) {
          const accepts = allyAcceptance!.get(entityId) ?? false;
          const wardResult = resolveMagicalEffect({ intensity: 1 }, entity.ward, 'ally', accepts);
          if (!wardResult.manifests) continue;
        } else {
          // Enemy - ward check
          const wardResult = resolveMagicalEffect({ intensity: 1 }, entity.ward, 'enemy');
          if (!wardResult.manifests) continue;
        }

        // Apply 1 damage
        entity.receiveDamage(1);
        hitTargets.push(entityId);

        // Apply burn if ignite is active
        if (ignite) {
          entity.addStacks('burn', 1);
        }
      }
    }

    return {
      success: true,
      data: { hitTargets },
      events: [],
    };
  }
}
