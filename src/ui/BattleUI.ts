import Phaser from 'phaser';
import type { BeadCounts } from '@src/types/Beads';
import type { WheelEntry } from '@src/systems/ActionWheel';

/**
 * BattleUI handles all Phaser-based UI rendering for the battle scene.
 * This includes status panels, action wheel display, bead displays, and battle log.
 * Action buttons are handled by SelectedHeroPanel.
 */
export class BattleUI {
  private scene: Phaser.Scene;

  // UI Elements
  private statusText!: Phaser.GameObjects.Text;
  private wheelGraphics!: Phaser.GameObjects.Graphics;
  private beadHandContainer!: Phaser.GameObjects.Container;
  private monsterBeadText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private logMessages: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create all UI panels and elements
   */
  createAllPanels(): void {
    this.createStatusPanel();
    this.createWheelDisplay();
    this.createBeadDisplay();
    this.createBattleLog();
  }

  // ===== Creation Methods =====

  private createStatusPanel(): void {
    this.scene.add.rectangle(900, 100, 200, 150, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    this.statusText = this.scene.add.text(810, 40, '', {
      fontSize: '14px',
      color: '#ffffff',
      lineSpacing: 6,
    });
  }

  private createWheelDisplay(): void {
    this.wheelGraphics = this.scene.add.graphics();
    this.scene.add
      .text(900, 180, 'Action Wheel', {
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
  }

  private createBeadDisplay(): void {
    this.beadHandContainer = this.scene.add.container(810, 480);
    this.scene.add
      .text(900, 475, 'Beads in Hand', {
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.monsterBeadText = this.scene.add.text(810, 155, '', {
      fontSize: '11px',
      color: '#cccccc',
    });
  }

  private createBattleLog(): void {
    this.scene.add.rectangle(900, 640, 200, 180, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    this.scene.add
      .text(900, 555, 'Battle Log', {
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.logText = this.scene.add.text(810, 570, '', {
      fontSize: '11px',
      color: '#cccccc',
      wordWrap: { width: 180 },
      lineSpacing: 3,
    });
  }

  // ===== Update Methods =====

  updateStatusText(
    monsterName: string,
    monsterHealth: number,
    maxHealth: number,
    currentActorId: string | null
  ): void {
    const actorName = currentActorId === 'monster' ? monsterName : 'Player';
    const lines = [
      `Monster: ${monsterName}`,
      `HP: ${monsterHealth}/${maxHealth}`,
      '',
      `Current Actor: ${actorName}`,
    ];
    this.statusText.setText(lines.join('\n'));
  }

  updateWheelDisplay(
    getEntitiesAtPosition: (pos: number) => WheelEntry[],
    nextActorId: string | null,
    nextActorPosition: number | undefined
  ): void {
    this.wheelGraphics.clear();

    const centerX = 900;
    const centerY = 240;
    const radius = 50;

    // Draw wheel segments
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const nextAngle = ((i + 1) * Math.PI) / 4 - Math.PI / 2;

      this.wheelGraphics.lineStyle(2, 0x4a4a6a);
      this.wheelGraphics.beginPath();
      this.wheelGraphics.moveTo(centerX, centerY);
      this.wheelGraphics.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      this.wheelGraphics.arc(centerX, centerY, radius, angle, nextAngle, false);
      this.wheelGraphics.lineTo(centerX, centerY);
      this.wheelGraphics.strokePath();

      // Position indicator
      const midAngle = (angle + nextAngle) / 2;
      const textX = centerX + Math.cos(midAngle) * (radius * 0.6);
      const textY = centerY + Math.sin(midAngle) * (radius * 0.6);

      // Highlight positions with entities
      const entitiesAtPos = getEntitiesAtPosition(i);
      if (entitiesAtPos.length > 0) {
        this.wheelGraphics.fillStyle(0x88ff88, 0.3);
        this.wheelGraphics.fillCircle(textX, textY, 12);
      }
    }

    // Highlight next actor's position
    if (nextActorId && nextActorPosition !== undefined) {
      const pos = nextActorPosition;
      const angle = (pos * Math.PI) / 4 - Math.PI / 2;
      const nextAngle = ((pos + 1) * Math.PI) / 4 - Math.PI / 2;

      this.wheelGraphics.fillStyle(0xffff00, 0.4);
      this.wheelGraphics.beginPath();
      this.wheelGraphics.moveTo(centerX, centerY);
      this.wheelGraphics.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      this.wheelGraphics.arc(centerX, centerY, radius, angle, nextAngle, false);
      this.wheelGraphics.lineTo(centerX, centerY);
      this.wheelGraphics.fillPath();
    }
  }

  updateBeadHandDisplay(beadCounts: BeadCounts | null): void {
    this.beadHandContainer.removeAll(true);

    if (!beadCounts) return;

    const colors: Record<string, number> = {
      red: 0xff4444,
      blue: 0x4444ff,
      green: 0x44ff44,
      white: 0xffffff,
    };

    let x = 0;
    for (const [color, count] of Object.entries(beadCounts)) {
      for (let i = 0; i < count; i++) {
        const bead = this.scene.add.circle(x, 10, 8, colors[color]).setStrokeStyle(1, 0x000000);
        this.beadHandContainer.add(bead);
        x += 20;
      }
    }
  }

  updateMonsterBeadDisplay(discardCounts: BeadCounts | null): void {
    if (!discardCounts) {
      this.monsterBeadText.setText('');
      return;
    }

    this.monsterBeadText.setText(
      `Discards: R:${discardCounts.red} B:${discardCounts.blue} G:${discardCounts.green} W:${discardCounts.white}`
    );
  }

  // ===== Logging =====

  log(message: string): void {
    this.logMessages.unshift(message);
    if (this.logMessages.length > 8) {
      this.logMessages.pop();
    }
    this.logText.setText(this.logMessages.join('\n'));
  }

  /**
   * Get log messages for external access (e.g., E2E tests)
   */
  getLogMessages(): string[] {
    return [...this.logMessages];
  }

  // ===== Cleanup =====

  destroy(): void {
    // Phaser scene will clean up other elements
  }
}
