import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BEAD_COLORS } from '@src/types/Beads';
import { selectRandomBead } from '@src/utils/beadUtils';

// Re-export types for backwards compatibility
export type { BeadColor, BeadCounts } from '@src/types/Beads';

/**
 * Bead Bag System
 *
 * Manages a bag of colored beads for monster AI decisions.
 * Supports drawing, discarding, and automatic reshuffling when empty.
 */
export class BeadBag {
  private remaining: Map<BeadColor, number>;
  private discarded: Map<BeadColor, number>;
  private readonly randomFn: () => number;

  /**
   * Create a new bead bag with the specified bead counts.
   * @param initialBeads - Initial count of each bead color
   * @param randomFn - Random function for bead selection (default: Math.random)
   * @throws Error if total beads is zero
   */
  constructor(initialBeads: BeadCounts, randomFn: () => number = Math.random) {
    const total = initialBeads.red + initialBeads.blue + initialBeads.green + initialBeads.white;
    if (total === 0) {
      throw new Error('Cannot create empty bead bag');
    }

    this.randomFn = randomFn;

    this.remaining = new Map<BeadColor, number>();
    this.discarded = new Map<BeadColor, number>();

    for (const color of BEAD_COLORS) {
      this.remaining.set(color, initialBeads[color]);
      this.discarded.set(color, 0);
    }
  }

  /**
   * Draw a random bead from the bag.
   * If the bag is empty, automatically reshuffles discarded beads back in.
   * @returns The color of the drawn bead
   */
  draw(): BeadColor {
    // Auto-reshuffle if empty
    if (this.isEmpty()) {
      this.reshuffle();
    }

    const color = selectRandomBead(this.getRemainingCounts(), this.randomFn)!;

    // Decrement remaining and increment discarded
    this.remaining.set(color, this.remaining.get(color)! - 1);
    this.discarded.set(color, this.discarded.get(color)! + 1);

    return color;
  }

  /**
   * Get the count of remaining beads by color.
   * @returns Counts of remaining beads
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
   * Get the count of discarded beads by color.
   * @returns Counts of discarded beads
   */
  getDiscardedCounts(): BeadCounts {
    return {
      red: this.discarded.get('red')!,
      blue: this.discarded.get('blue')!,
      green: this.discarded.get('green')!,
      white: this.discarded.get('white')!,
    };
  }

  /**
   * Get the total number of beads remaining in the bag.
   * @returns Total remaining beads
   */
  getTotalRemaining(): number {
    let total = 0;
    for (const color of BEAD_COLORS) {
      total += this.remaining.get(color)!;
    }
    return total;
  }

  /**
   * Check if the bag is empty.
   * @returns True if no beads remain in the bag
   */
  isEmpty(): boolean {
    return this.getTotalRemaining() === 0;
  }

  /**
   * Reshuffle all discarded beads back into the bag.
   */
  private reshuffle(): void {
    for (const color of BEAD_COLORS) {
      const discardedCount = this.discarded.get(color)!;
      this.remaining.set(color, this.remaining.get(color)! + discardedCount);
      this.discarded.set(color, 0);
    }
  }
}
