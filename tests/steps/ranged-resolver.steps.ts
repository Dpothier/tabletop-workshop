import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { RangedWeaponDefinition } from '@src/types/RangedWeaponDefinition';
import type { ShootInput, RangedDefenseStats, RangedCombatResult } from '@src/combat/RangedResolver';
import { resolveRangedAttack } from '@src/combat/RangedResolver';

interface RangedResolverWorld extends QuickPickleWorld {
  weapon?: RangedWeaponDefinition;
  aimStacks?: number;
  range?: number;
  defense?: RangedDefenseStats;
  rangedResult?: RangedCombatResult;
}

// Given steps for weapon setup

Given(
  'a ranged weapon {string} with penetration {int}',
  function (world: RangedResolverWorld, name: string, penetration: number) {
    world.weapon = {
      id: name.toLowerCase(),
      name,
      penetration,
      rangeBands: {
        short: { min: 1, max: 6, modifier: 0 },
        medium: { min: 7, max: 12, modifier: 0 },
        long: { min: 13, max: Infinity, modifier: 0 },
      },
    };
  }
);

Given(
  'the ranged weapon has short range {int}-{int} with modifier {int}',
  function (world: RangedResolverWorld, min: number, max: number, modifier: number) {
    expect(world.weapon).toBeDefined();
    world.weapon!.rangeBands.short = { min, max, modifier };
  }
);

Given(
  'the ranged weapon has medium range {int}-{int} with modifier {int}',
  function (world: RangedResolverWorld, min: number, max: number, modifier: number) {
    expect(world.weapon).toBeDefined();
    world.weapon!.rangeBands.medium = { min, max, modifier };
  }
);

Given(
  'the ranged weapon has long range {int}+ with modifier {int}',
  function (world: RangedResolverWorld, min: number, modifier: number) {
    expect(world.weapon).toBeDefined();
    world.weapon!.rangeBands.long = { min, max: Infinity, modifier };
  }
);

// Given steps for aim stacks

Given('{int} aim stacks', function (world: RangedResolverWorld, stacks: number) {
  world.aimStacks = stacks;
});

Given('no aim stacks', function (world: RangedResolverWorld) {
  world.aimStacks = 0;
});

// Given steps for target range

Given('a target at range {int}', function (world: RangedResolverWorld, range: number) {
  world.range = range;
});

// Given steps for defense stats

Given(
  'the target has cover {int}, guard {int}, armor {int}',
  function (world: RangedResolverWorld, cover: number, guard: number, armor: number) {
    world.defense = { cover, guard, armor };
  }
);

// When steps for resolving attacks

When('I resolve the ranged attack', function (world: RangedResolverWorld) {
  expect(world.weapon).toBeDefined();
  expect(world.aimStacks).toBeDefined();
  expect(world.range).toBeDefined();
  expect(world.defense).toBeDefined();

  const input: ShootInput = {
    weapon: world.weapon!,
    aimStacks: world.aimStacks!,
    range: world.range!,
  };

  world.rangedResult = resolveRangedAttack(input, world.defense!);
});

// Then steps for ranged combat outcome

Then(
  'the ranged outcome should be {string}',
  function (world: RangedResolverWorld, expectedOutcome: string) {
    expect(world.rangedResult).toBeDefined();
    expect(world.rangedResult!.outcome).toBe(expectedOutcome);
  }
);

Then(
  'the ranged damage should be {int}',
  function (world: RangedResolverWorld, expectedDamage: number) {
    expect(world.rangedResult).toBeDefined();
    expect(world.rangedResult!.damage).toBe(expectedDamage);
  }
);

Then(
  'the ranged precision should be {int}',
  function (world: RangedResolverWorld, expectedPrecision: number) {
    expect(world.rangedResult).toBeDefined();
    expect(world.rangedResult!.precision).toBe(expectedPrecision);
  }
);

Then(
  'the ranged difficulty should be {int}',
  function (world: RangedResolverWorld, expectedDifficulty: number) {
    expect(world.rangedResult).toBeDefined();
    expect(world.rangedResult!.difficulty).toBe(expectedDifficulty);
  }
);

Then(
  'the range band should be {string}',
  function (world: RangedResolverWorld, expectedBand: string) {
    expect(world.rangedResult).toBeDefined();
    expect(world.rangedResult!.rangeBand).toBe(expectedBand);
  }
);
