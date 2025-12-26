import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BEAD_COLORS } from '@src/types/Beads';
import { BeadPile } from './BeadPile';
import { BeadPool } from './BeadPool';

const DEFAULT_BEADS: BeadCounts = { red: 3, blue: 3, green: 3, white: 3 };

/**
 * PlayerBeadSystem - Composes BeadPool → BeadPile (hand) → BeadPile (discard).
 *
 * Players draw beads from pool to hand, then spend beads from hand to discard.
 * When pool is empty, discarded beads reshuffle back into pool.
 */
export class PlayerBeadSystem {
  private readonly pool: BeadPool;
  private readonly hand: BeadPile;
  private readonly discard: BeadPile;

  /**
   * Create a new player bead system.
   * @param initial - Initial bead counts in the pool (default: 3 of each color)
   * @param randomFn - Random function for bead selection (default: Math.random)
   * @throws Error if total beads is zero
   */
  constructor(initial?: BeadCounts, randomFn?: () => number) {
    this.discard = new BeadPile();
    this.hand = new BeadPile();
    this.pool = new BeadPool(initial ?? DEFAULT_BEADS, this.discard, randomFn);
  }

  /**
   * Draw beads from pool to hand.
   * Auto-reshuffles from discard if pool empties during draw.
   * @param count - Number of beads to draw
   * @returns Array of drawn bead colors
   */
  drawToHand(count: number): BeadColor[] {
    const drawn: BeadColor[] = [];
    for (let i = 0; i < count; i++) {
      const color = this.pool.draw();
      this.hand.add(color);
      drawn.push(color);
    }
    return drawn;
  }

  /**
   * Spend a bead from hand to discard.
   * @param color - Color of bead to spend
   * @returns True if spend succeeded, false if bead not in hand
   */
  spend(color: BeadColor): boolean {
    if (!this.hand.remove(color)) {
      return false;
    }
    this.discard.add(color);
    return true;
  }

  /**
   * Check if player can afford a bead cost.
   * @param costs - Required bead counts
   * @returns True if hand has all required beads
   */
  canAfford(costs: BeadCounts): boolean {
    const handCounts = this.hand.getCounts();
    for (const color of BEAD_COLORS) {
      if (handCounts[color] < costs[color]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get counts of beads in hand by color.
   */
  getHandCounts(): BeadCounts {
    return this.hand.getCounts();
  }

  /**
   * Get counts of beads remaining in pool by color.
   */
  getBagCounts(): BeadCounts {
    return this.pool.getRemainingCounts();
  }

  /**
   * Get counts of discarded beads by color.
   */
  getDiscardedCounts(): BeadCounts {
    return this.discard.getCounts();
  }

  /**
   * Get total number of beads in hand.
   */
  getHandTotal(): number {
    return this.hand.getTotal();
  }

  /**
   * Get total number of beads remaining in pool.
   */
  getBagTotal(): number {
    return this.pool.getTotalRemaining();
  }

  /**
   * Check if pool is empty.
   */
  isEmpty(): boolean {
    return this.pool.isEmpty();
  }
}
