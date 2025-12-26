import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BeadPile } from '@src/systems/BeadPile';
import { BeadPool } from '@src/systems/BeadPool';
import type { BeadColor } from '@src/types/Beads';

interface BeadPoolWorld extends QuickPickleWorld {
  discard?: BeadPile;
  pool?: BeadPool;
  drawnBead?: BeadColor;
  drawnBeads?: BeadColor[];
  thrownError?: Error;
  seededRandom?: () => number;
}

// Setup

Given('an empty discard pile', function (world: BeadPoolWorld) {
  world.discard = new BeadPile();
});

Given(
  'a pool with {int} red, {int} blue, {int} green, {int} white beads',
  function (world: BeadPoolWorld, red: number, blue: number, green: number, white: number) {
    const randomFn = world.seededRandom ?? Math.random;
    world.pool = new BeadPool({ red, blue, green, white }, world.discard!, randomFn);
  }
);

When(
  'I try to create a pool with {int} red, {int} blue, {int} green, {int} white beads',
  function (world: BeadPoolWorld, red: number, blue: number, green: number, white: number) {
    try {
      world.pool = new BeadPool({ red, blue, green, white }, world.discard!);
    } catch (e) {
      world.thrownError = e as Error;
    }
  }
);

Given('a seeded random that returns {float}', function (world: BeadPoolWorld, value: number) {
  world.seededRandom = () => value;
});

// Drawing

When('I draw from the pool', function (world: BeadPoolWorld) {
  world.drawnBead = world.pool!.draw();
});

When('I draw {int} beads from the pool', function (world: BeadPoolWorld, count: number) {
  world.drawnBeads = [];
  for (let i = 0; i < count; i++) {
    world.drawnBeads.push(world.pool!.draw());
  }
});

// Discard manipulation (for reshuffle tests)

When('I add {int} red beads to the discard', function (world: BeadPoolWorld, count: number) {
  world.discard!.add('red', count);
});

When('I add {int} blue beads to the discard', function (world: BeadPoolWorld, count: number) {
  world.discard!.add('blue', count);
});

When('I add {int} green beads to the discard', function (world: BeadPoolWorld, count: number) {
  world.discard!.add('green', count);
});

When('I add {int} white beads to the discard', function (world: BeadPoolWorld, count: number) {
  world.discard!.add('white', count);
});

// Assertions

Then('the pool should have {int} total remaining', function (world: BeadPoolWorld, total: number) {
  expect(world.pool!.getTotalRemaining()).toBe(total);
});

Then('the pool should be empty', function (world: BeadPoolWorld) {
  expect(world.pool!.isEmpty()).toBe(true);
});

Then('the pool should have {int} red remaining', function (world: BeadPoolWorld, count: number) {
  expect(world.pool!.getRemainingCounts().red).toBe(count);
});

Then('the pool should have {int} blue remaining', function (world: BeadPoolWorld, count: number) {
  expect(world.pool!.getRemainingCounts().blue).toBe(count);
});

Then('the pool should have {int} green remaining', function (world: BeadPoolWorld, count: number) {
  expect(world.pool!.getRemainingCounts().green).toBe(count);
});

Then('the pool should have {int} white remaining', function (world: BeadPoolWorld, count: number) {
  expect(world.pool!.getRemainingCounts().white).toBe(count);
});

Then('the drawn bead should be red', function (world: BeadPoolWorld) {
  expect(world.drawnBead).toBe('red');
});

Then('the drawn bead should be blue', function (world: BeadPoolWorld) {
  expect(world.drawnBead).toBe('blue');
});

Then('the drawn bead should be green', function (world: BeadPoolWorld) {
  expect(world.drawnBead).toBe('green');
});

Then('the drawn bead should be white', function (world: BeadPoolWorld) {
  expect(world.drawnBead).toBe('white');
});

Then('the discard should be empty', function (world: BeadPoolWorld) {
  expect(world.discard!.isEmpty()).toBe(true);
});

// Note: "an error should be thrown with message {string}" is defined in character.steps.ts
