import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid, MoveResult, Position } from '@src/state/BattleGrid';

interface BattleGridWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  moveResult?: MoveResult;
  validMoves?: Position[];
  errorThrown?: boolean;
}

// Background

Given(
  'a battle grid of size {int}x{int}',
  function (world: BattleGridWorld, width: number, height: number) {
    world.grid = new BattleGrid(width, height);
  }
);

// Registration

When(
  'I register entity {string} at position {int},{int}',
  function (world: BattleGridWorld, entityId: string, x: number, y: number) {
    world.grid!.register(entityId, x, y);
  }
);

Given(
  'entity {string} is registered at position {int},{int}',
  function (world: BattleGridWorld, entityId: string, x: number, y: number) {
    world.grid!.register(entityId, x, y);
  }
);

// Position Queries

Then(
  'entity {string} should be at position {int},{int}',
  function (world: BattleGridWorld, entityId: string, x: number, y: number) {
    const position = world.grid!.getPosition(entityId);
    expect(position).not.toBeNull();
    expect(position!.x).toBe(x);
    expect(position!.y).toBe(y);
  }
);

Then(
  'getting position of {string} should return null',
  function (world: BattleGridWorld, entityId: string) {
    const position = world.grid!.getPosition(entityId);
    expect(position).toBeNull();
  }
);

Then(
  'the entity at position {int},{int} should be {string}',
  function (world: BattleGridWorld, x: number, y: number, expectedId: string) {
    const entityId = world.grid!.getEntityAt(x, y);
    expect(entityId).toBe(expectedId);
  }
);

Then(
  'the entity at position {int},{int} should be null',
  function (world: BattleGridWorld, x: number, y: number) {
    const entityId = world.grid!.getEntityAt(x, y);
    expect(entityId).toBeNull();
  }
);

// Movement

When(
  'I move entity {string} to position {int},{int}',
  function (world: BattleGridWorld, entityId: string, x: number, y: number) {
    world.moveResult = world.grid!.moveEntity(entityId, { x, y });
  }
);

Then('the move result should be successful', function (world: BattleGridWorld) {
  expect(world.moveResult).toBeDefined();
  expect(world.moveResult!.success).toBe(true);
});

Then(
  'the move result should fail with reason {string}',
  function (world: BattleGridWorld, reason: string) {
    expect(world.moveResult).toBeDefined();
    expect(world.moveResult!.success).toBe(false);
    expect(world.moveResult!.reason).toBe(reason);
  }
);

// Distance

Then(
  'the distance between {string} and {string} should be {int}',
  function (world: BattleGridWorld, id1: string, id2: string, expectedDistance: number) {
    const distance = world.grid!.getDistance(id1, id2);
    expect(distance).toBe(expectedDistance);
  }
);

// Adjacency

Then(
  '{string} and {string} should be adjacent',
  function (world: BattleGridWorld, id1: string, id2: string) {
    const adjacent = world.grid!.isAdjacent(id1, id2);
    expect(adjacent).toBe(true);
  }
);

Then(
  '{string} and {string} should not be adjacent',
  function (world: BattleGridWorld, id1: string, id2: string) {
    const adjacent = world.grid!.isAdjacent(id1, id2);
    expect(adjacent).toBe(false);
  }
);

// Valid Moves

When(
  'I get valid moves for {string} with range {int}',
  function (world: BattleGridWorld, entityId: string, range: number) {
    world.validMoves = world.grid!.getValidMoves(entityId, range);
  }
);

Then(
  'the valid moves should contain position {int},{int}',
  function (world: BattleGridWorld, x: number, y: number) {
    expect(world.validMoves).toBeDefined();
    const found = world.validMoves!.some((pos) => pos.x === x && pos.y === y);
    expect(found).toBe(true);
  }
);

Then(
  'the valid moves should not contain position {int},{int}',
  function (world: BattleGridWorld, x: number, y: number) {
    expect(world.validMoves).toBeDefined();
    const found = world.validMoves!.some((pos) => pos.x === x && pos.y === y);
    expect(found).toBe(false);
  }
);

// Bounds Checking

Then(
  'position {int},{int} should be in bounds',
  function (world: BattleGridWorld, x: number, y: number) {
    expect(world.grid!.isInBounds(x, y)).toBe(true);
  }
);

Then(
  'position {int},{int} should be out of bounds',
  function (world: BattleGridWorld, x: number, y: number) {
    expect(world.grid!.isInBounds(x, y)).toBe(false);
  }
);

// Unregister

When('I unregister entity {string}', function (world: BattleGridWorld, entityId: string) {
  world.errorThrown = false;
  try {
    world.grid!.unregister(entityId);
  } catch {
    world.errorThrown = true;
  }
});

Then('no error should be thrown', function (world: BattleGridWorld) {
  expect(world.errorThrown).toBe(false);
});
