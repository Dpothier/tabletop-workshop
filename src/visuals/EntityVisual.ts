import Phaser from 'phaser';

/**
 * Base class for entity visual representation.
 * Pure rendering - no game logic. Receives state updates from BattleScene.
 */
export abstract class EntityVisual {
  public readonly container: Phaser.GameObjects.Container;
  protected readonly scene: Phaser.Scene;
  protected healthBar!: Phaser.GameObjects.Graphics;
  protected maxHealth: number;

  constructor(scene: Phaser.Scene, worldX: number, worldY: number, maxHealth: number) {
    this.scene = scene;
    this.maxHealth = maxHealth;
    this.container = scene.add.container(worldX, worldY);
  }

  /**
   * Update the visual position (world coordinates).
   */
  updatePosition(worldX: number, worldY: number): void {
    this.container.setPosition(worldX, worldY);
  }

  /**
   * Animate position change with tween.
   */
  animateToPosition(worldX: number, worldY: number, duration: number = 200): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,
        x: worldX,
        y: worldY,
        duration,
        ease: 'Power2',
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * Update health bar display.
   */
  updateHealth(currentHealth: number, maxHealth: number): void {
    this.maxHealth = maxHealth;
    this.renderHealthBar(currentHealth, maxHealth);
  }

  /**
   * Play damage flash animation.
   */
  playDamageFlash(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });
  }

  /**
   * Animate damage with flash effect.
   * Returns a Promise that resolves when animation completes.
   */
  animateDamage(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 2,
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * Animate health change.
   * Currently updates immediately; could be enhanced with smooth bar animation.
   */
  animateHealthChange(newHealth: number, maxHealth: number): Promise<void> {
    this.updateHealth(newHealth, maxHealth);
    return Promise.resolve();
  }

  /**
   * Destroy this visual and clean up resources.
   */
  destroy(): void {
    this.container.destroy(true);
  }

  /**
   * Get the container's current world position.
   */
  getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  /**
   * Render the health bar - implemented by subclasses.
   */
  protected abstract renderHealthBar(currentHealth: number, maxHealth: number): void;

  /**
   * Create visual elements - implemented by subclasses.
   */
  protected abstract createVisuals(): void;
}
