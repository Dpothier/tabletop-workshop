import Phaser from 'phaser';
import { loadGameData, GameData } from '@src/systems/DataLoader';
import { BattleBuilder } from '@src/builders/BattleBuilder';

export class MenuScene extends Phaser.Scene {
  private gameData!: GameData;
  private builder!: BattleBuilder;

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create(): Promise<void> {
    this.gameData = await loadGameData();

    // Initialize builder with defaults
    this.builder = new BattleBuilder()
      .withMonster(this.gameData.monsters[0])
      .withArena(this.gameData.arenas[0])
      .withPartySize(4)
      .withClasses(this.gameData.classes)
      .withActions(this.gameData.actions);

    const centerX = this.cameras.main.width / 2;

    // Title
    this.add
      .text(centerX, 60, 'BOSS BATTLE', {
        fontSize: '48px',
        color: '#e0e0e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 110, 'Tabletop Prototype', {
        fontSize: '20px',
        color: '#888888',
      })
      .setOrigin(0.5);

    // Monster Selection
    this.add
      .text(centerX, 180, 'Select Monster', {
        fontSize: '24px',
        color: '#ffaa00',
      })
      .setOrigin(0.5);

    const monsterNames = this.gameData.monsters.map((m) => m.name);
    this.createSelector(centerX, 220, monsterNames, (index) => {
      this.builder.withMonster(this.gameData.monsters[index]);
    });

    // Arena Selection
    this.add
      .text(centerX, 300, 'Select Arena', {
        fontSize: '24px',
        color: '#00aaff',
      })
      .setOrigin(0.5);

    const arenaNames = this.gameData.arenas.map((a) => a.name);
    this.createSelector(centerX, 340, arenaNames, (index) => {
      this.builder.withArena(this.gameData.arenas[index]);
    });

    // Party Size
    this.add
      .text(centerX, 420, 'Party Size', {
        fontSize: '24px',
        color: '#00ff88',
      })
      .setOrigin(0.5);

    this.createSelector(
      centerX,
      460,
      ['2 Players', '3 Players', '4 Players'],
      (index) => {
        this.builder.withPartySize(index + 2);
      },
      2
    );

    // Start Button
    const startButton = this.add
      .rectangle(centerX, 580, 200, 60, 0x44aa44)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX, 580, 'START BATTLE', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    startButton.on('pointerover', () => startButton.setFillStyle(0x55cc55));
    startButton.on('pointerout', () => startButton.setFillStyle(0x44aa44));
    startButton.on('pointerdown', () => this.startBattle());

    // Instructions
    this.add
      .text(centerX, 700, 'Click arrows to select, then START BATTLE', {
        fontSize: '16px',
        color: '#666666',
      })
      .setOrigin(0.5);
  }

  private createSelector(
    x: number,
    y: number,
    options: string[],
    onChange: (index: number) => void,
    defaultIndex: number = 0
  ): void {
    let currentIndex = defaultIndex;

    const displayText = this.add
      .text(x, y, options[currentIndex], {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const leftArrow = this.add
      .text(x - 150, y, '<', {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const rightArrow = this.add
      .text(x + 150, y, '>', {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leftArrow.on('pointerdown', () => {
      currentIndex = (currentIndex - 1 + options.length) % options.length;
      displayText.setText(options[currentIndex]);
      onChange(currentIndex);
    });

    rightArrow.on('pointerdown', () => {
      currentIndex = (currentIndex + 1) % options.length;
      displayText.setText(options[currentIndex]);
      onChange(currentIndex);
    });
  }

  private startBattle(): void {
    const state = this.builder.build();
    this.scene.start('BattleScene', { state });
  }
}
