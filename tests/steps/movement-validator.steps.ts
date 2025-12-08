import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { MovementValidator } from '@src/systems/MovementValidator';
import { GridSystem } from '@src/systems/GridSystem';

interface Position {
  x: number;
  y: number;
}

interface MovementWorld extends QuickPickleWorld {
  movementValidator?: MovementValidator;
  gridSystem?: GridSystem;
  tokenPosition?: Position;
  otherTokens?: Position[];
  moveValid?: boolean;
  validMoves?: Position[];
}

Given(
  'a movement validator with arena {int}x{int}',
  function (world: MovementWorld, width: number, height: number) {
    world.gridSystem = new GridSystem(64, 80, 80, width, height);
    world.otherTokens = [];
    world.movementValidator = new MovementValidator(
      world.gridSystem,
      () => world.otherTokens || []
    );
  }
);

Given('a token at position {int},{int}', function (world: MovementWorld, x: number, y: number) {
  world.tokenPosition = { x, y };
  world.otherTokens = world.otherTokens || [];
  world.otherTokens.push({ x, y });
});

Given(
  'another token at position {int},{int}',
  function (world: MovementWorld, x: number, y: number) {
    world.otherTokens = world.otherTokens || [];
    world.otherTokens.push({ x, y });
  }
);

When(
  'checking if move to {int},{int} is valid with speed {int}',
  function (world: MovementWorld, toX: number, toY: number, speed: number) {
    world.moveValid = world.movementValidator!.isValidMove(
      world.tokenPosition!.x,
      world.tokenPosition!.y,
      toX,
      toY,
      speed
    );
  }
);

When('getting valid moves with speed {int}', function (world: MovementWorld, speed: number) {
  world.validMoves = world.movementValidator!.getValidMoves(
    world.tokenPosition!.x,
    world.tokenPosition!.y,
    speed
  );
});

Then('the move should be valid', function (world: MovementWorld) {
  expect(world.moveValid).toBe(true);
});

Then('the move should be invalid', function (world: MovementWorld) {
  expect(world.moveValid).toBe(false);
});

Then(
  'the valid moves should not include {int},{int}',
  function (world: MovementWorld, x: number, y: number) {
    const found = world.validMoves!.some((pos) => pos.x === x && pos.y === y);
    expect(found).toBe(false);
  }
);

Then(
  'the valid moves should include {int},{int}',
  function (world: MovementWorld, x: number, y: number) {
    const found = world.validMoves!.some((pos) => pos.x === x && pos.y === y);
    expect(found).toBe(true);
  }
);

Then(
  'position {int},{int} should be occupied',
  function (world: MovementWorld, x: number, y: number) {
    expect(world.movementValidator!.isOccupied(x, y)).toBe(true);
  }
);

Then(
  'position {int},{int} should not be occupied',
  function (world: MovementWorld, x: number, y: number) {
    expect(world.movementValidator!.isOccupied(x, y)).toBe(false);
  }
);
