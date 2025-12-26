import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BEAD_COLORS } from '@src/types/Beads';
import { selectRandomBead } from '@src/utils/beadUtils';
import type { BeadPile } from './BeadPile';

/**
 * BeadPool - A bag you draw from. When empty, reshuffles from a linked discard pile.
 *
 * Key behavior: draw() only removes from pool - it does NOT add to discard.
 * The consumer decides where the bead goes next (hand, discard, etc.).
 */
export class BeadPool {
  private remaining: Map<BeadColor, number>;
  private readonly discard: BeadPile;
  private readonly randomFn: () => number;

  /**
   * Create a new bead pool.
   * @param initial - Initial bead counts
   * @param discard - BeadPile to reshuffle from when empty
   * @param randomFn - Random function for bead selection (default: Math.random)
   * @throws Error if total beads is zero
   */
  constructor(initial: BeadCounts, discard: BeadPile, randomFn: () => number = Math.random) {
    const total = initial.red + initial.blue + initial.green + initial.white;
    if (total === 0) {
      throw new Error('Cannot create empty bead pool');
    }

    this.discard = discard;
    this.randomFn = randomFn;
    this.remaining = new Map();

    for (const color of BEAD_COLORS) {
      this.remaining.set(color, initial[color]);
    }
  }

  /**
   * Draw a random bead from the pool.
   * If the pool is empty, automatically reshuffles from discard pile.
   * Note: The drawn bead is NOT added to discard - consumer must do that.
   * @returns The color of the drawn bead
   */
  draw(): BeadColor {
    if (this.isEmpty()) {
      this.reshuffle();
    }

    const color = selectRandomBead(this.getRemainingCounts(), this.randomFn)!;
    this.remaining.set(color, this.remaining.get(color)! - 1);
    return color;
  }

  /**
   * Get the count of remaining beads by color.
   */
  getRemainingCounts(): BeadCounts {
    return {
      red: this.remaining.get('red')!,
      blue: this.remaining.get('blue')!,
      green: this.remaining.get('green')!,
      white: this.remaining.get('white')!,
    };
  }

  /**
   * Get the total number of beads remaining in the pool.
   */
  getTotalRemaining(): number {
    let total = 0;
    for (const color of BEAD_COLORS) {
      total += this.remaining.get(color)!;
    }
    return total;
  }

  /**
   * Check if the pool is empty.
   */
  isEmpty(): boolean {
    return this.getTotalRemaining() === 0;
  }

  /**
   * Reshuffle all beads from the discard pile back into the pool.
   */
  private reshuffle(): void {
    const discarded = this.discard.clear();
    for (const color of BEAD_COLORS) {
      this.remaining.set(color, this.remaining.get(color)! + discarded[color]);
    }
  }
}
