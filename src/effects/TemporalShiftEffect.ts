import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { resolveMagicalEffect } from '@src/combat/MagicalResolver';

export class TemporalShiftEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const direction = params.direction as 'advance' | 'delay';
    const targetId = params.targetId as string | undefined;
    const aoe3x3 = modifiers.aoe3x3 as boolean | undefined;
    const aoe5x5 = modifiers.aoe5x5 as boolean | undefined;
    const intensity = modifiers.intensity as boolean | undefined;
    const allyAcceptance = modifiers.allyAcceptance as Map<string, boolean> | undefined;

    const wheel = context.getWheel?.();
    if (!wheel) {
      return { success: false, data: {}, events: [] };
    }

    const casterPos = context.grid.getPosition(context.actorId!);
    if (!casterPos) {
      return { success: false, data: {}, events: [] };
    }

    const shiftAmount = intensity ? 2 : 1;
    const affectedTargets: string[] = [];

    // Determine targets
    let targets: string[] = [];

    if (aoe3x3 || aoe5x5) {
      // AoE mode: find all entities within range
      const range = aoe5x5 ? 2 : 1; // 3x3 = distance 1, 5x5 = distance 2

      // Scan the area around caster
      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          if (dx === 0 && dy === 0) continue; // Skip caster's own position

          const checkX = casterPos.x + dx;
          const checkY = casterPos.y + dy;

          const entityId = context.grid.getEntityAt(checkX, checkY);
          if (entityId && entityId !== context.actorId) {
            targets.push(entityId);
          }
        }
      }
    } else if (targetId) {
      // Single target mode
      targets = [targetId];
    } else {
      return { success: false, data: {}, events: [] };
    }

    // Apply effect to each target
    for (const tid of targets) {
      const entity = context.getEntity(tid);
      if (!entity) continue;

      if (!wheel.hasEntity(tid)) continue;

      // Check if ally or enemy
      const isAlly = allyAcceptance?.has(tid);

      if (isAlly) {
        const accepts = allyAcceptance!.get(tid) ?? false;
        const wardResult = resolveMagicalEffect(
          { intensity: shiftAmount },
          entity.ward,
          'ally',
          accepts
        );
        if (!wardResult.manifests) continue;
      } else {
        // Enemy - ward check
        const wardResult = resolveMagicalEffect({ intensity: shiftAmount }, entity.ward, 'enemy');
        if (!wardResult.manifests) continue;
      }

      // Apply temporal shift
      if (direction === 'advance') {
        wheel.advanceEntity(tid, shiftAmount);
      } else {
        wheel.delayEntity(tid, shiftAmount);
      }

      affectedTargets.push(tid);
    }

    return {
      success: true,
      data: { affectedTargets, direction, shiftAmount },
      events: [],
    };
  }
}
