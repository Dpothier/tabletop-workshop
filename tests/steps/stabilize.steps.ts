import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { Entity } from '@src/entities/Entity';

interface StabilizeWorld extends QuickPickleWorld {
  entity?: Entity;
}

// Stabilized Wounds Management

Given('the entity has {int} stabilized wounds', function (world: StabilizeWorld, count: number) {
  if (!world.entity) {
    throw new Error('Entity not found in world');
  }
  world.entity.stabilizedWounds = count;
});

// Stabilization Actions

When('the entity stabilizes {int} wounds', function (world: StabilizeWorld, count: number) {
  if (!world.entity) {
    throw new Error('Entity not found in world');
  }
  world.entity.stabilize(count);
});

// Hand Size Assertions

Then(
  'the entity hand size should be {int}',
  function (world: StabilizeWorld, expectedHandSize: number) {
    if (!world.entity) {
      throw new Error('Entity not found in world');
    }
    expect(world.entity.getHandSize()).toBe(expectedHandSize);
  }
);

// Wounds Assertions

Then('the entity wounds should be {int}', function (world: StabilizeWorld, expectedWounds: number) {
  if (!world.entity) {
    throw new Error('Entity not found in world');
  }
  expect(world.entity.getWounds()).toBe(expectedWounds);
});

// Stabilized Wounds Assertions

Then(
  'the entity stabilized wounds should be {int}',
  function (world: StabilizeWorld, expectedStabilized: number) {
    if (!world.entity) {
      throw new Error('Entity not found in world');
    }
    expect(world.entity.stabilizedWounds).toBe(expectedStabilized);
  }
);
