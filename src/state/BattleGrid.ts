/**
 * Represents a 2D position on the battle grid.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Result of a move operation.
 */
export interface MoveResult {
  success: boolean;
  reason?: 'out of bounds' | 'occupied';
}

/**
 * BattleGrid is the single source of truth for entity positions on the battle map.
 * It manages registration, movement, and spatial queries for all entities.
 */
export class BattleGrid {
  private readonly width: number;
  private readonly height: number;
  private readonly positions = new Map<string, Position>();
  private readonly occupancy = new Map<string, string>(); // "x,y" -> entityId

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Register an entity at a specific position.
   * @param entityId Unique identifier for the entity
   * @param x X coordinate
   * @param y Y coordinate
   */
  register(entityId: string, x: number, y: number): void {
    const position = { x, y };
    this.positions.set(entityId, position);
    this.occupancy.set(this.positionKey(x, y), entityId);
  }

  /**
   * Remove an entity from the grid.
   * Does not throw if entity doesn't exist.
   * @param entityId Unique identifier for the entity
   */
  unregister(entityId: string): void {
    const position = this.positions.get(entityId);
    if (position) {
      this.occupancy.delete(this.positionKey(position.x, position.y));
      this.positions.delete(entityId);
    }
  }

  /**
   * Get the position of an entity.
   * @param entityId Unique identifier for the entity
   * @returns Position or null if entity is not registered
   */
  getPosition(entityId: string): Position | null {
    return this.positions.get(entityId) ?? null;
  }

  /**
   * Get the entity at a specific position.
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Entity ID or null if position is empty
   */
  getEntityAt(x: number, y: number): string | null {
    return this.occupancy.get(this.positionKey(x, y)) ?? null;
  }

  /**
   * Move an entity to a new position.
   * Validates bounds and occupancy before moving.
   * @param entityId Unique identifier for the entity
   * @param dest Destination position
   * @returns MoveResult indicating success or failure reason
   */
  moveEntity(entityId: string, dest: Position): MoveResult {
    // Check bounds
    if (!this.isInBounds(dest.x, dest.y)) {
      return { success: false, reason: 'out of bounds' };
    }

    // Check occupancy
    const occupant = this.getEntityAt(dest.x, dest.y);
    if (occupant !== null && occupant !== entityId) {
      return { success: false, reason: 'occupied' };
    }

    // Get current position and update
    const currentPos = this.positions.get(entityId);
    if (currentPos) {
      this.occupancy.delete(this.positionKey(currentPos.x, currentPos.y));
    }

    this.positions.set(entityId, dest);
    this.occupancy.set(this.positionKey(dest.x, dest.y), entityId);

    return { success: true };
  }

  /**
   * Calculate the Manhattan distance between two entities.
   * @param id1 First entity ID
   * @param id2 Second entity ID
   * @returns Manhattan distance, or -1 if either entity is not found
   */
  getDistance(id1: string, id2: string): number {
    const pos1 = this.positions.get(id1);
    const pos2 = this.positions.get(id2);

    if (!pos1 || !pos2) {
      return -1;
    }

    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  /**
   * Check if two entities are adjacent (Manhattan distance === 1).
   * @param id1 First entity ID
   * @param id2 Second entity ID
   * @returns True if adjacent, false otherwise
   */
  isAdjacent(id1: string, id2: string): boolean {
    return this.getDistance(id1, id2) === 1;
  }

  /**
   * Get all valid move positions for an entity within a given range.
   * Excludes current position and occupied positions.
   * @param entityId Entity ID
   * @param range Maximum Manhattan distance
   * @returns Array of valid positions
   */
  getValidMoves(entityId: string, range: number): Position[] {
    const currentPos = this.positions.get(entityId);
    if (!currentPos) {
      return [];
    }

    const validMoves: Position[] = [];

    // Check all positions within range
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        // Skip if exceeds Manhattan distance
        if (Math.abs(dx) + Math.abs(dy) > range) {
          continue;
        }

        // Skip current position
        if (dx === 0 && dy === 0) {
          continue;
        }

        const x = currentPos.x + dx;
        const y = currentPos.y + dy;

        // Check bounds
        if (!this.isInBounds(x, y)) {
          continue;
        }

        // Check occupancy
        if (this.getEntityAt(x, y) !== null) {
          continue;
        }

        validMoves.push({ x, y });
      }
    }

    return validMoves;
  }

  /**
   * Check if a position is within grid bounds.
   * @param x X coordinate
   * @param y Y coordinate
   * @returns True if in bounds
   */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Create a unique string key for a position.
   */
  private positionKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}
