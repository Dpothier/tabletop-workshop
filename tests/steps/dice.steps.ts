import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import { DiceRoller } from '@src/systems/DiceRoller';
import type { QuickPickleWorld } from 'quickpickle';

Given('a dice roller is initialized', function (world: QuickPickleWorld) {
  world.diceRoller = new DiceRoller();
});

When('I roll {string}', function (world: QuickPickleWorld, notation: string) {
  world.result = world.diceRoller!.roll(notation);
});

When('I roll detailed {string}', function (world: QuickPickleWorld, notation: string) {
  const detailed = world.diceRoller!.rollDetailed(notation);
  world.result = detailed.total;
  world.rolls = detailed.rolls;
});

Then(
  'the result should be between {int} and {int}',
  function (world: QuickPickleWorld, min: number, max: number) {
    expect(world.result).toBeGreaterThanOrEqual(min);
    expect(world.result).toBeLessThanOrEqual(max);
  }
);

Then('the result should be exactly {int}', function (world: QuickPickleWorld, expected: number) {
  expect(world.result).toBe(expected);
});

Then(
  'I should get {int} individual dice results',
  function (world: QuickPickleWorld, count: number) {
    expect(world.rolls).toHaveLength(count);
  }
);

Then(
  'each die should be between {int} and {int}',
  function (world: QuickPickleWorld, min: number, max: number) {
    for (const roll of world.rolls!) {
      expect(roll).toBeGreaterThanOrEqual(min);
      expect(roll).toBeLessThanOrEqual(max);
    }
  }
);
