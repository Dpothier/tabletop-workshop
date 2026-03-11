import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

export class RebukeEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const guardTotal = params.guardTotal as number;
    const power = params.power as number;

    if (!targetId || !context.actorId) {
      return { success: false, data: {}, events: [] };
    }

    // Rebuke requires a successful block (guard > 0)
    if (guardTotal <= 0) {
      return { success: false, data: {}, events: [] };
    }

    const pushDistance = Math.max(0, guardTotal - power);

    if (pushDistance === 0) {
      return {
        success: true,
        data: { targetId, pushDistance: 0 },
        events: [],
      };
    }

    const bearerPos = context.grid.getPosition(context.actorId);
    const targetPos = context.grid.getPosition(targetId);
    if (!bearerPos || !targetPos) {
      return { success: false, data: {}, events: [] };
    }

    // Calculate direction: from bearer toward attacker
    const dx = targetPos.x - bearerPos.x;
    const dy = targetPos.y - bearerPos.y;
    const dirX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const dirY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

    let tilesMoved = 0;
    let currentX = targetPos.x;
    let currentY = targetPos.y;

    for (let i = 0; i < pushDistance; i++) {
      const nextX = currentX + dirX;
      const nextY = currentY + dirY;

      // Check bounds
      if (!context.grid.isInBounds(nextX, nextY)) {
        break;
      }

      // Check occupancy (obstacle or entity)
      const occupant = context.grid.getEntityAt(nextX, nextY);
      if (occupant !== null) {
        break;
      }

      // Move attacker one step
      context.grid.moveEntity(targetId, { x: nextX, y: nextY });
      currentX = nextX;
      currentY = nextY;
      tilesMoved++;
    }

    // Collision damage: 1 per remaining tile
    const remainingTiles = pushDistance - tilesMoved;
    if (remainingTiles > 0) {
      const target = context.getEntity(targetId);
      if (target) {
        target.receiveDamage(remainingTiles);
      }
    }

    return {
      success: true,
      data: {
        targetId,
        pushDistance,
        tilesMoved,
        collisionDamage: remainingTiles,
      },
      events: [],
    };
  }
}
