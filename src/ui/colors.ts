/**
 * Shared color constants for consistent character/hero colors across UI
 */

/**
 * Hero colors by player index (P1-P4).
 * Used consistently across:
 * - Character visuals on the grid
 * - Hero cards in the selection bar
 * - Entity markers on the action wheel
 */
export const HERO_COLORS = [
  0x2255aa, // P1: Dark Blue (Knight)
  0xaa2222, // P2: Dark Red (Rogue)
  0x22aa22, // P3: Dark Green (Mage)
  0xaaaa22, // P4: Dark Yellow/Olive (Cleric)
] as const;

/**
 * Get hero color by index (wraps around if index > 3)
 */
export function getHeroColor(index: number): number {
  return HERO_COLORS[index % HERO_COLORS.length];
}
