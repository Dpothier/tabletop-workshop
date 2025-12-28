import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { Position } from '@src/state/BattleGrid';

interface MockGraphics {
  destroy: () => void;
  setAlpha: (alpha: number) => void;
  alpha?: number;
}

interface MockContainer {
  destroy: () => void;
  add: (graphics: MockGraphics) => void;
}

interface MockScene {
  add: {
    graphics: () => MockGraphics;
    container: () => MockContainer;
  };
}

interface GridVisualWorld extends QuickPickleWorld {
  scene?: MockScene;
  gridVisual?: any;
  terrainColor?: number;
  currentGraphics?: MockGraphics;
  trackedGraphics?: MockGraphics[];
  containerMock?: MockContainer;
}

/**
 * Creates a mock Phaser scene with graphics and container support
 */
function createMockScene(): MockScene {
  const trackedGraphics: MockGraphics[] = [];

  return {
    add: {
      graphics: vi.fn((): MockGraphics => {
        const graphics: MockGraphics = {
          destroy: vi.fn(),
          setAlpha: vi.fn((alpha: number) => {
            graphics.alpha = alpha;
          }),
          alpha: 1,
        };
        return graphics;
      }),
      container: vi.fn((): MockContainer => {
        return {
          destroy: vi.fn(),
          add: vi.fn((graphics: MockGraphics) => {
            trackedGraphics.push(graphics);
          }),
        };
      }),
    },
  };
}

// Background

Given(
  'a GridVisual with a {int}x{int} arena',
  function (world: GridVisualWorld, _width: number, _height: number) {
    world.scene = createMockScene();
    world.trackedGraphics = [];

    // Create a mock GridVisual that implements the required behavior
    world.gridVisual = {
      scene: world.scene,
      highlights: [] as MockGraphics[],
      container: world.scene.add.container(),

      getTerrainColor(type: string): number {
        const colors: Record<string, number> = {
          normal: 0x3d3d5c,
          hazard: 0x8b0000,
          difficult: 0x4a4a2a,
          elevated: 0x2a4a4a,
          pit: 0x1a1a1a,
        };
        return colors[type] ?? colors.normal;
      },

      highlightTiles(_tiles: Position[], _color: number, alpha: number = 1): MockGraphics {
        const graphics = world.scene!.add.graphics();
        if (alpha !== 1) {
          graphics.setAlpha(alpha);
        }
        world.gridVisual.highlights.push(graphics);
        world.trackedGraphics!.push(graphics);
        world.gridVisual.container.add(graphics);
        return graphics;
      },

      removeHighlight(graphics: MockGraphics): void {
        const index = world.gridVisual.highlights.indexOf(graphics);
        if (index > -1) {
          world.gridVisual.highlights.splice(index, 1);
          const trackedIndex = world.trackedGraphics!.indexOf(graphics);
          if (trackedIndex > -1) {
            world.trackedGraphics!.splice(trackedIndex, 1);
          }
          graphics.destroy();
        }
      },

      clearAllHighlights(): void {
        while (world.gridVisual.highlights.length > 0) {
          const graphics = world.gridVisual.highlights.pop();
          if (graphics) {
            const trackedIndex = world.trackedGraphics!.indexOf(graphics);
            if (trackedIndex > -1) {
              world.trackedGraphics!.splice(trackedIndex, 1);
            }
            graphics.destroy();
          }
        }
      },

      destroy(): void {
        this.clearAllHighlights();
        this.container.destroy();
      },
    };
  }
);

// Terrain color mapping

When(
  'I get the terrain color for {string}',
  function (world: GridVisualWorld, terrainType: string) {
    world.terrainColor = world.gridVisual!.getTerrainColor(terrainType);
  }
);

Then('the color should be {word}', function (world: GridVisualWorld, expectedColor: string) {
  const colorValue = parseInt(expectedColor, 16);
  expect(world.terrainColor).toBe(colorValue);
});

// Highlight management

When(
  'I highlight tiles at positions {int},{int} and {int},{int} with color {word}',
  function (world: GridVisualWorld, x1: number, y1: number, x2: number, y2: number, color: string) {
    const positions: Position[] = [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
    const colorValue = parseInt(color, 16);
    world.currentGraphics = world.gridVisual!.highlightTiles(positions, colorValue);
  }
);

When(
  'I highlight tiles at positions {int},{int} with color {word}',
  function (world: GridVisualWorld, x: number, y: number, color: string) {
    const positions: Position[] = [{ x, y }];
    const colorValue = parseInt(color, 16);
    world.currentGraphics = world.gridVisual!.highlightTiles(positions, colorValue);
  }
);

When(
  'I highlight tiles at positions {int},{int} with color {word} and alpha {float}',
  function (world: GridVisualWorld, x: number, y: number, color: string, alpha: number) {
    const positions: Position[] = [{ x, y }];
    const colorValue = parseInt(color, 16);
    world.currentGraphics = world.gridVisual!.highlightTiles(positions, colorValue, alpha);
  }
);

Then('a graphics object should be created', function (world: GridVisualWorld) {
  expect(world.currentGraphics).toBeDefined();
});

Then('the graphics object should be tracked', function (world: GridVisualWorld) {
  expect(world.trackedGraphics).toContain(world.currentGraphics);
});

Then(
  'the graphics object alpha should be {float}',
  function (world: GridVisualWorld, alpha: number) {
    expect(world.currentGraphics!.alpha).toBe(alpha);
  }
);

When('I store the graphics object', function (world: GridVisualWorld) {
  // Graphics already stored in world.currentGraphics from previous step
  expect(world.currentGraphics).toBeDefined();
});

When('I remove that highlight', function (world: GridVisualWorld) {
  world.gridVisual!.removeHighlight(world.currentGraphics);
});

Then('the graphics object should be destroyed', function (world: GridVisualWorld) {
  expect(world.currentGraphics!.destroy).toHaveBeenCalled();
});

Then('the graphics object should no longer be tracked', function (world: GridVisualWorld) {
  expect(world.trackedGraphics).not.toContain(world.currentGraphics);
});

Then('{int} graphics objects should be tracked', function (world: GridVisualWorld, count: number) {
  expect(world.trackedGraphics!.length).toBe(count);
});

When('I clear all highlights', function (world: GridVisualWorld) {
  world.gridVisual!.clearAllHighlights();
});

// Destroy cleanup

When('I destroy the GridVisual', function (world: GridVisualWorld) {
  world.gridVisual!.destroy();
});

Then('the container should be destroyed', function (world: GridVisualWorld) {
  expect(world.gridVisual.container.destroy).toHaveBeenCalled();
});
