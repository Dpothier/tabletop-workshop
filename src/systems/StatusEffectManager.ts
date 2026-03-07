import { Entity } from '@src/entities/Entity';

export class StatusEffectManager {
  applyBurn(entity: Entity, count: number): void {
    entity.addStacks('burn', count);
  }

  getBurnStacks(entity: Entity): number {
    return entity.getStacks('burn');
  }

  clearBurn(entity: Entity): void {
    entity.clearStacks('burn');
  }

  resolveEndOfRound(entity: Entity): void {
    const burnStacks = entity.getStacks('burn');
    if (burnStacks > 0) {
      entity.receiveDamage(burnStacks);
      entity.clearStacks('burn');
      if (burnStacks - 1 > 0) {
        entity.addStacks('burn', burnStacks - 1);
      }
    }
  }
}
