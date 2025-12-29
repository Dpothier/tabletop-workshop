/**
 * Minimal interface for visuals that support selection.
 * This allows testing without Phaser dependencies.
 */
export interface SelectableVisual {
  setSelected(selected: boolean): void;
}

/**
 * SelectionManager handles character selection state and visual feedback.
 *
 * This class manages which character is currently selected and updates
 * the visual state accordingly. It provides turn validation helpers
 * to check if a character can act.
 */
export class SelectionManager {
  private selectedId: string | null = null;

  constructor(private readonly visuals: Map<string, SelectableVisual>) {}

  /**
   * Select a character by ID.
   * Deselects any previously selected character first.
   * @param characterId - The ID of the character to select
   */
  select(characterId: string): void {
    // Deselect previous if any
    if (this.selectedId !== null) {
      const prevVisual = this.visuals.get(this.selectedId);
      prevVisual?.setSelected(false);
    }

    // Select new
    this.selectedId = characterId;
    const visual = this.visuals.get(characterId);
    visual?.setSelected(true);
  }

  /**
   * Deselect the currently selected character.
   */
  deselect(): void {
    if (this.selectedId !== null) {
      const visual = this.visuals.get(this.selectedId);
      visual?.setSelected(false);
      this.selectedId = null;
    }
  }

  /**
   * Get the ID of the currently selected character.
   * @returns The selected character ID, or null if none selected
   */
  getSelected(): string | null {
    return this.selectedId;
  }

  /**
   * Check if a character is the current actor.
   * Used for turn validation.
   * @param characterId - The character to check
   * @param currentActorId - The current actor ID (or null if no current actor)
   * @returns true if the character is the current actor
   */
  isCurrentActor(characterId: string, currentActorId: string | null): boolean {
    if (currentActorId === null) {
      return false;
    }
    if (currentActorId === 'monster') {
      return false;
    }
    return characterId === currentActorId;
  }
}
