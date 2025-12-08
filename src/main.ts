import Phaser from 'phaser';
import { MenuScene } from '@src/scenes/MenuScene';
import { BattleScene } from '@src/scenes/BattleScene';
import { VictoryScene } from '@src/scenes/VictoryScene';

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

const game = new Phaser.Game(config);

// Expose game instance and helpers for E2E testing
declare global {
  interface Window {
    __PHASER_GAME__: Phaser.Game;
    __GAME_CLICK__: (gameX: number, gameY: number) => { x: number; y: number };
  }
}
window.__PHASER_GAME__ = game;

// Helper to get screen coordinates from game coordinates (for Playwright)
window.__GAME_CLICK__ = (gameX: number, gameY: number) => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / 1024;
  const scaleY = rect.height / 768;
  return {
    x: rect.left + gameX * scaleX,
    y: rect.top + gameY * scaleY,
  };
};
