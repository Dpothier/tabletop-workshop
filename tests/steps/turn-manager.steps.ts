import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import { TurnManager } from '../../src/systems/TurnManager';
import { CharacterToken, MonsterToken } from '../../src/entities/Token';
import { createMockScene } from '../support/mocks';
import type { QuickPickleWorld } from 'quickpickle';
import type { CharacterClass, Monster, Rules } from '../../src/systems/DataLoader';

const mockCharacterClass: CharacterClass = {
  name: 'Test Knight',
  description: 'A test character',
  stats: { health: 20, speed: 3, damage: '1d8+2' },
};

const mockMonster: Monster = {
  name: 'Test Boss',
  description: 'A test monster',
  stats: { health: 100, armor: 3, speed: 2 },
  attacks: { slam: { name: 'Slam', range: 1, damage: '2d6' } },
};

const mockRules: Rules = {
  turn_structure: { phases: ['player', 'monster'] },
  movement: { type: 'grid', difficult_terrain_cost: 2 },
  combat: {
    attack_roll: '1d20',
    damage_reduction: 'armor',
  },
  conditions: {
    Staggered: { name: 'Staggered', effect: 'Cannot act', duration: '1 turn' },
  },
};

Given(
  'a game with {int} characters and {int} monster',
  function (world: QuickPickleWorld, charCount: number, _monsterCount: number) {
    const scene = createMockScene();

    world.characters = [];
    for (let i = 0; i < charCount; i++) {
      const char = new CharacterToken(scene, 0, 0, mockCharacterClass, 0x0000ff, i);
      world.characters.push(char);
    }

    world.monster = new MonsterToken(scene, 0, 0, mockMonster);
    world.turnManager = new TurnManager(world.characters, world.monster, mockRules);
  }
);

Given('the current turn is {int}', function (world: QuickPickleWorld, turn: number) {
  world.turnManager!.currentTurn = turn;
});

Given(
  'character {int} has {int} health',
  function (world: QuickPickleWorld, index: number, health: number) {
    world.characters![index - 1].currentHealth = health;
  }
);

Given('all characters have {int} health', function (world: QuickPickleWorld, health: number) {
  for (const char of world.characters!) {
    char.currentHealth = health;
  }
});

Given('the monster has {int} health', function (world: QuickPickleWorld, health: number) {
  world.monster!.currentHealth = health;
});

When('a turn ends', function (world: QuickPickleWorld) {
  world.turnManager!.nextTurn();
});

When('I get alive characters', function (world: QuickPickleWorld) {
  world.characters = world.turnManager!.getAliveCharacters();
});

When('I check if party is defeated', function (world: QuickPickleWorld) {
  world.result = world.turnManager!.isPartyDefeated() ? 1 : 0;
});

When('I check if monster is defeated', function (world: QuickPickleWorld) {
  world.result = world.turnManager!.isMonsterDefeated() ? 1 : 0;
});

Then('the current turn should be {int}', function (world: QuickPickleWorld, expected: number) {
  expect(world.turnManager!.currentTurn).toBe(expected);
});

Then('I should have {int} alive characters', function (world: QuickPickleWorld, count: number) {
  expect(world.characters).toHaveLength(count);
});

Then('the party should be defeated', function (world: QuickPickleWorld) {
  expect(world.result).toBe(1);
});

Then('the party should not be defeated', function (world: QuickPickleWorld) {
  expect(world.result).toBe(0);
});

Then('the monster should be defeated', function (world: QuickPickleWorld) {
  expect(world.result).toBe(1);
});

Then('the monster should not be defeated', function (world: QuickPickleWorld) {
  expect(world.result).toBe(0);
});
