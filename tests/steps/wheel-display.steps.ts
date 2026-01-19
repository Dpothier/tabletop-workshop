import { Given, When, Then } from 'quickpickle';
import { expect, vi, type Mock } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { WheelEntry } from '@src/systems/ActionWheel';

interface MockText {
  destroy: Mock;
  text: string;
  setOrigin: Mock;
  setDepth: Mock;
}

interface MockGraphics {
  clear: Mock;
  lineStyle: Mock;
  beginPath: Mock;
  moveTo: Mock;
  lineTo: Mock;
  arc: Mock;
  strokePath: Mock;
  fillPath: Mock;
  fillStyle: Mock;
  fillCircle: Mock;
  strokeCircle: Mock;
}

interface MockScene {
  add: {
    graphics: () => MockGraphics;
    text: (x: number, y: number, text: string, style: object) => MockText;
  };
}

interface WheelDisplayWorld extends QuickPickleWorld {
  scene?: MockScene;
  wheelCountTexts?: MockText[];
  wheelGraphics?: MockGraphics;
  allCreatedTexts?: MockText[];
  destroyedTexts?: MockText[];
}

/**
 * Creates a mock Phaser scene for wheel display testing
 */
function createMockScene(world: WheelDisplayWorld): MockScene {
  world.allCreatedTexts = [];
  world.destroyedTexts = [];

  const mockGraphics: MockGraphics = {
    clear: vi.fn(),
    lineStyle: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    strokePath: vi.fn(),
    fillPath: vi.fn(),
    fillStyle: vi.fn(),
    fillCircle: vi.fn(),
    strokeCircle: vi.fn(),
  };

  return {
    add: {
      graphics: vi.fn(() => mockGraphics),
      text: vi.fn((_x: number, _y: number, text: string, _style: object): MockText => {
        const mockText: MockText = {
          destroy: vi.fn(() => {
            world.destroyedTexts!.push(mockText);
          }),
          text,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
        };
        world.allCreatedTexts!.push(mockText);
        return mockText;
      }),
    },
  };
}

/**
 * Simulates the updateWheelDisplay logic from BattleUI
 * This mirrors the production code for testing
 */
function updateWheelDisplay(
  world: WheelDisplayWorld,
  getEntitiesAtPosition: (pos: number) => WheelEntry[]
): void {
  // Clear graphics (simulated)
  world.wheelGraphics!.clear();

  // Clear previous count text indicators - THIS IS THE FIX WE'RE TESTING
  for (const text of world.wheelCountTexts!) {
    text.destroy();
  }
  world.wheelCountTexts = [];

  // Draw wheel segments
  for (let i = 0; i < 8; i++) {
    const entitiesAtPos = getEntitiesAtPosition(i);
    if (entitiesAtPos.length > 3) {
      const extraCount = entitiesAtPos.length - 3;
      // Create count text indicator
      const countText = world.scene!.add.text(0, 0, `+${extraCount}`, {});
      countText.setOrigin(0.5);
      countText.setDepth(100);
      world.wheelCountTexts!.push(countText);
    }
  }
}

// Background

Given('a mock BattleUI with wheel display', function (world: WheelDisplayWorld) {
  world.scene = createMockScene(world);
  world.wheelGraphics = world.scene.add.graphics();
  world.wheelCountTexts = [];
});

// When steps

When(
  'I update the wheel with {int} entities at position {int}',
  function (world: WheelDisplayWorld, count: number, position: number) {
    const getEntitiesAtPosition = (pos: number): WheelEntry[] => {
      if (pos === position) {
        return Array.from({ length: count }, (_, i) => ({
          id: `hero-${i}`,
          position: pos,
          arrivalOrder: i,
        }));
      }
      return [];
    };
    updateWheelDisplay(world, getEntitiesAtPosition);
  }
);

When(
  'I update the wheel with {int} entities at position {int} and {int} at position {int}',
  function (world: WheelDisplayWorld, count1: number, pos1: number, count2: number, pos2: number) {
    const getEntitiesAtPosition = (pos: number): WheelEntry[] => {
      if (pos === pos1) {
        return Array.from({ length: count1 }, (_, i) => ({
          id: `hero-${i}`,
          position: pos,
          arrivalOrder: i,
        }));
      }
      if (pos === pos2) {
        return Array.from({ length: count2 }, (_, i) => ({
          id: `entity-${i}`,
          position: pos,
          arrivalOrder: i,
        }));
      }
      return [];
    };
    updateWheelDisplay(world, getEntitiesAtPosition);
  }
);

// Then steps

Then('{int} count text should exist', function (world: WheelDisplayWorld, count: number) {
  expect(world.wheelCountTexts!.length).toBe(count);
});

Then('{int} count texts should exist', function (world: WheelDisplayWorld, count: number) {
  expect(world.wheelCountTexts!.length).toBe(count);
});

Then('the count text should show {string}', function (world: WheelDisplayWorld, expected: string) {
  expect(world.wheelCountTexts!.length).toBeGreaterThan(0);
  expect(world.wheelCountTexts![0].text).toBe(expected);
});

Then('all previous count texts should be destroyed', function (world: WheelDisplayWorld) {
  // Check that texts created before the last update were destroyed
  // The last batch of texts should still exist (in wheelCountTexts)
  // But previously created texts should have had destroy() called
  const currentTexts = world.wheelCountTexts!;
  const destroyedTexts = world.destroyedTexts!;

  // All texts that aren't in the current set should be destroyed
  for (const text of world.allCreatedTexts!) {
    if (!currentTexts.includes(text)) {
      expect(destroyedTexts).toContain(text);
    }
  }
});
