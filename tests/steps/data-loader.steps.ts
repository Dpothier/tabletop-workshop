import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import yaml from 'js-yaml';
import type { QuickPickleWorld } from 'quickpickle';
import type { CharacterClass, Monster, Arena } from '../../src/systems/DataLoader';

interface DataWorld extends QuickPickleWorld {
  yamlData?: string;
  parsedClasses?: CharacterClass[];
  parsedMonsters?: Monster[];
  parsedArenas?: Arena[];
}

const sampleClassYaml = `
classes:
  - name: Knight
    stats:
      health: 25
      speed: 3
      damage: "1d8+3"
  - name: Mage
    stats:
      health: 15
      speed: 4
      damage: "2d6"
`;

const sampleMonsterYaml = `
monsters:
  - name: Stone Golem
    stats:
      health: 100
      armor: 4
    attacks:
      slam:
        name: Stone Slam
        damage: "3d6"
        range: 1
    phases:
      - threshold: "50%"
        behavior: aggressive
        attacks: [slam]
`;

const sampleArenaYaml = `
arenas:
  - name: Ancient Coliseum
    width: 12
    height: 10
    terrain:
      - ["normal", "normal", "hazard"]
      - ["normal", "pit", "normal"]
`;

Given('YAML data for character classes', function (world: DataWorld) {
  world.yamlData = sampleClassYaml;
});

Given('YAML data for monsters', function (world: DataWorld) {
  world.yamlData = sampleMonsterYaml;
});

Given('YAML data for arenas', function (world: DataWorld) {
  world.yamlData = sampleArenaYaml;
});

When('I parse the character data', function (world: DataWorld) {
  const data = yaml.load(world.yamlData!) as { classes: CharacterClass[] };
  world.parsedClasses = data.classes;
});

When('I parse the monster data', function (world: DataWorld) {
  const data = yaml.load(world.yamlData!) as { monsters: Monster[] };
  world.parsedMonsters = data.monsters;
});

When('I parse the arena data', function (world: DataWorld) {
  const data = yaml.load(world.yamlData!) as { arenas: Arena[] };
  world.parsedArenas = data.arenas;
});

Then('I should have character classes with names and stats', function (world: DataWorld) {
  expect(world.parsedClasses).toBeDefined();
  expect(world.parsedClasses!.length).toBeGreaterThan(0);
  for (const cls of world.parsedClasses!) {
    expect(cls.name).toBeDefined();
    expect(cls.stats).toBeDefined();
    expect(cls.stats.health).toBeGreaterThan(0);
  }
});

Then('I should have monsters with attacks and phases', function (world: DataWorld) {
  expect(world.parsedMonsters).toBeDefined();
  expect(world.parsedMonsters!.length).toBeGreaterThan(0);
  for (const monster of world.parsedMonsters!) {
    expect(monster.name).toBeDefined();
    expect(monster.attacks).toBeDefined();
    expect(monster.stats.health).toBeGreaterThan(0);
  }
});

Then('I should have arenas with dimensions and terrain', function (world: DataWorld) {
  expect(world.parsedArenas).toBeDefined();
  expect(world.parsedArenas!.length).toBeGreaterThan(0);
  for (const arena of world.parsedArenas!) {
    expect(arena.name).toBeDefined();
    expect(arena.width).toBeGreaterThan(0);
    expect(arena.height).toBeGreaterThan(0);
  }
});
