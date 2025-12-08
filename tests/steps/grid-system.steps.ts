import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { GridSystem } from '@src/systems/GridSystem';

interface GridWorld extends QuickPickleWorld {
  gridSystem?: GridSystem;
  worldX?: number;
  worldY?: number;
  gridX?: number;
  gridY?: number;
}

Given(
  'a grid system with size {int}, offset {int},{int} and arena {int}x{int}',
  function (
    world: GridWorld,
    size: number,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ) {
    world.gridSystem = new GridSystem(size, offsetX, offsetY, width, height);
  }
);

When(
  'converting grid position {int},{int} to world',
  function (world: GridWorld, gridX: number, gridY: number) {
    world.worldX = world.gridSystem!.gridToWorld(gridX);
    world.worldY = world.gridSystem!.gridToWorld(gridY);
  }
);

When(
  'converting world position {int},{int} to grid',
  function (world: GridWorld, worldX: number, worldY: number) {
    world.gridX = world.gridSystem!.worldToGrid(worldX);
    world.gridY = world.gridSystem!.worldToGrid(worldY);
  }
);

Then(
  'the world position should be {int},{int}',
  function (world: GridWorld, expectedX: number, expectedY: number) {
    expect(world.worldX).toBe(expectedX);
    expect(world.worldY).toBe(expectedY);
  }
);

Then(
  'the grid position should be {int},{int}',
  function (world: GridWorld, expectedX: number, expectedY: number) {
    expect(world.gridX).toBe(expectedX);
    expect(world.gridY).toBe(expectedY);
  }
);

Then('position {int},{int} should be valid', function (world: GridWorld, x: number, y: number) {
  expect(world.gridSystem!.isValidPosition(x, y)).toBe(true);
});

Then('position {int},{int} should be invalid', function (world: GridWorld, x: number, y: number) {
  expect(world.gridSystem!.isValidPosition(x, y)).toBe(false);
});
