import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { CombatResolver } from '@src/systems/CombatResolver';
import { DiceRoller } from '@src/systems/DiceRoller';

interface Position {
  x: number;
  y: number;
}

interface CombatResolverWorld extends QuickPickleWorld {
  combatResolver?: CombatResolver;
  calculatedDamage?: number;
  distance?: number;
  attackerPosition?: Position;
  targetPosition?: Position;
  inRange?: boolean;
}

Given('a combat resolver', function (world: CombatResolverWorld) {
  const diceRoller = new DiceRoller();
  world.combatResolver = new CombatResolver(diceRoller);
});

When(
  'calculating damage of {int} against {int} armor',
  function (world: CombatResolverWorld, damage: number, armor: number) {
    world.calculatedDamage = world.combatResolver!.calculateDamage(damage, armor);
  }
);

Then(
  'the calculated damage should be {int}',
  function (world: CombatResolverWorld, expected: number) {
    expect(world.calculatedDamage).toBe(expected);
  }
);

When(
  'calculating distance from {int},{int} to {int},{int}',
  function (world: CombatResolverWorld, x1: number, y1: number, x2: number, y2: number) {
    world.distance = world.combatResolver!.getDistance(x1, y1, x2, y2);
  }
);

Then('the distance should be {int}', function (world: CombatResolverWorld, expected: number) {
  expect(world.distance).toBe(expected);
});

Given(
  'an attacker at position {int},{int}',
  function (world: CombatResolverWorld, x: number, y: number) {
    world.attackerPosition = { x, y };
  }
);

Given(
  'a target at position {int},{int}',
  function (world: CombatResolverWorld, x: number, y: number) {
    world.targetPosition = { x, y };
  }
);

When('checking if target is in range {int}', function (world: CombatResolverWorld, range: number) {
  world.inRange = world.combatResolver!.isInRange(
    world.attackerPosition!.x,
    world.attackerPosition!.y,
    world.targetPosition!.x,
    world.targetPosition!.y,
    range
  );
});

Then('the target should be in range', function (world: CombatResolverWorld) {
  expect(world.inRange).toBe(true);
});

Then('the target should not be in range', function (world: CombatResolverWorld) {
  expect(world.inRange).toBe(false);
});
