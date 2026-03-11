import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { resolveMagicalEffect } from '@src/combat/MagicalResolver';

export class WarpEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const destination = params.destination as { x: number; y: number };
    const targetId = params.targetId as string | undefined;
    const swap = modifiers.swap as boolean | undefined;
    const other = modifiers.other as boolean | undefined;
    const extendedSelection = modifiers.extendedSelection as boolean | undefined;
    const extendedRange = modifiers.extendedRange as boolean | undefined;

    const baseRange = 6;
    const range = extendedRange ? 12 : baseRange;

    const casterPos = context.grid.getPosition(context.actorId!);
    if (!casterPos) {
      return {
        success: false,
        data: {},
        events: [],
      };
    }

    // Base teleportation (no swap, no other)
    if (!swap && !other) {
      const distance = Math.max(
        Math.abs(destination.x - casterPos.x),
        Math.abs(destination.y - casterPos.y)
      );

      if (distance > range) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      const occupant = context.grid.getEntityAt(destination.x, destination.y);
      if (occupant !== null) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      context.grid.moveEntity(context.actorId!, destination);
      return {
        success: true,
        data: { teleported: context.actorId },
        events: [],
      };
    }

    // Swap modifier
    if (swap && !other) {
      if (!targetId) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      const targetPos = context.grid.getPosition(targetId);
      if (!targetPos) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      const distance = Math.max(
        Math.abs(targetPos.x - casterPos.x),
        Math.abs(targetPos.y - casterPos.y)
      );

      if (distance > range) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      const targetEntity = context.getEntity(targetId);
      if (targetEntity && targetEntity.ward > 0) {
        const wardResult = resolveMagicalEffect({ intensity: 1 }, targetEntity.ward, 'enemy');
        if (!wardResult.manifests) {
          return {
            success: false,
            data: {},
            events: [],
          };
        }
      }

      context.grid.swapEntities(context.actorId!, targetId);
      return {
        success: true,
        data: { teleported: context.actorId, swappedWith: targetId },
        events: [],
      };
    }

    // Other modifier
    if (other) {
      if (!targetId) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      const targetPos = context.grid.getPosition(targetId);
      if (!targetPos) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      const targetDistance = Math.max(
        Math.abs(targetPos.x - casterPos.x),
        Math.abs(targetPos.y - casterPos.y)
      );

      const checkRange = extendedSelection ? range : 1;
      if (targetDistance > checkRange) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      const targetEntity = context.getEntity(targetId);
      if (targetEntity && targetEntity.ward > 0) {
        const wardResult = resolveMagicalEffect({ intensity: 1 }, targetEntity.ward, 'enemy');
        if (!wardResult.manifests) {
          return {
            success: false,
            data: {},
            events: [],
          };
        }
      }

      const destDistance = Math.max(
        Math.abs(destination.x - casterPos.x),
        Math.abs(destination.y - casterPos.y)
      );

      if (destDistance > range) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      // If swap is active, swap target with entity at destination
      if (swap) {
        const swapTargetId = context.grid.getEntityAt(destination.x, destination.y);
        if (!swapTargetId) {
          return { success: false, data: {}, events: [] };
        }

        // Ward check on swap target if it's an enemy
        const swapTargetEntity = context.getEntity(swapTargetId);
        if (swapTargetEntity && swapTargetEntity.ward > 0) {
          const wardResult = resolveMagicalEffect({ intensity: 1 }, swapTargetEntity.ward, 'enemy');
          if (!wardResult.manifests) {
            return { success: false, data: {}, events: [] };
          }
        }

        context.grid.swapEntities(targetId, swapTargetId);
        return {
          success: true,
          data: { teleported: targetId, swappedWith: swapTargetId },
          events: [],
        };
      }

      // No swap - teleport target to empty destination
      const occupant = context.grid.getEntityAt(destination.x, destination.y);
      if (occupant !== null) {
        return {
          success: false,
          data: {},
          events: [],
        };
      }

      context.grid.moveEntity(targetId, destination);
      return {
        success: true,
        data: { teleported: targetId },
        events: [],
      };
    }

    return {
      success: false,
      data: {},
      events: [],
    };
  }
}
