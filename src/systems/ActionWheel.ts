/**
 * Represents an entity's position on the action wheel
 */
export interface WheelEntry {
  readonly id: string;
  position: number;
  arrivalOrder: number;
}

/**
 * Action Wheel System
 *
 * Tracks creature positions on an 8-segment circular wheel.
 * Turn order is determined by wheel position (lowest acts first)
 * with FIFO arrival order for tie-breaking.
 */
export class ActionWheel {
  private readonly entries: Map<string, WheelEntry> = new Map();
  private arrivalCounter = 0;

  /**
   * Add an entity to the wheel at a specific position.
   * @param id - Unique identifier for the entity
   * @param position - Starting position (0-7)
   * @throws Error if entity with same ID already exists
   */
  addEntity(id: string, position: number): void {
    if (this.entries.has(id)) {
      throw new Error(`Entity with id "${id}" already exists on the wheel`);
    }
    this.entries.set(id, {
      id,
      position: position % 8,
      arrivalOrder: this.arrivalCounter++,
    });
  }

  /**
   * Remove an entity from the wheel.
   * @param id - Entity identifier to remove
   */
  removeEntity(id: string): void {
    this.entries.delete(id);
  }

  /**
   * Advance an entity's position by a cost amount with wrap-around at 8.
   * Also updates the entity's arrival order to place it behind others at the new position.
   * @param id - Entity identifier
   * @param cost - Number of segments to advance
   * @throws Error if entity does not exist
   */
  advanceEntity(id: string, cost: number): void {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Entity with id "${id}" does not exist on the wheel`);
    }
    entry.position = (entry.position + cost) % 8;
    entry.arrivalOrder = this.arrivalCounter++;
  }

  /**
   * Get the next actor (entity at lowest position, FIFO on ties).
   * @returns Entity ID of next actor, or null if wheel is empty
   */
  getNextActor(): string | null {
    if (this.entries.size === 0) {
      return null;
    }

    const allEntries = Array.from(this.entries.values());

    // Find the lowest position
    let lowestPosition = Infinity;
    for (const entry of allEntries) {
      if (entry.position < lowestPosition) {
        lowestPosition = entry.position;
      }
    }

    // Filter to entities at lowest position
    const atLowest = allEntries.filter((e) => e.position === lowestPosition);

    // Sort by arrival order (FIFO)
    atLowest.sort((a, b) => a.arrivalOrder - b.arrivalOrder);

    return atLowest[0].id;
  }

  /**
   * Get the position of an entity.
   * @param id - Entity identifier
   * @returns Position (0-7) or undefined if entity not found
   */
  getPosition(id: string): number | undefined {
    return this.entries.get(id)?.position;
  }

  /**
   * Get the arrival order of an entity.
   * @param id - Entity identifier
   * @returns Arrival order or undefined if entity not found
   */
  getArrivalOrder(id: string): number | undefined {
    return this.entries.get(id)?.arrivalOrder;
  }

  /**
   * Get all entities on the wheel.
   * @returns Copy of all wheel entries
   */
  getAllEntities(): WheelEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get all entities at a specific position, sorted by arrival order.
   * @param position - Position to query (0-7)
   * @returns Entries at that position, sorted by arrival order
   */
  getEntitiesAtPosition(position: number): WheelEntry[] {
    return Array.from(this.entries.values())
      .filter((e) => e.position === position)
      .sort((a, b) => a.arrivalOrder - b.arrivalOrder);
  }

  /**
   * Check if an entity exists on the wheel.
   * @param id - Entity identifier
   * @returns True if entity exists
   */
  hasEntity(id: string): boolean {
    return this.entries.has(id);
  }
}
