import Phaser from 'phaser';
import { EntityVisual } from './EntityVisual';
import type { Monster } from '@src/systems/DataLoader';
import type { BeadColor } from '@src/types/Beads';

/**
 * Visual representation of a monster.
 * Pure rendering - no game logic.
 */
export class MonsterVisual extends EntityVisual {
  private readonly monster: Monster;

  constructor(scene: Phaser.Scene, worldX: number, worldY: number, monster: Monster) {
    super(scene, worldX, worldY, monster.stats.health);
    this.monster = monster;
    this.createVisuals();
  }

  /**
   * Get the monster name.
   */
  getMonsterName(): string {
    return this.monster.name;
  }

  protected createVisuals(): void {
    // Hexagon shape for boss
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xaa2222);
    graphics.lineStyle(2, 0xff4444);

    const size = 36;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      points.push({
        x: Math.cos(angle) * size,
        y: Math.sin(angle) * size,
      });
    }

    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < 6; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    // Monster name
    const name = this.scene.add
      .text(0, -2, this.monster.name[0], {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Health bar background
    const hpBg = this.scene.add.rectangle(0, 45, 60, 8, 0x333333);

    // Health bar
    this.healthBar = this.scene.add.graphics();
    this.renderHealthBar(this.maxHealth, this.maxHealth);

    this.container.add([graphics, name, hpBg, this.healthBar]);
  }

  protected renderHealthBar(currentHealth: number, maxHealth: number): void {
    this.healthBar.clear();
    const healthPercent = currentHealth / maxHealth;
    const barWidth = 60 * healthPercent;

    this.healthBar.fillStyle(0xff4444);
    this.healthBar.fillRect(-30, 41, barWidth, 8);
  }

  /**
   * Animate bead draw.
   * Could show the bead color being drawn.
   */
  animateBeadDraw(_color: BeadColor): Promise<void> {
    // Could flash the monster with the bead color
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true,
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * Animate state change.
   * Could show visual feedback for state transition.
   */
  animateStateChange(_fromState: string, _toState: string): Promise<void> {
    // Could show state name or color change
    return Promise.resolve();
  }
}
