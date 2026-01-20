import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { AttackStats, DefenseStats, AttackModifier, CombatResult } from '@src/types/Combat';
import { resolveAttack } from '@src/combat/CombatResolver';

interface CombatResolverWorld extends QuickPickleWorld {
  attack?: AttackStats;
  defense?: DefenseStats;
  modifiers?: AttackModifier[];
  combatResult?: CombatResult;
}

// Given steps for attack stats

Given(
  'an attack with power {int} and agility {int}',
  function (world: CombatResolverWorld, power: number, agility: number) {
    world.attack = { power, agility };
  }
);

// Given steps for defense stats

Given(
  'a defense with armor {int}, guard {int}, and evasion {int}',
  function (world: CombatResolverWorld, armor: number, guard: number, evasion: number) {
    world.defense = { armor, guard, evasion };
  }
);

// When steps for resolving attacks

When('I resolve the attack with no modifiers', function (world: CombatResolverWorld) {
  expect(world.attack).toBeDefined();
  expect(world.defense).toBeDefined();

  world.combatResult = resolveAttack(world.attack!, world.defense!, []);
});

When(
  'I resolve the attack with modifier {string}',
  function (world: CombatResolverWorld, modifier: string) {
    expect(world.attack).toBeDefined();
    expect(world.defense).toBeDefined();

    const modifiers: AttackModifier[] = [modifier as AttackModifier];
    world.combatResult = resolveAttack(world.attack!, world.defense!, modifiers);
  }
);

When(
  'I resolve the attack with modifiers {string} and {string}',
  function (world: CombatResolverWorld, mod1: string, mod2: string) {
    expect(world.attack).toBeDefined();
    expect(world.defense).toBeDefined();

    const modifiers: AttackModifier[] = [mod1 as AttackModifier, mod2 as AttackModifier];
    world.combatResult = resolveAttack(world.attack!, world.defense!, modifiers);
  }
);

When(
  'I resolve the attack with modifiers {string}, {string}, and {string}',
  function (world: CombatResolverWorld, mod1: string, mod2: string, mod3: string) {
    expect(world.attack).toBeDefined();
    expect(world.defense).toBeDefined();

    const modifiers: AttackModifier[] = [
      mod1 as AttackModifier,
      mod2 as AttackModifier,
      mod3 as AttackModifier,
    ];
    world.combatResult = resolveAttack(world.attack!, world.defense!, modifiers);
  }
);

// Then steps for combat outcome

Then(
  'the outcome should be {string}',
  function (world: CombatResolverWorld, expectedOutcome: string) {
    expect(world.combatResult).toBeDefined();
    expect(world.combatResult!.outcome).toBe(expectedOutcome);
  }
);

Then('the damage should be {int}', function (world: CombatResolverWorld, expectedDamage: number) {
  expect(world.combatResult).toBeDefined();
  expect(world.combatResult!.damage).toBe(expectedDamage);
});

Then('canReact should be true', function (world: CombatResolverWorld) {
  expect(world.combatResult).toBeDefined();
  expect(world.combatResult!.canReact).toBe(true);
});

Then('canReact should be false', function (world: CombatResolverWorld) {
  expect(world.combatResult).toBeDefined();
  expect(world.combatResult!.canReact).toBe(false);
});
