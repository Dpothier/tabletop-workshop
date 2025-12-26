import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BEAD_COLORS } from '@src/types/Beads';

/**
 * Select a random bead from a pool using weighted random selection.
 * Does NOT modify the pool - caller is responsible for decrementing.
 *
 * @param beadCounts - The pool of beads to select from
 * @param randomFn - Random function returning value in [0, 1)
 * @returns The selected bead color, or null if pool is empty
 */
export function selectRandomBead(beadCounts: BeadCounts, randomFn: () => number): BeadColor | null {
  const total = beadCounts.red + beadCounts.blue + beadCounts.green + beadCounts.white;

  if (total === 0) {
    return null;
  }

  const roll = randomFn() * total;
  let cumulative = 0;

  for (const color of BEAD_COLORS) {
    cumulative += beadCounts[color];
    if (roll < cumulative) {
      return color;
    }
  }

  // Fallback (should not reach here, but handles edge cases)
  return BEAD_COLORS[BEAD_COLORS.length - 1];
}
