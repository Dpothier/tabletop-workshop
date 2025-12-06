import { DiceRoller } from './DiceRoller';

export interface AttackResult {
  damage: number;
  rawRoll: number;
  armorReduction: number;
}

export class CombatResolver {
  private readonly diceRoller: DiceRoller;

  constructor(diceRoller: DiceRoller) {
    this.diceRoller = diceRoller;
  }

  calculateDamage(rawDamage: number, armor: number): number {
    return Math.max(0, rawDamage - armor);
  }

  getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  isInRange(
    attackerX: number,
    attackerY: number,
    targetX: number,
    targetY: number,
    range: number
  ): boolean {
    const distance = this.getDistance(attackerX, attackerY, targetX, targetY);
    return distance <= range;
  }

  resolveAttack(damageNotation: string, targetArmor: number): AttackResult {
    const rawRoll = this.diceRoller.roll(damageNotation);
    const damage = this.calculateDamage(rawRoll, targetArmor);
    return {
      damage,
      rawRoll,
      armorReduction: targetArmor,
    };
  }
}
