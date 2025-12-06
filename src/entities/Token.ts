import Phaser from 'phaser';
import { CharacterClass, Monster, MonsterPhase } from '../systems/DataLoader';

export abstract class Token {
  public sprite: Phaser.GameObjects.Container;
  public gridX = 0;
  public gridY = 0;
  public currentHealth: number;
  public maxHealth: number;
  protected scene: Phaser.Scene;
  protected healthBar!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHealth: number) {
    this.scene = scene;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.sprite = scene.add.container(x, y);
  }

  setGridPosition(x: number, y: number) {
    this.gridX = x;
    this.gridY = y;
  }

  takeDamage(amount: number) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateHealthBar();

    // Flash red
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });
  }

  heal(amount: number) {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    this.updateHealthBar();
  }

  protected abstract updateHealthBar(): void;
}

export class CharacterToken extends Token {
  public characterClass: CharacterClass;
  public hasMoved = false;
  public hasActed = false;
  private color: number;
  private background!: Phaser.GameObjects.Arc;
  private selectionRing!: Phaser.GameObjects.Arc;
  private index: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterClass: CharacterClass,
    color: number,
    index: number
  ) {
    super(scene, x, y, characterClass.stats.health);
    this.characterClass = characterClass;
    this.color = color;
    this.index = index;
    this.createVisuals();
  }

  private createVisuals() {
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
    this.updateHealthBar();

    // Player number
    const number = this.scene.add.text(-20, -20, `P${this.index + 1}`, {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000',
    });

    this.sprite.add([this.selectionRing, this.background, icon, hpBg, this.healthBar, number]);

    // Make interactive
    this.background.setInteractive({ useHandCursor: true });
    this.sprite.setSize(48, 48);
  }

  setInteractive(enabled: boolean) {
    if (enabled) {
      this.background.setInteractive({ useHandCursor: true });
    } else {
      this.background.disableInteractive();
    }
  }

  setSelected(selected: boolean) {
    this.selectionRing.setVisible(selected);
  }

  onClick(callback: () => void) {
    this.background.off('pointerdown');
    this.background.on('pointerdown', callback);
  }

  protected updateHealthBar() {
    this.healthBar.clear();
    const healthPercent = this.currentHealth / this.maxHealth;
    const barWidth = 40 * healthPercent;
    const color = healthPercent > 0.5 ? 0x44ff44 : healthPercent > 0.25 ? 0xffff44 : 0xff4444;

    this.healthBar.fillStyle(color);
    this.healthBar.fillRect(-20, 17, barWidth, 6);
  }
}

export class MonsterToken extends Token {
  public monster: Monster;
  private currentPhaseIndex = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, monster: Monster) {
    super(scene, x, y, monster.stats.health);
    this.monster = monster;
    this.createVisuals();
  }

  private createVisuals() {
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
    this.updateHealthBar();

    this.sprite.add([graphics, name, hpBg, this.healthBar]);
  }

  protected updateHealthBar() {
    this.healthBar.clear();
    const healthPercent = this.currentHealth / this.maxHealth;
    const barWidth = 60 * healthPercent;

    this.healthBar.fillStyle(0xff4444);
    this.healthBar.fillRect(-30, 41, barWidth, 8);

    // Update phase based on health
    this.updatePhase();
  }

  private updatePhase() {
    if (!this.monster.phases) return;

    const healthPercent = (this.currentHealth / this.maxHealth) * 100;

    for (let i = this.monster.phases.length - 1; i >= 0; i--) {
      const phase = this.monster.phases[i];
      const threshold = parseInt(phase.threshold.replace('%', ''));
      if (healthPercent <= threshold) {
        if (i > this.currentPhaseIndex) {
          this.currentPhaseIndex = i;
          // Could trigger phase transition effect here
        }
        break;
      }
    }
  }

  getCurrentPhase(): MonsterPhase | undefined {
    return this.monster.phases?.[this.currentPhaseIndex];
  }
}
