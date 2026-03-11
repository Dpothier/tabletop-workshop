import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import type { EffectResult, GameContext } from '@src/types/Effect';
import type { PreparationType } from '@src/data/PreparationDefinitions';

interface PrepareEffectWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  entities?: Map<string, Entity>;
  gameContext?: GameContext;
  prepareEffectResult?: EffectResult;
}

// Execute PrepareEffect with type and stacks
When(
  'I execute PrepareEffect with type {string} and {int} stacks to add',
  async function (world: PrepareEffectWorld, prepType: string, stacksToAdd: number) {
    const { PrepareEffect } = await import('@src/effects/PrepareEffect');
    const effect = new PrepareEffect();

    const result = effect.execute(
      world.gameContext!,
      { prepType: prepType as PreparationType, stacksToAdd },
      {},
      new Map()
    );
    world.prepareEffectResult = result instanceof Promise ? await result : result;
  }
);

// Execute PrepareEffect when actor is not found
When(
  'I execute PrepareEffect with type {string} and {int} stacks to add but no actor',
  async function (world: PrepareEffectWorld, prepType: string, stacksToAdd: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.entities) {
      world.entities = new Map();
    }

    const contextWithoutActor: GameContext = {
      grid: world.grid,
      actorId: undefined,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: () => undefined,
    };

    const { PrepareEffect } = await import('@src/effects/PrepareEffect');
    const effect = new PrepareEffect();

    const result = effect.execute(
      contextWithoutActor,
      { prepType: prepType as PreparationType, stacksToAdd },
      {},
      new Map()
    );
    world.prepareEffectResult = result instanceof Promise ? await result : result;
  }
);

// Result assertions
Then('the prepare effect result should be successful', function (world: PrepareEffectWorld) {
  expect(world.prepareEffectResult).toBeDefined();
  expect(world.prepareEffectResult!.success).toBe(true);
});

Then('the prepare effect result should fail', function (world: PrepareEffectWorld) {
  expect(world.prepareEffectResult).toBeDefined();
  expect(world.prepareEffectResult!.success).toBe(false);
});

Then(
  'the prepare effect reason should be {string}',
  function (world: PrepareEffectWorld, expectedReason: string) {
    expect(world.prepareEffectResult).toBeDefined();
    expect(world.prepareEffectResult!.reason).toBe(expectedReason);
  }
);

// Data assertions
Then(
  'the prepare effect result data should have {string} = {string}',
  function (world: PrepareEffectWorld, key: string, value: string) {
    expect(world.prepareEffectResult).toBeDefined();
    expect(world.prepareEffectResult!.data[key]).toBe(value);
  }
);

Then(
  'the prepare effect result data should have {string} = {int}',
  function (world: PrepareEffectWorld, key: string, value: number) {
    expect(world.prepareEffectResult).toBeDefined();
    expect(world.prepareEffectResult!.data[key]).toBe(value);
  }
);

// Animation events assertion
Then(
  'the prepare effect result should have {int} animation events',
  function (world: PrepareEffectWorld, expectedCount: number) {
    expect(world.prepareEffectResult).toBeDefined();
    expect(world.prepareEffectResult!.events).toHaveLength(expectedCount);
  }
);

// Entity stacks assertions for prepare effect
Then(
  'the entity {string} should have {int} stacks of {string}',
  function (
    world: PrepareEffectWorld,
    entityId: string,
    expectedStacks: number,
    stackType: string
  ) {
    const entity = world.entities!.get(entityId);
    expect(entity).toBeDefined();
    expect(entity!.getStacks(stackType)).toBe(expectedStacks);
  }
);

// Set up entity with initial stacks for prepare effect
Given(
  'the entity {string} has {int} stacks of {string}',
  function (world: PrepareEffectWorld, entityId: string, stackCount: number, stackType: string) {
    const entity = world.entities!.get(entityId);
    expect(entity).toBeDefined();
    entity!.clearStacks(stackType);
    if (stackCount > 0) {
      entity!.addStacks(stackType, stackCount);
    }
  }
);
