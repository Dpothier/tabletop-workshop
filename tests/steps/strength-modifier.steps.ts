import { Given, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { OptionDefinition } from '@src/types/ActionDefinition';
import type { EquipmentSource, SourcedOption } from '@src/types/ModifierSource';

interface StrengthWorld extends QuickPickleWorld {
  attackActionDef?: any;
  actionOptions?: Record<string, OptionDefinition>;
  equipment?: EquipmentSource[];
  sourcedOptions?: SourcedOption[];
}

// ===== Strength YAML assertions =====
// Reuses "When I load the attack action definition from YAML" from quick-strike.steps.ts
// Reuses "Given a main-hand weapon..." and "Given an accessory..." from quick-strike.steps.ts
// Reuses "When I resolve sourced options with condition filtering" from quick-strike.steps.ts

Then(
  'the attack strength option should have modifier damage {int}',
  function (world: StrengthWorld, expectedDamage: number) {
    const strengthOpt = world.attackActionDef?.options?.strength;
    expect(strengthOpt).toBeDefined();
    expect(strengthOpt.modifier).toBeDefined();
    expect(strengthOpt.modifier.damage).toBe(expectedDamage);
  }
);

Then(
  'the attack strength option should have cost red {int}',
  function (world: StrengthWorld, redCost: number) {
    const strengthOpt = world.attackActionDef?.options?.strength;
    expect(strengthOpt).toBeDefined();
    expect(strengthOpt.cost).toBeDefined();
    expect(strengthOpt.cost.red).toBe(redCost);
  }
);

Then(
  'the attack strength option should have alternativeCost windup {int}',
  function (world: StrengthWorld, windupCost: number) {
    const strengthOpt = world.attackActionDef?.options?.strength;
    expect(strengthOpt).toBeDefined();
    expect(strengthOpt.alternativeCost).toBeDefined();
    expect(strengthOpt.alternativeCost.windup).toBe(windupCost);
  }
);

// ===== Strength sourcing setup =====

Given(
  'a strength modifier configured on effect {string} with melee weapon condition',
  function (world: StrengthWorld, modifiesId: string) {
    world.actionOptions = {};
    world.equipment = [];
    world.actionOptions['strength'] = {
      modifies: modifiesId,
      modifier: { damage: 1 },
      condition: { weaponTag: 'melee' },
    } as any;
  }
);

// ===== Strength sourcing assertions =====

Then(
  'I should get {int} sourced strength instance(s)',
  function (world: StrengthWorld, count: number) {
    expect(world.sourcedOptions).toBeDefined();
    const instances = world.sourcedOptions!.filter((opt) => opt.optionId === 'strength');
    expect(instances.length).toBe(count);
  }
);

Then(
  'strength instance {int} should be sourced from {string}',
  function (world: StrengthWorld, _index: number, sourceName: string) {
    expect(world.sourcedOptions).toBeDefined();
    const found = world.sourcedOptions!.some(
      (opt) => opt.optionId === 'strength' && opt.source.sourceName === sourceName
    );
    expect(found).toBe(true);
  }
);
