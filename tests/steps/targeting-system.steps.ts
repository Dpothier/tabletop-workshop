import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { Position } from '@src/state/BattleGrid';
import { TargetingSystem, TargetingDeps } from '@src/systems/TargetingSystem';

interface MockDeps extends TargetingDeps {
  validMoves: Position[];
  highlightedTiles: Position[] | null;
  highlightColor: number | null;
  highlightRemoved: boolean;
  highlightHandle: unknown;
  loggedMessages: string[];
  clickCallback: ((x: number, y: number) => void) | null;
  getValidMovesCallParams?: { entityId: string; range: number };
}

interface TargetingSystemWorld extends QuickPickleWorld {
  mockDeps?: MockDeps;
  targetingSystem?: TargetingSystem;
  selectedPosition?: Position | null;
  isActiveResult?: boolean;
  hasError?: boolean;
}

/**
 * Creates a mock TargetingDeps object for testing
 */
function createMockDeps(validMoves: Position[] = []): MockDeps {
  const mockDeps: MockDeps = {
    validMoves,
    highlightedTiles: null,
    highlightColor: null,
    highlightRemoved: false,
    highlightHandle: null,
    loggedMessages: [],
    clickCallback: null,
    getValidMoves: vi.fn((entityId: string, range: number) => {
      mockDeps.getValidMovesCallParams = { entityId, range };
      return validMoves;
    }),
    highlightTiles: vi.fn((tiles: Position[], color: number) => {
      mockDeps.highlightedTiles = tiles;
      mockDeps.highlightColor = color;
      mockDeps.highlightHandle = { id: `highlight-${Math.random()}` };
      return mockDeps.highlightHandle;
    }),
    removeHighlight: vi.fn(() => {
      mockDeps.highlightRemoved = true;
    }),
    worldToGrid: vi.fn((world: number) => Math.floor(world / 64)),
    onPointerDown: vi.fn((callback: (x: number, y: number) => void) => {
      mockDeps.clickCallback = callback;
    }),
    log: vi.fn((message: string) => {
      mockDeps.loggedMessages.push(message);
    }),
  };

  return mockDeps;
}

// Background

Given(
  'a TargetingSystem with valid moves at {string}',
  function (world: TargetingSystemWorld, positions: string) {
    const posArray = positions.split(' and ').map((pos) => {
      const [x, y] = pos.split(',').map((v) => parseInt(v, 10));
      return { x, y };
    });
    world.mockDeps = createMockDeps(posArray);
    world.targetingSystem = new TargetingSystem(world.mockDeps);
  }
);

Given(
  'a TargetingSystem with valid moves at {int},{int} and {int},{int}',
  function (world: TargetingSystemWorld, x1: number, y1: number, x2: number, y2: number) {
    const posArray: Position[] = [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
    world.mockDeps = createMockDeps(posArray);
    world.targetingSystem = new TargetingSystem(world.mockDeps);
  }
);

Given(
  'a TargetingSystem with valid moves at {int},{int}',
  function (world: TargetingSystemWorld, x: number, y: number) {
    const posArray: Position[] = [{ x, y }];
    world.mockDeps = createMockDeps(posArray);
    world.targetingSystem = new TargetingSystem(world.mockDeps);
  }
);

Given('a TargetingSystem with no valid moves', function (world: TargetingSystemWorld) {
  world.mockDeps = createMockDeps([]);
  world.targetingSystem = new TargetingSystem(world.mockDeps);
});

// Tile targeting

When(
  'I show tile targeting for entity {string} with range {int} and action {string}',
  async function (
    world: TargetingSystemWorld,
    entityId: string,
    range: number,
    actionName: string
  ) {
    // Start targeting - this returns a promise that resolves when user clicks
    const targetingPromise = world.targetingSystem!.showTileTargeting(entityId, range, actionName);

    // Store the promise for later resolution
    (world as any).targetingPromise = targetingPromise;
  }
);

When(
  'I click on world position {int},{int}',
  async function (world: TargetingSystemWorld, worldX: number, worldY: number) {
    if (world.mockDeps!.clickCallback) {
      world.mockDeps!.clickCallback(worldX, worldY);
    }
    // Await the promise to capture the result
    if ((world as any).targetingPromise) {
      world.selectedPosition = await (world as any).targetingPromise;
    }
  }
);

When('I cancel targeting', async function (world: TargetingSystemWorld) {
  world.targetingSystem!.cancel();
  // Await the promise to capture the result
  if ((world as any).targetingPromise) {
    world.selectedPosition = await (world as any).targetingPromise;
  }
});

When('I cancel targeting without active targeting', function (world: TargetingSystemWorld) {
  try {
    world.targetingSystem!.cancel();
  } catch {
    world.hasError = true;
  }
});

// Assertions

Then(
  'valid tiles should be highlighted with color {word}',
  function (world: TargetingSystemWorld, colorHex: string) {
    const expectedColor = parseInt(colorHex, 16);
    expect(world.mockDeps!.highlightColor).toBe(expectedColor);
  }
);

Then(
  'an action prompt should be logged for action {string}',
  function (world: TargetingSystemWorld, actionName: string) {
    const hasPrompt = world.mockDeps!.loggedMessages.some((msg) => msg.includes(actionName));
    expect(hasPrompt).toBe(true);
  }
);

Then(
  'the targeting should return position {int},{int}',
  function (world: TargetingSystemWorld, expectedX: number, expectedY: number) {
    expect(world.selectedPosition).toEqual({ x: expectedX, y: expectedY });
  }
);

Then('the targeting should return null', function (world: TargetingSystemWorld) {
  expect(world.selectedPosition).toBeNull();
});

Then('the highlight should be removed', function (world: TargetingSystemWorld) {
  expect(world.mockDeps!.highlightRemoved).toBe(true);
});

Then(
  'getValidMoves should have been called with entity {string} and range {int}',
  function (world: TargetingSystemWorld, expectedEntityId: string, expectedRange: number) {
    expect(world.mockDeps!.getValidMoves).toHaveBeenCalledWith(expectedEntityId, expectedRange);
  }
);

Then('no error should occur', function (world: TargetingSystemWorld) {
  expect(world.hasError).not.toBe(true);
});

Then('isActive should return true', function (world: TargetingSystemWorld) {
  expect(world.targetingSystem!.isActive()).toBe(true);
});

Then('isActive should return false', function (world: TargetingSystemWorld) {
  expect(world.targetingSystem!.isActive()).toBe(false);
});
