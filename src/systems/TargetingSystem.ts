import type { Position } from '@src/state/BattleGrid';

/**
 * Interface for dependencies that TargetingSystem needs.
 * This allows testing without Phaser and decouples from concrete implementations.
 */
export interface TargetingDeps {
  getValidMoves: (entityId: string, range: number) => Position[];
  highlightTiles: (tiles: Position[], color: number) => unknown;
  removeHighlight: (highlight: unknown) => void;
  worldToGrid: (world: number) => number;
  onPointerDown: (callback: (x: number, y: number) => void) => void;
  log: (message: string) => void;
}

/**
 * TargetingSystem handles tile selection for movement and targeting.
 *
 * It coordinates valid move calculation, visual highlighting, and user input
 * to return the selected position. Uses dependency injection for testability.
 */
export class TargetingSystem {
  private currentResolve: ((pos: Position | null) => void) | null = null;
  private currentHighlight: unknown = null;
  private validMoves: Position[] = [];

  constructor(private readonly deps: TargetingDeps) {}

  /**
   * Show tile targeting for movement/actions.
   * Highlights valid tiles and waits for user to click.
   * @param entityId - The entity selecting a target
   * @param range - Movement/action range
   * @param actionName - Name of the action for logging
   * @returns Promise that resolves to selected position or null if invalid/cancelled
   */
  showTileTargeting(entityId: string, range: number, actionName: string): Promise<Position | null> {
    // Get valid moves
    this.validMoves = this.deps.getValidMoves(entityId, range);

    // Highlight valid tiles (green = 0x00ff00)
    this.currentHighlight = this.deps.highlightTiles(this.validMoves, 0x00ff00);

    // Log the action prompt
    this.deps.log(`Targeting tiles for action: ${actionName}`);

    // Return promise that resolves on click
    return new Promise((resolve) => {
      this.currentResolve = resolve;

      this.deps.onPointerDown((worldX: number, worldY: number) => {
        const gridX = this.deps.worldToGrid(worldX);
        const gridY = this.deps.worldToGrid(worldY);

        // Check if clicked position is valid
        const isValid = this.validMoves.some((pos) => pos.x === gridX && pos.y === gridY);

        // Remove highlight
        if (this.currentHighlight) {
          this.deps.removeHighlight(this.currentHighlight);
          this.currentHighlight = null;
        }

        // Resolve with position or null
        if (isValid) {
          this.currentResolve = null;
          this.validMoves = [];
          resolve({ x: gridX, y: gridY });
        } else {
          this.currentResolve = null;
          this.validMoves = [];
          resolve(null);
        }
      });
    });
  }

  /**
   * Cancel current targeting, resolving with null.
   */
  cancel(): void {
    if (this.currentHighlight) {
      this.deps.removeHighlight(this.currentHighlight);
      this.currentHighlight = null;
    }

    if (this.currentResolve) {
      this.currentResolve(null);
      this.currentResolve = null;
    }

    this.validMoves = [];
  }

  /**
   * Check if targeting is currently active.
   */
  isActive(): boolean {
    return this.currentResolve !== null;
  }
}
