import { Entity } from '@src/entities/Entity';

export class PreparationManager {
  private readonly maxStacks: number;

  constructor(maxStacks: number = 3) {
    this.maxStacks = maxStacks;
  }

  addStacks(entity: Entity, prepType: string, count: number): void {
    const current = entity.getStacks(prepType);
    const newTotal = Math.min(current + count, this.maxStacks);
    entity.clearStacks(prepType);
    if (newTotal > 0) {
      entity.addStacks(prepType, newTotal);
    }
  }

  getStacks(entity: Entity, prepType: string): number {
    return entity.getStacks(prepType);
  }

  clearStacks(entity: Entity, prepType: string): void {
    entity.clearStacks(prepType);
  }

  interruptAll(entity: Entity): void {
    entity.clearAll();
  }

  hasPairedStacks(entity: Entity, prepType: string): boolean {
    return entity.getStacks(prepType) > 0;
  }
}
