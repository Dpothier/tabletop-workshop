import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { DefenseStats, AttackModifier, CombatResult } from '@src/types/Combat';
import { resolveUnifiedAttack } from '@src/combat/UnifiedAttackResolver';
import type { UnifiedAttackInput, WeaponModifier } from '@src/combat/UnifiedAttackResolver';

interface UnifiedAttackWorld extends QuickPickleWorld {
  unifiedWeaponPower?: number;
  unifiedWeaponAgility?: number;
  unifiedDefense?: DefenseStats;
  unifiedWindupStacks?: number;
  unifiedModifiers?: AttackModifier[];
  unifiedWeaponModifier?: WeaponModifier;
  unifiedResult?: CombatResult;
}

// Given steps for weapon stats

Given(
  'a unified weapon with power {int} and agility {int}',
  function (world: UnifiedAttackWorld, power: number, agility: number) {
    world.unifiedWeaponPower = power;
    world.unifiedWeaponAgility = agility;
  }
);

// Given steps for defense stats

Given(
  'a unified attack target with armor {int}, guard {int}, and evasion {int}',
  function (world: UnifiedAttackWorld, armor: number, guard: number, evasion: number) {
    world.unifiedDefense = { armor, guard, evasion };
  }
);

// Given steps for preparation

Given(
  '{int} unified windup stack(s)',
  function (world: UnifiedAttackWorld, stacks: number) {
    world.unifiedWindupStacks = stacks;
  }
);

// Given steps for weapon modifiers

Given(
  'a unified weapon modifier with power bonus {int} and agility bonus {int} and modifiers {string}',
  function (world: UnifiedAttackWorld, powerBonus: number, agilityBonus: number, modifiersStr: string) {
    const attackModifiers: AttackModifier[] = modifiersStr
      ? modifiersStr.split(',').map(m => m.trim()).filter(m => m.length > 0) as AttackModifier[]
      : [];
    world.unifiedWeaponModifier = {
      id: 'test-modifier',
      name: 'Test Modifier',
      powerBonus,
      agilityBonus,
      attackModifiers,
    };
  }
);

// When steps for resolving unified attacks

When(
  'I resolve a unified attack with no modifiers',
  function (world: UnifiedAttackWorld) {
    expect(world.unifiedWeaponPower).toBeDefined();
    expect(world.unifiedWeaponAgility).toBeDefined();
    expect(world.unifiedDefense).toBeDefined();

    const input: UnifiedAttackInput = {
      weaponPower: world.unifiedWeaponPower!,
      weaponAgility: world.unifiedWeaponAgility!,
      windupStacks: world.unifiedWindupStacks ?? 0,
      modifiers: [],
    };
    world.unifiedResult = resolveUnifiedAttack(input, world.unifiedDefense!);
  }
);

When(
  'I resolve a unified attack with modifier {string}',
  function (world: UnifiedAttackWorld, modifier: string) {
    expect(world.unifiedWeaponPower).toBeDefined();
    expect(world.unifiedWeaponAgility).toBeDefined();
    expect(world.unifiedDefense).toBeDefined();

    const input: UnifiedAttackInput = {
      weaponPower: world.unifiedWeaponPower!,
      weaponAgility: world.unifiedWeaponAgility!,
      windupStacks: world.unifiedWindupStacks ?? 0,
      modifiers: [modifier as AttackModifier],
    };
    world.unifiedResult = resolveUnifiedAttack(input, world.unifiedDefense!);
  }
);

When(
  'I resolve a unified attack with weapon modifier',
  function (world: UnifiedAttackWorld) {
    expect(world.unifiedWeaponPower).toBeDefined();
    expect(world.unifiedWeaponAgility).toBeDefined();
    expect(world.unifiedDefense).toBeDefined();
    expect(world.unifiedWeaponModifier).toBeDefined();

    const input: UnifiedAttackInput = {
      weaponPower: world.unifiedWeaponPower!,
      weaponAgility: world.unifiedWeaponAgility!,
      windupStacks: world.unifiedWindupStacks ?? 0,
      modifiers: [],
      weaponModifier: world.unifiedWeaponModifier,
    };
    world.unifiedResult = resolveUnifiedAttack(input, world.unifiedDefense!);
  }
);

// Then steps for unified attack outcomes

Then(
  'the unified attack outcome should be {string}',
  function (world: UnifiedAttackWorld, expectedOutcome: string) {
    expect(world.unifiedResult).toBeDefined();
    expect(world.unifiedResult!.outcome).toBe(expectedOutcome);
  }
);

Then(
  'the unified attack damage should be {int}',
  function (world: UnifiedAttackWorld, expectedDamage: number) {
    expect(world.unifiedResult).toBeDefined();
    expect(world.unifiedResult!.damage).toBe(expectedDamage);
  }
);
