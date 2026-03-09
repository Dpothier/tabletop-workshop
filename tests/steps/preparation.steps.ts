import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Entity } from '@src/entities/Entity';
import { BattleGrid } from '@src/state/BattleGrid';
import { PREPARATION_DEFINITIONS } from '@src/data/PreparationDefinitions';
import type { PreparationType } from '@src/data/PreparationDefinitions';

interface PreparationWorld extends QuickPickleWorld {
  prepGrid?: BattleGrid;
  prepEntities?: Map<string, Entity>;
}

Given('a preparation manager', function (world: PreparationWorld) {
  world.prepGrid = new BattleGrid(9, 9);
  world.prepEntities = new Map();
});

function getOrCreateEntity(world: PreparationWorld, entityId: string): Entity {
  if (!world.prepEntities!.has(entityId)) {
    const entity = new Entity(entityId, 100, world.prepGrid!);
    world.prepEntities!.set(entityId, entity);
  }
  return world.prepEntities!.get(entityId)!;
}

When(
  'entity {string} prepares {string} with {int} stack(s)',
  function (world: PreparationWorld, entityId: string, prepType: string, stacks: number) {
    const entity = getOrCreateEntity(world, entityId);
    const definition = PREPARATION_DEFINITIONS[prepType as PreparationType];
    const current = entity.getStacks(prepType);
    const newTotal = definition.maxStacks !== null ? Math.min(current + stacks, definition.maxStacks) : current + stacks;
    entity.clearStacks(prepType);
    if (newTotal > 0) {
      entity.addStacks(prepType, newTotal);
    }
  }
);

When(
  'entity {string} preparations are interrupted by {string}',
  function (world: PreparationWorld, entityId: string, interruptType: string) {
    if (interruptType === 'damage' || interruptType === 'defensive_reaction') {
      const entity = getOrCreateEntity(world, entityId);
      Object.keys(PREPARATION_DEFINITIONS).forEach((prepType: string) => {
        entity.clearStacks(prepType);
      });
    }
  }
);

When(
  'entity {string} performs action {string} which is unrelated to {string}',
  function (world: PreparationWorld, entityId: string, actionId: string, _prepType: string) {
    const entity = getOrCreateEntity(world, entityId);
    // interruptByAction: clear all preps that don't have actionId in pairedActions
    Object.entries(PREPARATION_DEFINITIONS).forEach(([prepType, definition]) => {
      if (!definition.pairedActions.includes(actionId)) {
        entity.clearStacks(prepType);
      }
    });
  }
);

When(
  'entity {string} performs action {string} which is paired with {string}',
  function (_world: PreparationWorld, _entityId: string, _actionId: string, _prepType: string) {
    // Paired actions do NOT interrupt, so we don't call interruptByAction
  }
);

When(
  'entity {string} consumes {string} preparation',
  function (world: PreparationWorld, entityId: string, prepType: string) {
    const entity = getOrCreateEntity(world, entityId);
    entity.clearStacks(prepType as PreparationType);
  }
);

Then(
  'entity {string} should have {int} {string} preparation stack(s)',
  function (world: PreparationWorld, entityId: string, expectedStacks: number, prepType: string) {
    const entity = getOrCreateEntity(world, entityId);
    const actualStacks = entity.getStacks(prepType as PreparationType);
    expect(actualStacks).toBe(expectedStacks);
  }
);

Then(
  'the {string} preparation should cost {int} wheel segment(s)',
  function (_world: PreparationWorld, prepType: string, expectedCost: number) {
    const definition = PREPARATION_DEFINITIONS[prepType as PreparationType];
    expect(definition).toBeDefined();
    expect(definition.wheelCost).toBe(expectedCost);
  }
);

Then(
  'the {string} preparation should be paired with {string}',
  function (_world: PreparationWorld, prepType: string, actionId: string) {
    const definition = PREPARATION_DEFINITIONS[prepType as PreparationType];
    expect(definition).toBeDefined();
    expect(definition.pairedActions).toContain(actionId);
  }
);
