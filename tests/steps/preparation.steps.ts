import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { PreparationManager, PREPARATION_DEFINITIONS } from '@src/systems/PreparationManager';
import type { PreparationType } from '@src/systems/PreparationManager';

interface PreparationWorld extends QuickPickleWorld {
  prepManager?: PreparationManager;
  pairedActionsMap?: Map<string, Set<string>>;
}

Given('a preparation manager', function (world: PreparationWorld) {
  world.prepManager = new PreparationManager();
  world.pairedActionsMap = new Map();

  // Initialize paired actions mapping
  world.pairedActionsMap.set('windup', new Set(['attack']));
  world.pairedActionsMap.set('aim', new Set(['shoot']));
  world.pairedActionsMap.set('channel', new Set(['cast']));
  world.pairedActionsMap.set('ponder', new Set());
  world.pairedActionsMap.set('rest', new Set());
});

When(
  'entity {string} prepares {string} with {int} stack(s)',
  function (world: PreparationWorld, entityId: string, prepType: string, stacks: number) {
    world.prepManager!.prepare(entityId, prepType as PreparationType, stacks);
  }
);

When(
  'entity {string} preparations are interrupted by {string}',
  function (world: PreparationWorld, entityId: string, interruptType: string) {
    if (interruptType === 'damage' || interruptType === 'defensive_reaction') {
      world.prepManager!.interruptAll(entityId);
    }
  }
);

When(
  'entity {string} performs action {string} which is unrelated to {string}',
  function (world: PreparationWorld, entityId: string, actionId: string, prepType: string) {
    const pairedSet = world.pairedActionsMap!.get(prepType as PreparationType) || new Set();
    if (!pairedSet.has(actionId)) {
      world.prepManager!.interruptByAction(entityId, actionId);
    }
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
    world.prepManager!.consumeStacks(entityId, prepType as PreparationType);
  }
);

Then(
  'entity {string} should have {int} {string} preparation stack(s)',
  function (world: PreparationWorld, entityId: string, expectedStacks: number, prepType: string) {
    const actualStacks = world.prepManager!.getStacks(entityId, prepType as PreparationType);
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
