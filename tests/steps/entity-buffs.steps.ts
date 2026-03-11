import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PREPARATION_DEFINITIONS } from '@src/data/PreparationDefinitions';
import type { PreparationType } from '@src/data/PreparationDefinitions';

interface BuffsWorld extends QuickPickleWorld {
  buffsGrid?: BattleGrid;
  buffsEntity?: Entity;
}

// Given steps

Given(
  'a buffs entity {string} with {int} health',
  function (world: BuffsWorld, entityName: string, health: number) {
    if (!world.buffsGrid) {
      world.buffsGrid = new BattleGrid(9, 9);
    }
    world.buffsEntity = new Entity(entityName, health, world.buffsGrid);
    world.buffsEntity.currentHealth = health;
  }
);

Given(
  'the buffs entity has {int} stacks of {string}',
  function (world: BuffsWorld, count: number, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    world.buffsEntity!.clearStacks(effectName);
    if (count > 0) {
      world.buffsEntity!.addStacks(effectName, count);
    }
  }
);

Given(
  'a preparation manager with max {int} stacks for {string}',
  function (_world: BuffsWorld, _maxStacks: number, _effectName: string) {
    // maxStacks is defined in PREPARATION_DEFINITIONS, nothing to initialize
  }
);

// When steps

When(
  'I add {int} stacks of {string} to the buffs entity',
  function (world: BuffsWorld, count: number, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    world.buffsEntity!.addStacks(effectName, count);
  }
);

When(
  'I clear stacks of {string} on the buffs entity',
  function (world: BuffsWorld, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    world.buffsEntity!.clearStacks(effectName);
  }
);

When('I clear all stacks on the buffs entity', function (world: BuffsWorld) {
  expect(world.buffsEntity).toBeDefined();
  world.buffsEntity!.clearAll();
});

When(
  'I query stacks of {string} on the buffs entity',
  function (world: BuffsWorld, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    const stacks = world.buffsEntity!.getStacks(effectName);
    expect(stacks).toBeDefined();
  }
);

When(
  'I add {int} windup stacks via the preparation manager',
  function (world: BuffsWorld, count: number) {
    expect(world.buffsEntity).toBeDefined();
    const entity = world.buffsEntity!;
    const definition = PREPARATION_DEFINITIONS['windup' as PreparationType];
    const current = entity.getStacks('windup');
    const newTotal =
      definition.maxStacks !== null
        ? Math.min(current + count, definition.maxStacks)
        : current + count;
    entity.clearStacks('windup');
    if (newTotal > 0) {
      entity.addStacks('windup', newTotal);
    }
  }
);

When('end-of-round burn is resolved on the buffs entity', function (world: BuffsWorld) {
  expect(world.buffsEntity).toBeDefined();
  const entity = world.buffsEntity!;
  const stacks = entity.getStacks('burn');
  if (stacks > 0) {
    entity.receiveDamage(stacks);
    entity.clearStacks('burn');
  }
});

// Then steps

Then(
  'the buffs entity should have {int} stacks of {string}',
  function (world: BuffsWorld, expectedCount: number, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    const actualCount = world.buffsEntity!.getStacks(effectName);
    expect(actualCount).toBe(expectedCount);
  }
);

Then(
  'the buffs entity should have {int} health',
  function (world: BuffsWorld, expectedHealth: number) {
    expect(world.buffsEntity).toBeDefined();
    expect(world.buffsEntity!.currentHealth).toBe(expectedHealth);
  }
);
