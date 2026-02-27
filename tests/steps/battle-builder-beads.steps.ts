import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleBuilder } from '@src/builders/BattleBuilder';
import { Character } from '@src/entities/Character';
import type { CharacterData } from '@src/types/CharacterData';
import type { Monster, Arena, CharacterClass } from '@src/systems/DataLoader';
import type { BattleState } from '@src/state/BattleState';

interface BattleBuilderBeadsWorld extends QuickPickleWorld {
  testMonster?: Monster;
  testArena?: Arena;
  testClass?: CharacterClass;
  characterDataList?: CharacterData[];
  battleState?: BattleState;
  characters?: Character[];
  characterMap?: Map<string, Character>;
}

function createMinimalTestMonster(): Monster {
  return {
    name: 'TestBoss',
    stats: { health: 50 },
  } as any;
}

function createMinimalTestArena(): Arena {
  return {
    name: 'TestArena',
    width: 9,
    height: 9,
    playerSpawns: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    monsterSpawn: { x: 5, y: 4 },
  } as any;
}

function createMinimalTestClass(): CharacterClass {
  return {
    name: 'Warrior',
    stats: { health: 10 },
  } as any;
}

function createCharacterData(
  name: string,
  str: number,
  dex: number,
  mnd: number,
  spr: number
): CharacterData {
  return {
    id: name.toLowerCase(),
    name,
    attributes: { str, dex, mnd, spr },
    weapon: 'sword',
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Background: Load test data

Given('battle test data is loaded', function (world: BattleBuilderBeadsWorld) {
  world.testMonster = createMinimalTestMonster();
  world.testArena = createMinimalTestArena();
  world.testClass = createMinimalTestClass();
  world.characterDataList = [];
});

// Build character data

Given(
  'character data with name {string} and attributes STR={int}, DEX={int}, MND={int}, SPR={int}',
  function (
    world: BattleBuilderBeadsWorld,
    name: string,
    str: number,
    dex: number,
    mnd: number,
    spr: number
  ) {
    if (!world.characterDataList) {
      world.characterDataList = [];
    }
    world.characterDataList.push(createCharacterData(name, str, dex, mnd, spr));
  }
);

// Build battle with character data

When(
  'the battle builder creates a battle with custom character data',
  function (world: BattleBuilderBeadsWorld) {
    const builder = new BattleBuilder();
    builder.withMonster(world.testMonster!);
    builder.withArena(world.testArena!);
    builder.withClasses([world.testClass!]);
    builder.withActions([]);
    builder.withCharacterData(world.characterDataList!);

    world.battleState = builder.build();
    world.characters = world.battleState.characters;

    // Build character map by name for easier lookup
    world.characterMap = new Map();
    for (const char of world.characters) {
      world.characterMap.set(char.getName(), char);
    }
  }
);

When(
  'the battle builder creates a battle without character data',
  function (world: BattleBuilderBeadsWorld) {
    const builder = new BattleBuilder();
    builder.withMonster(world.testMonster!);
    builder.withArena(world.testArena!);
    builder.withClasses([world.testClass!]);
    builder.withActions([]);
    builder.withPartySize(4);

    world.battleState = builder.build();
    world.characters = world.battleState.characters;

    world.characterMap = new Map();
    for (const char of world.characters) {
      world.characterMap.set(char.id, char);
    }
  }
);

When(
  'the battle builder creates a battle with {int} custom characters',
  function (world: BattleBuilderBeadsWorld, _count: number) {
    const builder = new BattleBuilder();
    builder.withMonster(world.testMonster!);
    builder.withArena(world.testArena!);
    builder.withClasses([world.testClass!]);
    builder.withActions([]);
    builder.withCharacterData(world.characterDataList!);

    world.battleState = builder.build();
    world.characters = world.battleState.characters;

    // Build character map by name
    world.characterMap = new Map();
    for (const char of world.characters) {
      world.characterMap.set(char.getName(), char);
    }
  }
);

// Character name assertions

Then('the character entity should have name {string}', function (world: BattleBuilderBeadsWorld, name: string) {
  expect(world.characters).toBeDefined();
  expect(world.characters!.length).toBeGreaterThan(0);
  expect(world.characters![0].getName()).toBe(name);
});

Then(
  'character {string} entity should exist with name {string}',
  function (world: BattleBuilderBeadsWorld, _lookupName: string, expectedName: string) {
    expect(world.characterMap).toBeDefined();
    expect(world.characterMap!.has(expectedName)).toBe(true);
    expect(world.characterMap!.get(expectedName)!.getName()).toBe(expectedName);
  }
);

// Character attributes assertions

Then(
  'the character attributes should be STR={int}, DEX={int}, MND={int}, SPR={int}',
  function (
    world: BattleBuilderBeadsWorld,
    str: number,
    dex: number,
    mnd: number,
    spr: number
  ) {
    expect(world.characters).toBeDefined();
    expect(world.characters!.length).toBeGreaterThan(0);

    const attrs = world.characters![0].getAttributes();
    expect(attrs).toBeDefined();
    expect(attrs!.str).toBe(str);
    expect(attrs!.dex).toBe(dex);
    expect(attrs!.mnd).toBe(mnd);
    expect(attrs!.spr).toBe(spr);
  }
);

// Hand assertions

Then('the character hand should have {int} beads', function (world: BattleBuilderBeadsWorld, count: number) {
  expect(world.characters).toBeDefined();
  expect(world.characters!.length).toBeGreaterThan(0);

  const beadHand = world.characters![0].getBeadHand();
  expect(beadHand).toBeDefined();
  expect(beadHand!.getHandTotal()).toBe(count);
});

Then('each character hand should have {int} beads', function (world: BattleBuilderBeadsWorld, count: number) {
  expect(world.characters).toBeDefined();
  expect(world.characters!.length).toBeGreaterThan(0);

  for (const character of world.characters!) {
    const beadHand = character.getBeadHand();
    expect(beadHand).toBeDefined();
    expect(beadHand!.getHandTotal()).toBe(count);
  }
});

// Bag + hand total assertions (robust against random draws)

Then(
  'the bag plus hand total should be {int} red, {int} green, {int} blue, {int} white totaling {int}',
  function (
    world: BattleBuilderBeadsWorld,
    red: number,
    green: number,
    blue: number,
    white: number,
    total: number
  ) {
    expect(world.characters).toBeDefined();
    expect(world.characters!.length).toBeGreaterThan(0);

    const beadHand = world.characters![0].getBeadHand();
    expect(beadHand).toBeDefined();

    const bagCounts = beadHand!.getBagCounts();
    const handCounts = beadHand!.getHandCounts();

    expect(bagCounts.red + handCounts.red).toBe(red);
    expect(bagCounts.green + handCounts.green).toBe(green);
    expect(bagCounts.blue + handCounts.blue).toBe(blue);
    expect(bagCounts.white + handCounts.white).toBe(white);

    const grandTotal =
      bagCounts.red + handCounts.red +
      bagCounts.green + handCounts.green +
      bagCounts.blue + handCounts.blue +
      bagCounts.white + handCounts.white;
    expect(grandTotal).toBe(total);
  }
);

Then(
  'each character bag plus hand total should be {int} red, {int} green, {int} blue, {int} white totaling {int}',
  function (
    world: BattleBuilderBeadsWorld,
    red: number,
    green: number,
    blue: number,
    white: number,
    total: number
  ) {
    expect(world.characters).toBeDefined();
    expect(world.characters!.length).toBeGreaterThan(0);

    for (const character of world.characters!) {
      const beadHand = character.getBeadHand();
      expect(beadHand).toBeDefined();

      const bagCounts = beadHand!.getBagCounts();
      const handCounts = beadHand!.getHandCounts();

      expect(bagCounts.red + handCounts.red).toBe(red);
      expect(bagCounts.green + handCounts.green).toBe(green);
      expect(bagCounts.blue + handCounts.blue).toBe(blue);
      expect(bagCounts.white + handCounts.white).toBe(white);

      const grandTotal =
        bagCounts.red + handCounts.red +
        bagCounts.green + handCounts.green +
        bagCounts.blue + handCounts.blue +
        bagCounts.white + handCounts.white;
      expect(grandTotal).toBe(total);
    }
  }
);

// Bag remaining assertions

Then(
  'the character bead bag should have {int} remaining beads out of {int} total',
  function (world: BattleBuilderBeadsWorld, bagBeads: number, totalBeads: number) {
    expect(world.characters).toBeDefined();
    expect(world.characters!.length).toBeGreaterThan(0);

    const beadHand = world.characters![0].getBeadHand();
    expect(beadHand).toBeDefined();

    expect(beadHand!.getBagTotal()).toBe(bagBeads);
    expect(beadHand!.getBagTotal() + beadHand!.getHandTotal()).toBe(totalBeads);
  }
);

// Per-character bag+hand total assertions (for party scenarios)

Then(
  'character {string} bag plus hand total should be {int} red, {int} green, {int} blue, {int} white totaling {int}',
  function (
    world: BattleBuilderBeadsWorld,
    charName: string,
    red: number,
    green: number,
    blue: number,
    white: number,
    total: number
  ) {
    expect(world.characterMap).toBeDefined();
    expect(world.characterMap!.has(charName)).toBe(true);

    const character = world.characterMap!.get(charName)!;
    const beadHand = character.getBeadHand();
    expect(beadHand).toBeDefined();

    const bagCounts = beadHand!.getBagCounts();
    const handCounts = beadHand!.getHandCounts();

    expect(bagCounts.red + handCounts.red).toBe(red);
    expect(bagCounts.green + handCounts.green).toBe(green);
    expect(bagCounts.blue + handCounts.blue).toBe(blue);
    expect(bagCounts.white + handCounts.white).toBe(white);

    const grandTotal =
      bagCounts.red + handCounts.red +
      bagCounts.green + handCounts.green +
      bagCounts.blue + handCounts.blue +
      bagCounts.white + handCounts.white;
    expect(grandTotal).toBe(total);
  }
);
