export class GridSystem {
  private readonly gridSize: number;
  private readonly offsetX: number;
  private readonly offsetY: number;
  private readonly arenaWidth: number;
  private readonly arenaHeight: number;

  constructor(
    gridSize: number,
    offsetX: number,
    offsetY: number,
    arenaWidth: number,
    arenaHeight: number
  ) {
    this.gridSize = gridSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;
  }

  gridToWorld(gridCoord: number): number {
    return this.offsetX + gridCoord * this.gridSize + this.gridSize / 2;
  }

  worldToGrid(worldCoord: number): number {
    return Math.floor((worldCoord - this.offsetX) / this.gridSize);
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.arenaWidth && y >= 0 && y < this.arenaHeight;
  }

  getGridSize(): number {
    return this.gridSize;
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  getArenaDimensions(): { width: number; height: number } {
    return { width: this.arenaWidth, height: this.arenaHeight };
  }
}
