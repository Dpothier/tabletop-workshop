import Phaser from 'phaser';
import { CombatLogSerializer } from '@src/recording/CombatLogSerializer';
import type { BattleSnapshot } from '@src/recording/BattleSnapshot';
import type { CombatLogEntry } from '@src/recording/CombatRecorder';

interface VictoryData {
  victory: boolean;
  monster: string;
  turns: number;
  recording?: { snapshot: BattleSnapshot; entries: CombatLogEntry[] };
}

export class VictoryScene extends Phaser.Scene {
  private recording?: { snapshot: BattleSnapshot; entries: CombatLogEntry[] };

  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data: VictoryData): void {
    this.data.set('victory', data.victory);
    this.data.set('monster', data.monster);
    this.data.set('turns', data.turns);
    this.recording = data.recording;
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const victory = this.data.get('victory') as boolean;
    const monster = this.data.get('monster') as string;
    const turns = this.data.get('turns') as number;

    // Result banner
    const bannerColor = victory ? 0x44aa44 : 0xaa4444;
    this.add.rectangle(centerX, centerY - 100, 400, 80, bannerColor);

    this.add
      .text(centerX, centerY - 100, victory ? 'VICTORY!' : 'DEFEAT', {
        fontSize: '48px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Stats
    this.add
      .text(
        centerX,
        centerY,
        [
          `Monster: ${monster}`,
          `Turns: ${turns}`,
          victory ? 'The beast has fallen!' : 'Your party was slain...',
        ].join('\n'),
        {
          fontSize: '20px',
          color: '#cccccc',
          align: 'center',
          lineSpacing: 10,
        }
      )
      .setOrigin(0.5);

    // Play Again button
    const playAgainBtn = this.add
      .rectangle(centerX, centerY + 150, 200, 50, 0x4466aa)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX, centerY + 150, 'Play Again', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(0x5577bb));
    playAgainBtn.on('pointerout', () => playAgainBtn.setFillStyle(0x4466aa));
    playAgainBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // Main Menu button
    const menuBtn = this.add
      .rectangle(centerX, centerY + 220, 200, 50, 0x444466)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX, centerY + 220, 'Main Menu', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x555577));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x444466));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // Expose state for E2E testing
    (this as any).__victoryState = (): Record<string, any> => ({
      hasExportButton: !!this.recording,
      recording: this.recording,
    });

    // Export button (only if recording exists)
    if (this.recording) {
      const exportBtn = this.add
        .rectangle(centerX, centerY + 290, 200, 50, 0xaa6644)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(centerX, centerY + 290, 'Exporter', {
          fontSize: '24px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      exportBtn.on('pointerover', () => exportBtn.setFillStyle(0xbb7755));
      exportBtn.on('pointerout', () => exportBtn.setFillStyle(0xaa6644));
      exportBtn.on('pointerdown', () => this.handleExport());
    }
  }

  private handleExport(): void {
    if (!this.recording) return;

    const jsonl = CombatLogSerializer.toJSONL(this.recording.snapshot, this.recording.entries);
    const monster = this.data.get('monster') as string;
    const victory = this.data.get('victory') as boolean;
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const result = victory ? 'victory' : 'defeat';
    const filename = `combat-${monster}-${dateStr}-${result}.jsonl`;

    const blob = new Blob([jsonl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
