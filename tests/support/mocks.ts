import { vi } from 'vitest';

export function createMockGraphics() {
  return {
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    closePath: vi.fn().mockReturnThis(),
    fillPath: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
  };
}

export function createMockCircle() {
  return {
    setStrokeStyle: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    disableInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
  };
}

export function createMockText() {
  return {
    setOrigin: vi.fn().mockReturnThis(),
  };
}

export function createMockRectangle() {
  return {};
}

export function createMockContainer() {
  return {
    add: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
  };
}

export function createMockTweens() {
  return {
    add: vi.fn(),
  };
}

export function createMockScene(): Phaser.Scene {
  return {
    add: {
      graphics: vi.fn(() => createMockGraphics()),
      circle: vi.fn(() => createMockCircle()),
      text: vi.fn(() => createMockText()),
      rectangle: vi.fn(() => createMockRectangle()),
      container: vi.fn(() => createMockContainer()),
    },
    tweens: createMockTweens(),
  } as unknown as Phaser.Scene;
}
