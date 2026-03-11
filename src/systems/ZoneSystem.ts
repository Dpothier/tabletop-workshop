import type { BattleGrid } from '@src/state/BattleGrid';

export interface Zone {
  id: string;
  ownerId: string;
  centerX: number;
  centerY: number;
  size: number;
  type: string;
}

export class ZoneSystem {
  private zones: Map<string, Zone> = new Map();
  private nextId: number = 1;

  createZone(ownerId: string, x: number, y: number, size: number, type: string): Zone {
    const id = `zone-${this.nextId}`;
    this.nextId++;

    const zone: Zone = {
      id,
      ownerId,
      centerX: x,
      centerY: y,
      size,
      type,
    };

    this.zones.set(id, zone);
    return zone;
  }

  getZoneById(zoneId: string): Zone | undefined {
    return this.zones.get(zoneId);
  }

  isInZone(x: number, y: number, zone: Zone): boolean {
    const radius: number = Math.floor(zone.size / 2);
    return Math.abs(x - zone.centerX) <= radius && Math.abs(y - zone.centerY) <= radius;
  }

  canEnter(entityId: string, x: number, y: number, zone: Zone): boolean {
    if (entityId === zone.ownerId) {
      return true;
    }
    return !this.isInZone(x, y, zone);
  }

  moveZone(zoneId: string, newX: number, newY: number): void {
    const zone = this.zones.get(zoneId);
    if (zone) {
      zone.centerX = newX;
      zone.centerY = newY;
    }
  }

  removeZone(zoneId: string): void {
    this.zones.delete(zoneId);
  }

  getZonesAt(x: number, y: number): Zone[] {
    const result: Zone[] = [];
    for (const zone of this.zones.values()) {
      if (this.isInZone(x, y, zone)) {
        result.push(zone);
      }
    }
    return result;
  }

  canEnterAny(entityId: string, x: number, y: number): boolean {
    for (const zone of this.zones.values()) {
      if (!this.canEnter(entityId, x, y, zone)) {
        return false;
      }
    }
    return true;
  }

  getZonesByOwner(ownerId: string): Zone[] {
    const result: Zone[] = [];
    for (const zone of this.zones.values()) {
      if (zone.ownerId === ownerId) {
        result.push(zone);
      }
    }
    return result;
  }

  removeZonesByOwner(ownerId: string): void {
    for (const [id, zone] of this.zones.entries()) {
      if (zone.ownerId === ownerId) {
        this.zones.delete(id);
      }
    }
  }

  moveZonesWithOwner(ownerId: string, newX: number, newY: number): void {
    for (const zone of this.zones.values()) {
      if (zone.ownerId === ownerId) {
        zone.centerX = newX;
        zone.centerY = newY;
      }
    }
  }

  /**
   * Repel an enemy from a zone, pushing them outside the zone boundary
   */
  repelBreach(zoneId: string, enemyId: string, grid: BattleGrid): boolean {
    const zone = this.zones.get(zoneId);
    if (!zone) return false;

    const enemyPos = grid.getPosition(enemyId);
    if (!enemyPos) return false;

    const radius = Math.floor(zone.size / 2);

    // Calculate push direction from zone center to enemy
    let dx = enemyPos.x - zone.centerX;
    let dy = enemyPos.y - zone.centerY;
    if (dx === 0 && dy === 0) {
      dx = 0;
      dy = -1;
    } else {
      dx = dx === 0 ? 0 : dx > 0 ? 1 : -1;
      dy = dy === 0 ? 0 : dy > 0 ? 1 : -1;
    }

    // Find position outside zone
    let pushX = enemyPos.x + dx;
    let pushY = enemyPos.y + dy;
    while (Math.abs(pushX - zone.centerX) <= radius && Math.abs(pushY - zone.centerY) <= radius) {
      pushX += dx;
      pushY += dy;
    }

    const result = grid.moveEntity(enemyId, { x: pushX, y: pushY });
    return result.success;
  }
}
