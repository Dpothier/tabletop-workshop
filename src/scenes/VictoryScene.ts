import Phaser from 'phaser';

interface VictoryData {
  victory: boolean;
  monster: string;
  turns: number;
}

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data: VictoryData) {
    this.data.set('victory', data.victory);
    this.data.set('monster', data.monster);
    this.data.set('turns', data.turns);
  }

  create() {
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
  }
}
