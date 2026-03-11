import type { Entity } from '@src/entities/Entity';
import type { BattleGrid } from '@src/state/BattleGrid';

export interface PassiveAura {
  id: string;
  sourceEntityId: string;
  type: string;
  range: number;
  condition: string;
  effect: Record<string, number>;
}

export class PassiveAuraSystem {
  private auras: PassiveAura[] = [];

  registerAura(aura: PassiveAura): void {
    this.auras.push(aura);
  }

  isAuraActive(sourceEntityId: string, auraId: string, entities: Map<string, Entity>): boolean {
    const aura = this.auras.find((a) => a.id === auraId && a.sourceEntityId === sourceEntityId);
    if (!aura) return false;

    const bearer = entities.get(sourceEntityId);
    if (!bearer) return false;

    // Check condition: hasPonder = bearer has >= 1 Ponder stack
    if (aura.condition === 'hasPonder') {
      return bearer.getStacks('ponder') >= 1;
    }

    return false;
  }

  getActiveAuras(
    type: string,
    targetEntityId: string,
    grid: BattleGrid,
    entities: Map<string, Entity>
  ): PassiveAura[] {
    const activeAuras: PassiveAura[] = [];

    for (const aura of this.auras) {
      if (aura.type !== type) continue;

      // Check if aura is active
      if (!this.isAuraActive(aura.sourceEntityId, aura.id, entities)) {
        continue;
      }

      // Check if target is within range
      const sourcePos = grid.getPosition(aura.sourceEntityId);
      const targetPos = grid.getPosition(targetEntityId);

      if (!sourcePos || !targetPos) continue;

      const distance = grid.getDistance(aura.sourceEntityId, targetEntityId);
      if (distance <= aura.range) {
        activeAuras.push(aura);
      }
    }

    return activeAuras;
  }

  bearerPreservesPonder(entityId: string, _entities: Map<string, Entity>): boolean {
    // Check if entity is a source of any bestiary aura
    for (const aura of this.auras) {
      if (aura.sourceEntityId === entityId && aura.id === 'bestiary') {
        return true;
      }
    }
    return false;
  }
}
