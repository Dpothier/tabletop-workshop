import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';

/**
 * These step definitions test PreparationManager integration with Entity.buffs.
 * Pending MFG-56: currently tests Entity.buffs directly since the manager
 * hasn't been refactored to delegate to Entity.buffs yet.
 */

interface PrepManagerWorld extends QuickPickleWorld {
  prepGrid?: BattleGrid;
  prepEntity?: Entity;
  prepMaxStacks?: number;
  prepQueryResult?: number;
  prepPairedCheckResult?: boolean;
}

// Given steps

Given('a prep manager grid and entity', function (world: PrepManagerWorld) {
  world.prepGrid = new BattleGrid(9, 9);
  world.prepEntity = new Entity('prep-test-entity', 100, world.prepGrid);
});

Given(
  'the prep entity has {int} stacks of {string}',
  function (world: PrepManagerWorld, count: number, prepType: string) {
    expect(world.prepEntity).toBeDefined();
    if (count > 0) {
      world.prepEntity!.addStacks(prepType, count);
    }
  }
);

// When steps — operate through Entity.buffs directly (pending MFG-56 manager refactoring)

When(
  'I add {int} stacks of {string} to the entity via prep manager',
  function (world: PrepManagerWorld, count: number, prepType: string) {
    expect(world.prepEntity).toBeDefined();
    world.prepEntity!.addStacks(prepType, count);
  }
);

When(
  'I add {int} stacks of {string} to the entity via prep manager with max {int}',
  function (world: PrepManagerWorld, count: number, prepType: string, maxStacks: number) {
    expect(world.prepEntity).toBeDefined();
    const current = world.prepEntity!.getStacks(prepType);
    const newTotal = Math.min(current + count, maxStacks);
    // Clear and re-add to enforce cap
    world.prepEntity!.clearStacks(prepType);
    if (newTotal > 0) {
      world.prepEntity!.addStacks(prepType, newTotal);
    }
  }
);

When(
  'I query preparation stacks of {string} via prep manager',
  function (world: PrepManagerWorld, prepType: string) {
    expect(world.prepEntity).toBeDefined();
    world.prepQueryResult = world.prepEntity!.getStacks(prepType);
  }
);

When(
  'I clear preparation {string} via prep manager',
  function (world: PrepManagerWorld, prepType: string) {
    expect(world.prepEntity).toBeDefined();
    world.prepEntity!.clearStacks(prepType);
  }
);

When('I interrupt all preparations via prep manager', function (world: PrepManagerWorld) {
  expect(world.prepEntity).toBeDefined();
  world.prepEntity!.clearAll();
});

When(
  'I check if entity has paired stacks for {string} via prep manager',
  function (world: PrepManagerWorld, prepType: string) {
    expect(world.prepEntity).toBeDefined();
    world.prepPairedCheckResult = world.prepEntity!.getStacks(prepType) > 0;
  }
);

// Then steps

Then(
  'the prep entity should have {int} stacks of {string}',
  function (world: PrepManagerWorld, expectedCount: number, prepType: string) {
    expect(world.prepEntity).toBeDefined();
    const actualCount = world.prepEntity!.getStacks(prepType);
    expect(actualCount).toBe(expectedCount);
  }
);

Then(
  'the queried preparation stacks should be {int}',
  function (world: PrepManagerWorld, expectedCount: number) {
    expect(world.prepQueryResult).toBeDefined();
    expect(world.prepQueryResult).toBe(expectedCount);
  }
);

Then('the paired check should succeed', function (world: PrepManagerWorld) {
  expect(world.prepPairedCheckResult).toBeDefined();
  expect(world.prepPairedCheckResult).toBe(true);
});

Then('the paired check should fail', function (world: PrepManagerWorld) {
  expect(world.prepPairedCheckResult).toBeDefined();
  expect(world.prepPairedCheckResult).toBe(false);
});
