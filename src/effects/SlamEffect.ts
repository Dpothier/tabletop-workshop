import type { Effect, EffectResult, GameContext } from '@src/types/Effect';

export class SlamEffect implements Effect {
  execute(
    context: GameContext,
    params: Record<string, unknown>,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, unknown>
  ): EffectResult {
    const targetId = params.targetId as string;
    const direction = params.direction as { dx: number; dy: number } | undefined;

    if (!targetId || !context.grid) {
      return { success: false, data: {}, events: [] };
    }

    const targetPos = context.grid.getPosition(targetId);
    if (!targetPos) {
      return { success: false, data: {}, events: [] };
    }

    // Calculate push direction from bearer to target if not provided
    let dx = direction?.dx ?? 0;
    let dy = direction?.dy ?? 0;

    if (!direction && context.actorId) {
      const bearerPos = context.grid.getPosition(context.actorId);
      if (bearerPos) {
        const rawDx = targetPos.x - bearerPos.x;
        const rawDy = targetPos.y - bearerPos.y;
        dx = rawDx === 0 ? 0 : rawDx > 0 ? 1 : -1;
        dy = rawDy === 0 ? 0 : rawDy > 0 ? 1 : -1;
      }
    }

    if (dx === 0 && dy === 0) {
      return { success: true, data: { targetId, pushDistance: 0 }, events: [] };
    }

    // Try to push target 1 tile
    const newX = targetPos.x + dx;
    const newY = targetPos.y + dy;

    // Check if destination is valid
    if (!context.grid.isInBounds(newX, newY)) {
      // Collision with wall - 1 damage
      const target = context.getEntity(targetId);
      if (target) {
        target.receiveDamage(1);
      }
      return {
        success: true,
        data: { targetId, pushDistance: 0, collisionDamage: 1 },
        events: [],
      };
    }

    const occupant = context.grid.getEntityAt(newX, newY);
    if (occupant) {
      // Collision with entity or obstacle - 1 damage
      const target = context.getEntity(targetId);
      if (target) {
        target.receiveDamage(1);
      }
      return {
        success: true,
        data: { targetId, pushDistance: 0, collisionDamage: 1 },
        events: [],
      };
    }

    // Move target
    context.grid.moveEntity(targetId, { x: newX, y: newY });
    return {
      success: true,
      data: { targetId, pushDistance: 1, collisionDamage: 0 },
      events: [],
    };
  }
}
