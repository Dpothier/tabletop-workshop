import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { BattleScene } from './scenes/BattleScene';
import { VictoryScene } from './scenes/VictoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#2d2d44',
  scene: [MenuScene, BattleScene, VictoryScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
