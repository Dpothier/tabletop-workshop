import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import { CharacterToken, MonsterToken } from '../../src/entities/Token';
import { createMockScene } from '../support/mocks';
import type { QuickPickleWorld } from 'quickpickle';
import type { CharacterClass, Monster } from '../../src/systems/DataLoader';

interface TokenWorld extends QuickPickleWorld {
  characterToken?: CharacterToken;
  monsterToken?: MonsterToken;
}

const mockCharacterClass: CharacterClass = {
  name: 'Test Knight',
  description: 'A test character',
  stats: { health: 20, speed: 3, damage: '1d8+2' },
};

const createMockMonster = (health: number): Monster => ({
  name: 'Test Boss',
  description: 'A test monster',
  stats: { health, armor: 3, speed: 2 },
  attacks: { slam: { name: 'Slam', range: 1, damage: '2d6' } },
});

Given('a character token with {int} max health', function (world: TokenWorld, maxHealth: number) {
  const scene = createMockScene();
  const charClass = {
    ...mockCharacterClass,
    stats: { ...mockCharacterClass.stats, health: maxHealth },
  };
  world.characterToken = new CharacterToken(scene, 0, 0, charClass, 0x0000ff, 0);
});

Given('the token has taken {int} damage', function (world: TokenWorld, damage: number) {
  world.characterToken!.takeDamage(damage);
});

Given('a monster token with {int} max health', function (world: TokenWorld, maxHealth: number) {
  const scene = createMockScene();
  world.monsterToken = new MonsterToken(scene, 0, 0, createMockMonster(maxHealth));
});

When('the token takes {int} damage', function (world: TokenWorld, damage: number) {
  world.characterToken!.takeDamage(damage);
});

When('the token heals for {int}', function (world: TokenWorld, amount: number) {
  world.characterToken!.heal(amount);
});

When('the monster takes {int} damage', function (world: TokenWorld, damage: number) {
  world.monsterToken!.takeDamage(damage);
});

Then('the token should have {int} health', function (world: TokenWorld, expected: number) {
  expect(world.characterToken!.currentHealth).toBe(expected);
});

Then('the monster should have {int} health', function (world: TokenWorld, expected: number) {
  expect(world.monsterToken!.currentHealth).toBe(expected);
});
