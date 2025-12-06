interface DiceNotation {
  count: number;
  sides: number;
  modifier: number;
}

export class DiceRoller {
  constructor() {
    // Dice roller is stateless for now, but could add visual effects later
  }

  /**
   * Parses dice notation like "2d6", "1d8+2", "3d6-1"
   * Returns null if not valid dice notation
   */
  private parseDiceNotation(notation: string): DiceNotation | null {
    const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/i);

    if (!match) {
      return null;
    }

    return {
      count: parseInt(match[1]),
      sides: parseInt(match[2]),
      modifier: match[3] ? parseInt(match[3]) : 0,
    };
  }

  /**
   * Parses and rolls dice notation like "2d6", "1d8+2", "3d6-1"
   */
  roll(notation: string): number {
    const parsed = this.parseDiceNotation(notation);

    if (!parsed) {
      // If not dice notation, try parsing as plain number
      const num = parseInt(notation);
      return isNaN(num) ? 0 : num;
    }

    let total = 0;
    for (let i = 0; i < parsed.count; i++) {
      total += Math.floor(Math.random() * parsed.sides) + 1;
    }

    return Math.max(0, total + parsed.modifier);
  }

  /**
   * Rolls with detailed results for display
   */
  rollDetailed(notation: string): { total: number; rolls: number[]; modifier: number } {
    const parsed = this.parseDiceNotation(notation);

    if (!parsed) {
      const num = parseInt(notation);
      return { total: isNaN(num) ? 0 : num, rolls: [], modifier: 0 };
    }

    const rolls: number[] = [];
    for (let i = 0; i < parsed.count; i++) {
      rolls.push(Math.floor(Math.random() * parsed.sides) + 1);
    }

    const total = Math.max(0, rolls.reduce((a, b) => a + b, 0) + parsed.modifier);

    return { total, rolls, modifier: parsed.modifier };
  }
}
