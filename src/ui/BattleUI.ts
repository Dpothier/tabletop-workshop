import Phaser from 'phaser';
import type { BeadCounts } from '@src/types/Beads';
import type { WheelEntry } from '@src/systems/ActionWheel';
import type { BattleStateObserver } from '@src/systems/BattleStateObserver';
import type { BattleState } from '@src/state/BattleState';

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
  private monsterBeadText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private logMessages: string[] = [];
  private turnBannerBg!: Phaser.GameObjects.Rectangle;
  private turnBannerText!: Phaser.GameObjects.Text;
  private logContainer!: Phaser.GameObjects.Container;
  private toggleButton!: Phaser.GameObjects.Text;
  private showingLog = true;
  private onToggleCallback: ((showingLog: boolean) => void) | null = null;
  private wheelTooltipBg!: Phaser.GameObjects.Graphics;
  private wheelTooltipText!: Phaser.GameObjects.Text;
  private getEntitiesAtPositionCallback: ((pos: number) => WheelEntry[]) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create all UI panels and elements
   */
  createAllPanels(): void {
    this.createStatusPanel();
    this.createWheelDisplay();
    this.createMonsterBeadDisplay();
    this.createBattleLog();
    this.createTurnBanner();
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
      .text(900, 200, 'Action Wheel', {
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Create tooltip background graphics (initially hidden)
    this.wheelTooltipBg = this.scene.add.graphics()
      .setVisible(false)
      .setDepth(200);

    // Create tooltip text (initially hidden)
    this.wheelTooltipText = this.scene.add.text(0, 0, '', {
      fontSize: '11px',
      color: '#cccccc',
      align: 'left',
    }).setVisible(false).setDepth(201);

    // Add pointer move handler for wheel hover detection
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer): void => {
      this.handleWheelHover(pointer.x, pointer.y);
    });
  }

  private createMonsterBeadDisplay(): void {
    this.monsterBeadText = this.scene.add.text(810, 155, '', {
      fontSize: '11px',
      color: '#cccccc',
    });
  }

  private createBattleLog(): void {
    this.logContainer = this.scene.add.container(0, 0);

    const bg = this.scene.add.rectangle(900, 640, 200, 180, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    const title = this.scene.add
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

    this.logContainer.add([bg, title, this.logText]);

    // Toggle button above action panel, between beads and panel
    this.toggleButton = this.scene.add.text(810, 465, '📜', {
      fontSize: '20px',
      color: '#aaaaaa',
      backgroundColor: '#2a2a4a',
      padding: { x: 8, y: 4 },
    }).setDepth(100);
    this.toggleButton.setInteractive({ useHandCursor: true });
    this.toggleButton.on('pointerover', () => this.toggleButton.setColor('#ffffff'));
    this.toggleButton.on('pointerout', () => this.toggleButton.setColor('#aaaaaa'));
    this.toggleButton.on('pointerdown', () => this.toggle());
  }

  private createTurnBanner(): void {
    this.turnBannerBg = this.scene.add.rectangle(512, 40, 300, 50, 0x2a4a2a)
      .setStrokeStyle(2, 0x4a6a4a);

    this.turnBannerText = this.scene.add.text(512, 40, '', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
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

    // Store callback for tooltip system
    this.getEntitiesAtPositionCallback = getEntitiesAtPosition;

    const centerX = 900;
    const centerY = 300;
    const radius = 100;

    // Draw wheel segments
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const nextAngle = ((i + 1) * Math.PI) / 4 - Math.PI / 2;

      // Draw segment outline with improved visibility
      this.wheelGraphics.lineStyle(2, 0x6a6a8a);
      this.wheelGraphics.beginPath();
      this.wheelGraphics.moveTo(centerX, centerY);
      this.wheelGraphics.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      this.wheelGraphics.arc(centerX, centerY, radius, angle, nextAngle, false);
      this.wheelGraphics.lineTo(centerX, centerY);
      this.wheelGraphics.strokePath();

      // Draw entities at this position (limit to 3 visible)
      const entitiesAtPos = getEntitiesAtPosition(i);
      if (entitiesAtPos.length > 0) {
        const midAngle = (angle + nextAngle) / 2;
        const visibleEntities = entitiesAtPos.slice(0, 3);
        const hasMore = entitiesAtPos.length > 3;

        for (let j = 0; j < visibleEntities.length; j++) {
          const entity = visibleEntities[j];

          // Stack entities radially - closer/farther from center
          const markerDist = radius * (0.45 + j * 0.18);
          const markerX = centerX + Math.cos(midAngle) * markerDist;
          const markerY = centerY + Math.sin(midAngle) * markerDist;

          if (entity.id === 'monster') {
            // Monster: red circle marker
            this.wheelGraphics.fillStyle(0xff4444, 0.9);
            this.wheelGraphics.fillCircle(markerX, markerY, 12);
            this.wheelGraphics.lineStyle(1, 0xffffff);
            this.wheelGraphics.strokeCircle(markerX, markerY, 12);
          } else {
            // Hero: colored circle based on index
            const heroIndex = parseInt(entity.id.split('-')[1]);
            const heroColors = [0x44ff44, 0x4488ff, 0xff8844, 0xffff44];
            this.wheelGraphics.fillStyle(heroColors[heroIndex % 4], 0.9);
            this.wheelGraphics.fillCircle(markerX, markerY, 10);
            this.wheelGraphics.lineStyle(1, 0xffffff);
            this.wheelGraphics.strokeCircle(markerX, markerY, 10);
          }
        }

        // If there are more than 3 entities, show "+N" indicator at outer edge
        if (hasMore) {
          const extraCount = entitiesAtPos.length - 3;
          const indicatorDist = radius * 0.9;
          const indicatorX = centerX + Math.cos(midAngle) * indicatorDist;
          const indicatorY = centerY + Math.sin(midAngle) * indicatorDist;

          this.wheelGraphics.fillStyle(0xcccccc, 0.8);
          this.wheelGraphics.fillCircle(indicatorX, indicatorY, 8);
          this.wheelGraphics.lineStyle(1, 0xffffff);
          this.wheelGraphics.strokeCircle(indicatorX, indicatorY, 8);

          // Draw text indicator
          this.scene.add.text(indicatorX, indicatorY, `+${extraCount}`, {
            fontSize: '10px',
            color: '#000000',
            align: 'center',
          }).setOrigin(0.5).setDepth(100);
        }
      }
    }

    // Highlight next actor's segment
    if (nextActorId && nextActorPosition !== undefined) {
      const pos = nextActorPosition;
      const angle = (pos * Math.PI) / 4 - Math.PI / 2;
      const nextAngle = ((pos + 1) * Math.PI) / 4 - Math.PI / 2;

      this.wheelGraphics.fillStyle(0xffff00, 0.3);
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

    // Draw center circle
    this.wheelGraphics.fillStyle(0x1a1a2e, 1);
    this.wheelGraphics.fillCircle(centerX, centerY, 15);
    this.wheelGraphics.lineStyle(2, 0x6a6a8a);
    this.wheelGraphics.strokeCircle(centerX, centerY, 15);
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

  private handleWheelHover(x: number, y: number): void {
    const centerX = 900;
    const centerY = 300;
    const radius = 100;

    // Calculate distance from wheel center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If outside wheel area, hide tooltip
    if (distance > radius || distance < 10) {
      this.hideWheelTooltip();
      return;
    }

    // Calculate which segment from angle
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) {
      angle += Math.PI * 2;
    }

    const segment = Math.floor((angle / (Math.PI * 2)) * 8) % 8;
    this.showWheelTooltip(segment, x, y);
  }

  private showWheelTooltip(segment: number, x: number, y: number): void {
    if (!this.getEntitiesAtPositionCallback) {
      return;
    }

    const entities = this.getEntitiesAtPositionCallback(segment);

    // If no entities, hide tooltip
    if (entities.length === 0) {
      this.hideWheelTooltip();
      return;
    }

    // Build text: "Position N:" followed by numbered list
    const lines: string[] = [`Position ${segment}:`];
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      let name: string;

      if (entity.id === 'monster') {
        name = 'Monster';
      } else {
        const heroIndex = parseInt(entity.id.split('-')[1]);
        name = `Hero ${heroIndex + 1}`;
      }

      lines.push(`  ${i + 1}. ${name}`);
    }

    const tooltipText = lines.join('\n');
    this.wheelTooltipText.setText(tooltipText);

    // Get actual text dimensions
    const padding = 10;
    const width = this.wheelTooltipText.width + padding * 2;
    const height = this.wheelTooltipText.height + padding * 2;

    // Position tooltip to the right of cursor
    const textX = x + 15;
    const textY = y;

    // Position text at top-left (origin 0, 0)
    this.wheelTooltipText.setPosition(textX, textY);

    // Clear previous background and draw new one
    this.wheelTooltipBg.clear();
    this.wheelTooltipBg.fillStyle(0x0a0a1e, 1);
    this.wheelTooltipBg.fillRoundedRect(textX - padding, textY - padding, width, height, 4);
    this.wheelTooltipBg.lineStyle(2, 0x8a8aaa);
    this.wheelTooltipBg.strokeRoundedRect(textX - padding, textY - padding, width, height, 4);

    // Show both bg and text
    this.wheelTooltipBg.setVisible(true);
    this.wheelTooltipText.setVisible(true);
  }

  private hideWheelTooltip(): void {
    this.wheelTooltipBg.clear();
    this.wheelTooltipBg.setVisible(false);
    this.wheelTooltipText.setVisible(false);
  }

  updateTurnBanner(actorId: string | null, monsterName: string): void {
    if (!actorId) {
      this.turnBannerBg.setVisible(false);
      this.turnBannerText.setVisible(false);
      return;
    }

    this.turnBannerBg.setVisible(true);
    this.turnBannerText.setVisible(true);

    if (actorId === 'monster') {
      this.turnBannerText.setText(`${monsterName}'s Turn`);
      this.turnBannerBg.setFillStyle(0x6a2a2a);
      this.turnBannerBg.setStrokeStyle(2, 0x8a4a4a);
    } else {
      const heroNum = parseInt(actorId.split('-')[1]) + 1;
      this.turnBannerText.setText(`Player ${heroNum}'s Turn`);
      this.turnBannerBg.setFillStyle(0x2a4a2a);
      this.turnBannerBg.setStrokeStyle(2, 0x4a6a4a);
    }
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

  /**
   * Set callback for when toggle happens
   */
  setToggleCallback(callback: (showingLog: boolean) => void): void {
    this.onToggleCallback = callback;
  }

  /**
   * Toggle between log and action panel
   */
  toggle(): void {
    this.showingLog = !this.showingLog;
    this.updateToggleState();
    if (this.onToggleCallback) {
      this.onToggleCallback(this.showingLog);
    }
  }

  /**
   * Show log (hide action panel)
   */
  showLog(): void {
    this.showingLog = true;
    this.updateToggleState();
  }

  /**
   * Hide log (show action panel)
   */
  hideLog(): void {
    this.showingLog = false;
    this.updateToggleState();
  }

  /**
   * Check if log is currently showing
   */
  isShowingLog(): boolean {
    return this.showingLog;
  }

  private updateToggleState(): void {
    this.logContainer.setVisible(this.showingLog);
    this.toggleButton.setText(this.showingLog ? '⚔' : '📜');
  }

  // ===== Cleanup =====

  destroy(): void {
    // Phaser scene will clean up other elements
  }

  /**
   * Subscribe to state observer for reactive updates.
   */
  subscribeToState(
    observer: BattleStateObserver,
    state: BattleState
  ): void {
    observer.subscribe({
      actorChanged: (actorId) => {
        this.updateStatusText(
          state.monster.name,
          state.monsterEntity.currentHealth,
          state.monster.stats.health,
          actorId
        );
        this.updateTurnBanner(actorId, state.monster.name);
        // Also update wheel display on actor change (initial draw)
        const nextId = state.wheel.getNextActor();
        const nextPosition = nextId ? state.wheel.getPosition(nextId) : undefined;
        this.updateWheelDisplay(
          (pos: number) => state.wheel.getEntitiesAtPosition(pos),
          nextId,
          nextPosition
        );
      },
      wheelAdvanced: () => {
        const nextId = state.wheel.getNextActor();
        const nextPosition = nextId ? state.wheel.getPosition(nextId) : undefined;
        this.updateWheelDisplay(
          (pos: number) => state.wheel.getEntitiesAtPosition(pos),
          nextId,
          nextPosition
        );
      },
      monsterHealthChanged: (current, max) => {
        const nextId = state.wheel.getNextActor();
        this.updateStatusText(state.monster.name, current, max, nextId);
      },
      monsterBeadsChanged: (counts) => {
        this.updateMonsterBeadDisplay(counts);
      },
    });
  }
}
