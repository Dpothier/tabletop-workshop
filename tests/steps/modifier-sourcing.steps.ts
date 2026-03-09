import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { OptionDefinition } from '@src/types/ActionDefinition';
import type { EquipmentSource, SourcedOption } from '@src/types/ModifierSource';
import { resolveSourcedOptions } from '@src/systems/ModifierSourcing';

interface ModifierSourcingWorld extends QuickPickleWorld {
  actionOptions?: Record<string, OptionDefinition>;
  equipment?: EquipmentSource[];
  sourcedOptions?: SourcedOption[];
}

// ===== Given Steps =====

Given(
  'an action with option {string} that modifies {string} with damage +{int}',
  function (world: ModifierSourcingWorld, optionId: string, modifiesId: string, damageBoost: number) {
    if (!world.actionOptions) {
      world.actionOptions = {};
    }

    world.actionOptions[optionId] = {
      modifies: modifiesId,
      modifier: {
        damage: damageBoost,
      },
    };
  }
);

Given(
  'an action with option {string} that modifies {string} with damage +{int} costing {int} red bead',
  function (
    world: ModifierSourcingWorld,
    optionId: string,
    modifiesId: string,
    damageBoost: number,
    redCost: number
  ) {
    if (!world.actionOptions) {
      world.actionOptions = {};
    }

    world.actionOptions[optionId] = {
      modifies: modifiesId,
      modifier: {
        damage: damageBoost,
      },
    };

    // Store the cost info on the option for later verification
    (world.actionOptions[optionId] as any).cost = {
      red: redCost,
    };
  }
);

Given(
  'a main-hand weapon {string} that grants modifier {string}',
  function (world: ModifierSourcingWorld, weaponName: string, modifierId: string) {
    if (!world.equipment) {
      world.equipment = [];
    }

    const equipment: EquipmentSource = {
      id: `weapon-${weaponName.toLowerCase().replace(/\s+/g, '-')}`,
      name: weaponName,
      type: 'weapon',
      slot: 'main-hand',
      grantedModifiers: [modifierId],
    };

    world.equipment.push(equipment);
  }
);

Given(
  'an off-hand weapon {string} that grants modifier {string}',
  function (world: ModifierSourcingWorld, weaponName: string, modifierId: string) {
    if (!world.equipment) {
      world.equipment = [];
    }

    const equipment: EquipmentSource = {
      id: `weapon-${weaponName.toLowerCase().replace(/\s+/g, '-')}`,
      name: weaponName,
      type: 'weapon',
      slot: 'off-hand',
      grantedModifiers: [modifierId],
    };

    world.equipment.push(equipment);
  }
);

Given(
  'an accessory {string} that grants modifier {string}',
  function (world: ModifierSourcingWorld, accessoryName: string, modifierId: string) {
    if (!world.equipment) {
      world.equipment = [];
    }

    const equipment: EquipmentSource = {
      id: `accessory-${accessoryName.toLowerCase().replace(/\s+/g, '-')}`,
      name: accessoryName,
      type: 'item',
      slot: 'accessory',
      grantedModifiers: [modifierId],
    };

    world.equipment.push(equipment);
  }
);

// ===== When Steps =====

When('I resolve sourced options', function (world: ModifierSourcingWorld) {
  if (!world.actionOptions) {
    world.actionOptions = {};
  }

  if (!world.equipment) {
    world.equipment = [];
  }

  world.sourcedOptions = resolveSourcedOptions(world.actionOptions, world.equipment);
});

// ===== Then Steps =====

Then('I should get exactly {int} instance of {string}', function (
  world: ModifierSourcingWorld,
  expectedCount: number,
  optionId: string
) {
  expect(world.sourcedOptions).toBeDefined();

  const instances = world.sourcedOptions!.filter((so) => so.optionId === optionId);
  expect(instances).toHaveLength(expectedCount);
});

Then('I should get {int} instances of {string}', function (
  world: ModifierSourcingWorld,
  expectedCount: number,
  optionId: string
) {
  expect(world.sourcedOptions).toBeDefined();

  const instances = world.sourcedOptions!.filter((so) => so.optionId === optionId);
  expect(instances).toHaveLength(expectedCount);
});

Then('one instance should be sourced from {string}', function (
  world: ModifierSourcingWorld,
  sourceName: string
) {
  expect(world.sourcedOptions).toBeDefined();

  const instance = world.sourcedOptions!.find((so) => so.source.sourceName === sourceName);
  expect(instance).toBeDefined();
  expect(instance!.source.sourceName).toBe(sourceName);
});

Then('that instance should be sourced from {string}', function (
  world: ModifierSourcingWorld,
  sourceName: string
) {
  expect(world.sourcedOptions).toBeDefined();
  expect(world.sourcedOptions).toHaveLength(1);

  const instance = world.sourcedOptions![0];
  expect(instance.source.sourceName).toBe(sourceName);
});

Then('the display label should be {string}', function (
  world: ModifierSourcingWorld,
  expectedLabel: string
) {
  expect(world.sourcedOptions).toBeDefined();
  expect(world.sourcedOptions).toHaveLength(1);

  const instance = world.sourcedOptions![0];
  expect(instance.displayLabel).toBe(expectedLabel);
});

Then('each instance should have the original option cost', function (world: ModifierSourcingWorld) {
  expect(world.sourcedOptions).toBeDefined();
  expect(world.sourcedOptions!.length).toBeGreaterThan(0);

  // All instances should have the same cost from the original option definition
  const firstCost = (world.sourcedOptions![0].option as any).cost;

  for (const instance of world.sourcedOptions!) {
    const instanceCost = (instance.option as any).cost;
    expect(instanceCost).toEqual(firstCost);
  }
});
