import Phaser from 'phaser';
import type { Arena } from '@src/systems/DataLoader';
import type { GridSystem } from '@src/systems/GridSystem';
import type { Position } from '@src/state/BattleGrid';

export interface GridVisualConfig {
  arena: Arena;
  gridSystem: GridSystem;
}

export class GridVisual {
  private static readonly TERRAIN_COLORS: Record<string, number> = {
    normal: 0x3d3d5c,
    hazard: 0x8b0000,
    difficult: 0x4a4a2a,
    elevated: 0x2a4a4a,
    pit: 0x1a1a1a,
  };

  private static readonly LINE_COLOR = 0x5a5a7a;
  private static readonly LINE_WIDTH = 2;
  private static readonly LINE_ALPHA = 0.7;
  private static readonly TERRAIN_ALPHA = 0.3;

  private readonly scene: Phaser.Scene;
  private readonly arena: Arena;
  private readonly gridSystem: GridSystem;
  private readonly container: Phaser.GameObjects.Container;
  private readonly gridGraphics: Phaser.GameObjects.Graphics;
  private readonly highlights: Set<Phaser.GameObjects.Graphics>;

  constructor(scene: Phaser.Scene, config: GridVisualConfig) {
    this.scene = scene;
    this.arena = config.arena;
    this.gridSystem = config.gridSystem;
    this.highlights = new Set();

    this.container = scene.add.container(0, 0);
    this.container.setDepth(-1);

    this.gridGraphics = scene.add.graphics();
    this.container.add(this.gridGraphics);
  }

  draw(): void {
    this.drawTerrain();
    this.drawGridLines();
  }

  highlightTiles(
    tiles: Position[],
    color: number,
    alpha: number = 0.2
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, alpha);

    const gridSize = this.gridSystem.getGridSize();
    const offset = this.gridSystem.getOffset();
    const inset = 2;

    for (const tile of tiles) {
      const x = offset.x + tile.x * gridSize + inset;
      const y = offset.y + tile.y * gridSize + inset;
      const width = gridSize - inset * 2;
      const height = gridSize - inset * 2;

      graphics.fillRect(x, y, width, height);
    }

    this.container.add(graphics);
    this.highlights.add(graphics);
    return graphics;
  }

  removeHighlight(graphics: Phaser.GameObjects.Graphics): void {
    if (this.highlights.has(graphics)) {
      graphics.destroy();
      this.highlights.delete(graphics);
    }
  }

  clearAllHighlights(): void {
    for (const highlight of this.highlights) {
      highlight.destroy();
    }
    this.highlights.clear();
  }

  getTerrainColor(type: string): number {
    return GridVisual.TERRAIN_COLORS[type] ?? GridVisual.TERRAIN_COLORS.normal;
  }

  destroy(): void {
    this.clearAllHighlights();
    this.container.destroy(true);
  }

  private drawTerrain(): void {
    const gridSize = this.gridSystem.getGridSize();
    const offset = this.gridSystem.getOffset();
    const { width: cols, height: rows } = this.gridSystem.getArenaDimensions();

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const terrainType = this.arena.terrain?.[y]?.[x] ?? 'normal';
        const color = this.getTerrainColor(terrainType);

        const rectX = offset.x + x * gridSize;
        const rectY = offset.y + y * gridSize;

        this.gridGraphics.fillStyle(color, GridVisual.TERRAIN_ALPHA);
        this.gridGraphics.fillRect(rectX, rectY, gridSize, gridSize);
      }
    }
  }

  private drawGridLines(): void {
    const gridSize = this.gridSystem.getGridSize();
    const offset = this.gridSystem.getOffset();
    const { width: cols, height: rows } = this.gridSystem.getArenaDimensions();

    this.gridGraphics.lineStyle(
      GridVisual.LINE_WIDTH,
      GridVisual.LINE_COLOR,
      GridVisual.LINE_ALPHA
    );

    // Vertical lines
    for (let x = 0; x <= cols; x++) {
      const lineX = offset.x + x * gridSize;
      const startY = offset.y;
      const endY = offset.y + rows * gridSize;

      this.gridGraphics.lineBetween(lineX, startY, lineX, endY);
    }

    // Horizontal lines
    for (let y = 0; y <= rows; y++) {
      const lineY = offset.y + y * gridSize;
      const startX = offset.x;
      const endX = offset.x + cols * gridSize;

      this.gridGraphics.lineBetween(startX, lineY, endX, lineY);
    }

    this.gridGraphics.strokePath();
  }
}
