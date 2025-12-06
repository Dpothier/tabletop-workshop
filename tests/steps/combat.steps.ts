import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { Monster, MonsterAttack } from '../../src/systems/DataLoader';

interface CombatWorld extends QuickPickleWorld {
  rawDamage?: number;
  armor?: number;
  finalDamage?: number;
  combatMonster?: Monster;
  selectedAttack?: MonsterAttack;
  characterPositions?: { x: number; y: number }[];
  monsterPosition?: { x: number; y: number };
  targetIndex?: number;
}

Given('an attacker deals {int} damage', function (world: CombatWorld, damage: number) {
  world.rawDamage = damage;
});

Given('the target has {int} armor', function (world: CombatWorld, armor: number) {
  world.armor = armor;
});

When('damage is calculated', function (world: CombatWorld) {
  world.finalDamage = Math.max(0, world.rawDamage! - world.armor!);
});

Then('the final damage should be {int}', function (world: CombatWorld, expected: number) {
  expect(world.finalDamage).toBe(expected);
});

Given('a monster with multiple attacks', function (world: CombatWorld) {
  world.combatMonster = {
    name: 'Test Boss',
    stats: { health: 100 },
    attacks: {
      slam: { name: 'Slam', damage: '2d6', range: 1 },
      stomp: { name: 'Stomp', damage: '3d4', range: 1 },
      roar: { name: 'Roar', damage: '1d8', range: 3 },
    },
  };
});

When('the monster selects an attack', function (world: CombatWorld) {
  const attackKeys = Object.keys(world.combatMonster!.attacks);
  const randomKey = attackKeys[Math.floor(Math.random() * attackKeys.length)];
  world.selectedAttack = world.combatMonster!.attacks[randomKey];
});

Then("the attack should be one of the monster's attacks", function (world: CombatWorld) {
  const validAttacks = Object.values(world.combatMonster!.attacks).map((a) => a.name);
  expect(validAttacks).toContain(world.selectedAttack!.name);
});

Given(
  'characters at positions:',
  function (world: CombatWorld, dataTable: { rawTable: string[][] }) {
    world.characterPositions = [];
    // Skip header row
    for (let i = 1; i < dataTable.rawTable.length; i++) {
      const row = dataTable.rawTable[i];
      world.characterPositions.push({
        x: parseInt(row[0]),
        y: parseInt(row[1]),
      });
    }
  }
);

Given('a monster at position {int},{int}', function (world: CombatWorld, x: number, y: number) {
  world.monsterPosition = { x, y };
});

When('the monster finds the closest target', function (world: CombatWorld) {
  let minDistance = Infinity;
  world.targetIndex = 0;

  for (let i = 0; i < world.characterPositions!.length; i++) {
    const pos = world.characterPositions![i];
    const distance =
      Math.abs(pos.x - world.monsterPosition!.x) + Math.abs(pos.y - world.monsterPosition!.y);
    if (distance < minDistance) {
      minDistance = distance;
      world.targetIndex = i;
    }
  }
});

Then(
  'the target should be the character at {int},{int}',
  function (world: CombatWorld, x: number, y: number) {
    const target = world.characterPositions![world.targetIndex!];
    expect(target.x).toBe(x);
    expect(target.y).toBe(y);
  }
);
