import { GridSystem } from './GridSystem';

export interface Position {
  x: number;
  y: number;
}

export class MovementValidator {
  private readonly gridSystem: GridSystem;
  private readonly getOccupiedPositions: () => Position[];

  constructor(gridSystem: GridSystem, getOccupiedPositions: () => Position[]) {
    this.gridSystem = gridSystem;
    this.getOccupiedPositions = getOccupiedPositions;
  }

  isValidMove(fromX: number, fromY: number, toX: number, toY: number, speed: number): boolean {
    // Check if destination is valid position
    if (!this.gridSystem.isValidPosition(toX, toY)) {
      return false;
    }

    // Calculate Manhattan distance
    const distance = Math.abs(toX - fromX) + Math.abs(toY - fromY);

    // Must move at least 1 tile and within speed
    if (distance === 0 || distance > speed) {
      return false;
    }

    // Check if destination is occupied
    if (this.isOccupied(toX, toY)) {
      return false;
    }

    return true;
  }

  getValidMoves(fromX: number, fromY: number, speed: number): Position[] {
    const validMoves: Position[] = [];

    for (let dx = -speed; dx <= speed; dx++) {
      for (let dy = -speed; dy <= speed; dy++) {
        const toX = fromX + dx;
        const toY = fromY + dy;

        if (this.isValidMove(fromX, fromY, toX, toY, speed)) {
          validMoves.push({ x: toX, y: toY });
        }
      }
    }

    return validMoves;
  }

  isOccupied(x: number, y: number): boolean {
    const occupied = this.getOccupiedPositions();
    return occupied.some((pos) => pos.x === x && pos.y === y);
  }
}
