import Phaser from 'phaser';
import type { BeadCounts } from '@src/types/Beads';
import type { WheelEntry } from '@src/systems/ActionWheel';

/**
 * Callbacks for action buttons
 */
export interface ActionCallbacks {
  onMove: () => void;
  onRun: () => void;
  onAttack: () => void;
  onRest: () => void;
}

/**
 * Action costs for button labels
 */
const ACTION_COSTS = {
  move: 1,
  run: 2,
  attack: 2,
  rest: 2,
} as const;

/**
 * BattleUI handles all Phaser-based UI rendering for the battle scene.
 * This includes status panels, action wheel display, bead displays,
 * action buttons, and battle log.
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
  private actionButtons: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create all UI panels and elements
   */
  createAllPanels(callbacks: ActionCallbacks): void {
    this.createStatusPanel();
    this.createWheelDisplay();
    this.createActionButtonsArea();
    this.createBeadDisplay();
    this.createBattleLog();
    this.callbacks = callbacks;
  }

  private callbacks!: ActionCallbacks;

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

  private createActionButtonsArea(): void {
    this.scene.add.rectangle(900, 380, 200, 180, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    this.scene.add
      .text(900, 300, 'Actions', {
        fontSize: '18px',
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

  // ===== Action Buttons =====

  showActionButtons(_canAttack: boolean): void {
    this.hideActionButtons();

    let yOffset = 320;

    // Move button
    const moveBtn = this.createButton(900, yOffset, `Move (${ACTION_COSTS.move})`, () =>
      this.callbacks.onMove()
    );
    this.actionButtons.push(moveBtn);
    yOffset += 40;

    // Run button
    const runBtn = this.createButton(900, yOffset, `Run (${ACTION_COSTS.run})`, () =>
      this.callbacks.onRun()
    );
    this.actionButtons.push(runBtn);
    yOffset += 40;

    // Attack button
    const attackBtn = this.createButton(900, yOffset, `Attack (${ACTION_COSTS.attack})`, () =>
      this.callbacks.onAttack()
    );
    this.actionButtons.push(attackBtn);
    yOffset += 40;

    // Rest button
    const restBtn = this.createButton(900, yOffset, `Rest (${ACTION_COSTS.rest})`, () =>
      this.callbacks.onRest()
    );
    this.actionButtons.push(restBtn);
  }

  hideActionButtons(): void {
    this.actionButtons.forEach((btn) => btn.destroy());
    this.actionButtons = [];
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add
      .rectangle(0, 0, 160, 36, 0x444466)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(0, 0, text, {
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x555588));
    bg.on('pointerout', () => bg.setFillStyle(0x444466));
    bg.on('pointerdown', callback);

    container.add([bg, label]);
    return container;
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
    this.hideActionButtons();
    // Phaser scene will clean up other elements
  }
}
