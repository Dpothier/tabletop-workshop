import type { BeadCounts } from './Beads';

/**
 * Events emitted when battle state changes that UI needs to react to.
 * Each event corresponds to a specific piece of state.
 */
export interface UIStateEvents {
  // Turn state
  actorChanged: (actorId: string | null) => void;

  // Selection state
  selectionChanged: (characterId: string | null) => void;

  // Wheel state
  wheelAdvanced: (entityId: string, newPosition: number) => void;

  // Character state
  heroHealthChanged: (heroId: string, current: number, max: number) => void;
  heroBeadsChanged: (heroId: string, counts: BeadCounts) => void;
  heroMoved: (heroId: string, worldX: number, worldY: number) => void;

  // Monster state
  monsterHealthChanged: (current: number, max: number) => void;
  monsterBeadsChanged: (counts: BeadCounts | null) => void;
  monsterMoved: (worldX: number, worldY: number) => void;
}

/**
 * Partial subscriber - components can subscribe to only what they need.
 */
export type UIStateSubscriber = Partial<UIStateEvents>;
