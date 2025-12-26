import Phaser from 'phaser';
import { EntityVisual } from './EntityVisual';
import type { CharacterClass } from '@src/systems/DataLoader';
import type { BeadColor } from '@src/types/Beads';

/**
 * Visual representation of a player character.
 * Pure rendering - no game logic.
 */
export class CharacterVisual extends EntityVisual {
  private readonly characterClass: CharacterClass;
  private readonly color: number;
  private readonly index: number;
  private background!: Phaser.GameObjects.Arc;
  private selectionRing!: Phaser.GameObjects.Arc;

  constructor(
    scene: Phaser.Scene,
    worldX: number,
    worldY: number,
    characterClass: CharacterClass,
    color: number,
    index: number
  ) {
    super(scene, worldX, worldY, characterClass.stats.health);
    this.characterClass = characterClass;
    this.color = color;
    this.index = index;
    this.createVisuals();
  }

  /**
   * Set whether this character is visually selected.
   */
  setSelected(selected: boolean): void {
    this.selectionRing.setVisible(selected);
  }

  /**
   * Enable or disable pointer interactivity.
   */
  setInteractive(enabled: boolean): void {
    if (enabled) {
      this.background.setInteractive({ useHandCursor: true });
    } else {
      this.background.disableInteractive();
    }
  }

  /**
   * Register a click handler.
   */
  onClick(callback: () => void): void {
    this.background.off('pointerdown');
    this.background.on('pointerdown', callback);
  }

  /**
   * Get the wheel ID for this character.
   */
  getWheelId(): string {
    return `hero-${this.index}`;
  }

  /**
   * Get the character class name.
   */
  getClassName(): string {
    return this.characterClass.name;
  }

  protected createVisuals(): void {
    // Selection ring (hidden by default)
    this.selectionRing = this.scene.add.circle(0, 0, 28, 0xffffff, 0).setStrokeStyle(3, 0xffff00);
    this.selectionRing.setVisible(false);

    // Background circle
    this.background = this.scene.add.circle(0, 0, 24, this.color);

    // Class icon (simple letter for now)
    const icon = this.scene.add
      .text(0, -2, this.characterClass.icon || this.characterClass.name[0], {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Health bar background
    const hpBg = this.scene.add.rectangle(0, 20, 40, 6, 0x333333);

    // Health bar
    this.healthBar = this.scene.add.graphics();
    this.renderHealthBar(this.maxHealth, this.maxHealth);

    // Player number
    const number = this.scene.add.text(-20, -20, `P${this.index + 1}`, {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000',
    });

    this.container.add([this.selectionRing, this.background, icon, hpBg, this.healthBar, number]);

    // Make interactive
    this.background.setInteractive({ useHandCursor: true });
    this.container.setSize(48, 48);
  }

  protected renderHealthBar(currentHealth: number, maxHealth: number): void {
    this.healthBar.clear();
    const healthPercent = currentHealth / maxHealth;
    const barWidth = 40 * healthPercent;
    const color = healthPercent > 0.5 ? 0x44ff44 : healthPercent > 0.25 ? 0xffff44 : 0xff4444;

    this.healthBar.fillStyle(color);
    this.healthBar.fillRect(-20, 17, barWidth, 6);
  }

  /**
   * Animate rest action.
   * Could show visual feedback for bead drawing.
   */
  animateRest(_beadsDrawn: BeadColor[]): Promise<void> {
    // Could show a subtle pulse or glow effect
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.background,
        alpha: 0.6,
        duration: 150,
        yoyo: true,
        onComplete: () => resolve(),
      });
    });
  }
}
