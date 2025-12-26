/**
 * Bead color enumeration.
 * Beads are used as resources for actions and monster AI state transitions.
 */
export type BeadColor = 'red' | 'blue' | 'green' | 'white';

/**
 * Counts of beads by color.
 * Used for bead bags, player hands, and affordability checks.
 */
export interface BeadCounts {
  red: number;
  blue: number;
  green: number;
  white: number;
}

/**
 * All bead colors in the system.
 * Useful for iteration and validation.
 */
export const BEAD_COLORS: BeadColor[] = ['red', 'blue', 'green', 'white'];
