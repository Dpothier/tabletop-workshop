import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type { ZoneSystem } from '@src/systems/ZoneSystem';

export class SanctuaryEffect implements Effect {
  constructor(private zoneSystem: ZoneSystem) {}

  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const size = params.size as number;
    const casterId = context.actorId!;

    // Get caster's position
    const casterPos = context.grid.getPosition(casterId);
    if (!casterPos) {
      return {
        success: false,
        data: {},
        events: [],
      };
    }

    // Create the zone
    const zone = this.zoneSystem.createZone(casterId, casterPos.x, casterPos.y, size, 'sanctuary');

    // Calculate radius
    const radius: number = Math.floor(size / 2);

    // Find and push out all enemies in the zone
    for (let x = zone.centerX - radius; x <= zone.centerX + radius; x++) {
      for (let y = zone.centerY - radius; y <= zone.centerY + radius; y++) {
        const entityId = context.grid.getEntityAt(x, y);

        // Skip empty cells and the caster
        if (!entityId || entityId === casterId) {
          continue;
        }

        // Push the enemy out
        this.pushEnemyOut(context, entityId, x, y, zone, radius);
      }
    }

    return {
      success: true,
      data: { zoneId: zone.id },
      events: [],
    };
  }

  private pushEnemyOut(
    context: GameContext,
    enemyId: string,
    enemyX: number,
    enemyY: number,
    zone: { centerX: number; centerY: number },
    radius: number
  ): void {
    const enemy = context.getEntity(enemyId);
    if (!enemy) {
      return;
    }

    // Calculate push direction (from zone center to enemy)
    let dx = enemyX - zone.centerX;
    let dy = enemyY - zone.centerY;

    // Handle case where enemy is at center (use default direction)
    if (dx === 0 && dy === 0) {
      dx = 0;
      dy = -1;
    } else {
      // Normalize direction to unit vector
      dx = dx === 0 ? 0 : dx > 0 ? 1 : -1;
      dy = dy === 0 ? 0 : dy > 0 ? 1 : -1;
    }

    // Find the first position outside the zone along the push direction
    let pushX = enemyX + dx;
    let pushY = enemyY + dy;

    // Keep pushing until outside zone
    while (Math.abs(pushX - zone.centerX) <= radius && Math.abs(pushY - zone.centerY) <= radius) {
      pushX += dx;
      pushY += dy;
    }

    // Try to move the enemy to the push destination
    const moveResult = context.grid.moveEntity(enemyId, { x: pushX, y: pushY });

    if (!moveResult.success) {
      // If move fails, apply collision damage and try adjacent positions
      enemy.receiveDamage(1);

      // Try adjacent positions around the push direction
      const adjacentPositions = [
        { x: pushX - 1, y: pushY },
        { x: pushX + 1, y: pushY },
        { x: pushX, y: pushY - 1 },
        { x: pushX, y: pushY + 1 },
        { x: pushX - 1, y: pushY - 1 },
        { x: pushX - 1, y: pushY + 1 },
        { x: pushX + 1, y: pushY - 1 },
        { x: pushX + 1, y: pushY + 1 },
      ];

      for (const pos of adjacentPositions) {
        const fallbackResult = context.grid.moveEntity(enemyId, pos);
        if (fallbackResult.success) {
          return;
        }
      }
    }
  }
}
