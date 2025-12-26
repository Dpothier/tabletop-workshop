import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BEAD_COLORS } from '@src/types/Beads';
import { selectRandomBead } from '@src/utils/beadUtils';

const DEFAULT_BEAD_COUNTS: BeadCounts = {
  red: 3,
  blue: 3,
  green: 3,
  white: 3,
};

/**
 * Player Bead Hand System
 *
 * Manages a player's bead bag and hand for action costs.
 * Players draw beads from bag to hand, then spend beads from hand for actions.
 * When bag is empty, discarded beads reshuffle back into bag.
 */
export class PlayerBeadHand {
  private bag: Map<BeadColor, number>;
  private hand: Map<BeadColor, number>;
  private discarded: Map<BeadColor, number>;
  private readonly randomFn: () => number;

  /**
   * Create a new player bead hand.
   * @param initialBeads - Initial bead counts (default: 3 of each color)
   * @param randomFn - Random function for bead selection (default: Math.random)
   * @throws Error if total beads is zero
   */
  constructor(initialBeads?: BeadCounts, randomFn: () => number = Math.random) {
    const beads = initialBeads ?? DEFAULT_BEAD_COUNTS;
    const total = beads.red + beads.blue + beads.green + beads.white;

    if (total === 0) {
      throw new Error('Cannot create empty bead bag');
    }

    this.randomFn = randomFn;

    this.bag = new Map<BeadColor, number>();
    this.hand = new Map<BeadColor, number>();
    this.discarded = new Map<BeadColor, number>();

    for (const color of BEAD_COLORS) {
      this.bag.set(color, beads[color]);
      this.hand.set(color, 0);
      this.discarded.set(color, 0);
    }
  }

  /**
   * Draw N beads from bag to hand.
   * Auto-reshuffles if bag empties during draw.
   * @param count - Number of beads to draw
   * @returns Array of drawn bead colors
   */
  drawToHand(count: number): BeadColor[] {
    const drawn: BeadColor[] = [];

    for (let i = 0; i < count; i++) {
      // Auto-reshuffle if bag is empty
      if (this.isEmpty()) {
        this.reshuffle();
      }

      const bead = this.drawOneBead();
      if (bead) {
        this.hand.set(bead, this.hand.get(bead)! + 1);
        drawn.push(bead);
      }
    }

    return drawn;
  }

  /**
   * Spend a specific colored bead from hand.
   * @param color - Color of bead to spend
   * @returns True if spend succeeded, false if bead not in hand
   */
  spend(color: BeadColor): boolean {
    const inHand = this.hand.get(color)!;

    if (inHand <= 0) {
      return false;
    }

    this.hand.set(color, inHand - 1);
    this.discarded.set(color, this.discarded.get(color)! + 1);
    return true;
  }

  /**
   * Check if player can afford a bead cost.
   * @param costs - Required bead counts
   * @returns True if hand has all required beads
   */
  canAfford(costs: BeadCounts): boolean {
    for (const color of BEAD_COLORS) {
      if (this.hand.get(color)! < costs[color]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get counts of beads in hand by color.
   */
  getHandCounts(): BeadCounts {
    return {
      red: this.hand.get('red')!,
      blue: this.hand.get('blue')!,
      green: this.hand.get('green')!,
      white: this.hand.get('white')!,
    };
  }

  /**
   * Get counts of beads remaining in bag by color.
   */
  getBagCounts(): BeadCounts {
    return {
      red: this.bag.get('red')!,
      blue: this.bag.get('blue')!,
      green: this.bag.get('green')!,
      white: this.bag.get('white')!,
    };
  }

  /**
   * Get counts of discarded beads by color.
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
   * Get total number of beads in hand.
   */
  getHandTotal(): number {
    let total = 0;
    for (const color of BEAD_COLORS) {
      total += this.hand.get(color)!;
    }
    return total;
  }

  /**
   * Get total number of beads remaining in bag.
   */
  getBagTotal(): number {
    let total = 0;
    for (const color of BEAD_COLORS) {
      total += this.bag.get(color)!;
    }
    return total;
  }

  /**
   * Check if bag is empty.
   */
  isEmpty(): boolean {
    return this.getBagTotal() === 0;
  }

  /**
   * Draw one bead from bag using weighted random selection.
   */
  private drawOneBead(): BeadColor | null {
    const color = selectRandomBead(this.getBagCounts(), this.randomFn);

    if (color) {
      this.bag.set(color, this.bag.get(color)! - 1);
    }

    return color;
  }

  /**
   * Reshuffle all discarded beads back into bag.
   */
  private reshuffle(): void {
    for (const color of BEAD_COLORS) {
      const discardedCount = this.discarded.get(color)!;
      this.bag.set(color, this.bag.get(color)! + discardedCount);
      this.discarded.set(color, 0);
    }
  }
}
