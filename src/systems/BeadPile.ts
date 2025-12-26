import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BEAD_COLORS } from '@src/types/Beads';

/**
 * BeadPile - A simple collection of beads that can be added to or removed from.
 *
 * Used as a hand (beads available to spend) or discard pile.
 * Does not handle drawing or reshuffling - that's BeadPool's job.
 */
export class BeadPile {
  private beads: Map<BeadColor, number>;

  /**
   * Create a new bead pile.
   * @param initial - Optional initial bead counts (defaults to empty)
   */
  constructor(initial?: BeadCounts) {
    this.beads = new Map();
    for (const color of BEAD_COLORS) {
      this.beads.set(color, initial?.[color] ?? 0);
    }
  }

  /**
   * Add beads of a specific color to the pile.
   * @param color - Color of bead to add
   * @param count - Number to add (default: 1)
   */
  add(color: BeadColor, count: number = 1): void {
    this.beads.set(color, this.beads.get(color)! + count);
  }

  /**
   * Remove beads of a specific color from the pile.
   * @param color - Color of bead to remove
   * @param count - Number to remove (default: 1)
   * @returns True if removal succeeded, false if not enough beads
   */
  remove(color: BeadColor, count: number = 1): boolean {
    const current = this.beads.get(color)!;
    if (current < count) return false;
    this.beads.set(color, current - count);
    return true;
  }

  /**
   * Get the count of beads by color.
   */
  getCounts(): BeadCounts {
    return {
      red: this.beads.get('red')!,
      blue: this.beads.get('blue')!,
      green: this.beads.get('green')!,
      white: this.beads.get('white')!,
    };
  }

  /**
   * Get the total number of beads in the pile.
   */
  getTotal(): number {
    let total = 0;
    for (const color of BEAD_COLORS) {
      total += this.beads.get(color)!;
    }
    return total;
  }

  /**
   * Check if the pile is empty.
   */
  isEmpty(): boolean {
    return this.getTotal() === 0;
  }

  /**
   * Clear all beads from the pile.
   * @returns The counts that were removed
   */
  clear(): BeadCounts {
    const counts = this.getCounts();
    for (const color of BEAD_COLORS) {
      this.beads.set(color, 0);
    }
    return counts;
  }
}
