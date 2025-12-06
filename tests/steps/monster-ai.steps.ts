import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { MonsterAI, MonsterAction } from '../../src/systems/MonsterAI';
import { CombatResolver } from '../../src/systems/CombatResolver';
import { DiceRoller } from '../../src/systems/DiceRoller';
import type { Monster, MonsterAttack, MonsterPhase } from '../../src/systems/DataLoader';

interface CharacterInfo {
  x: number;
  y: number;
  health: number;
}

interface Position {
  x: number;
  y: number;
}

interface MonsterAIWorld extends QuickPickleWorld {
  monsterAI?: MonsterAI;
  monsterPosition?: Position;
  aiCharacters?: CharacterInfo[];
  closestTarget?: CharacterInfo | null;
  aiMonster?: Monster;
  currentPhase?: MonsterPhase | null | undefined;
  selectedAttack?: MonsterAttack | null;
  action?: MonsterAction | null;
  targetPosition?: Position;
  destination?: Position | null;
  arenaBounds?: { width: number; height: number };
  blockingTokens?: Position[];
}

Given('a monster AI system', function (world: MonsterAIWorld) {
  const diceRoller = new DiceRoller();
  const combatResolver = new CombatResolver(diceRoller);
  world.monsterAI = new MonsterAI(combatResolver);
  world.aiCharacters = [];
  world.blockingTokens = [];
  world.arenaBounds = { width: 8, height: 8 };
});

Given(
  'a monster at grid position {int},{int}',
  function (world: MonsterAIWorld, x: number, y: number) {
    world.monsterPosition = { x, y };
  }
);

Given(
  'characters at grid positions:',
  function (world: MonsterAIWorld, dataTable: { rawTable: string[][] }) {
    world.aiCharacters = [];
    for (let i = 1; i < dataTable.rawTable.length; i++) {
      const row = dataTable.rawTable[i];
      world.aiCharacters.push({
        x: parseInt(row[0]),
        y: parseInt(row[1]),
        health: parseInt(row[2]),
      });
    }
  }
);

When('finding the closest target', function (world: MonsterAIWorld) {
  world.closestTarget = world.monsterAI!.findClosestTarget(
    world.monsterPosition!,
    world.aiCharacters!
  );
});

Then(
  'the closest target should be at {int},{int}',
  function (world: MonsterAIWorld, x: number, y: number) {
    expect(world.closestTarget).not.toBeNull();
    expect(world.closestTarget!.x).toBe(x);
    expect(world.closestTarget!.y).toBe(y);
  }
);

Then('there should be no valid target', function (world: MonsterAIWorld) {
  expect(world.closestTarget).toBeNull();
});

Given(
  'a monster with attacks:',
  function (world: MonsterAIWorld, dataTable: { rawTable: string[][] }) {
    const attacks: Record<string, MonsterAttack> = {};
    for (let i = 1; i < dataTable.rawTable.length; i++) {
      const row = dataTable.rawTable[i];
      attacks[row[0]] = {
        name: row[1],
        damage: row[2],
        range: parseInt(row[3]),
      };
    }
    world.aiMonster = {
      name: 'Test Monster',
      stats: { health: 100 },
      attacks,
    };
  }
);

Given(
  'the monster is in a phase with attacks {string}',
  function (world: MonsterAIWorld, attackList: string) {
    world.currentPhase = {
      threshold: '100%',
      behavior: 'aggressive',
      attacks: attackList.split(','),
    };
  }
);

Given('the monster has no phases', function (world: MonsterAIWorld) {
  world.currentPhase = null;
});

When('selecting an attack', function (world: MonsterAIWorld) {
  world.selectedAttack = world.monsterAI!.selectAttack(
    world.aiMonster!,
    world.currentPhase ?? null
  );
});

Then(
  'the selected attack should be one of {string}',
  function (world: MonsterAIWorld, attackNames: string) {
    const validNames = attackNames.split(',');
    expect(world.selectedAttack).not.toBeNull();
    expect(validNames).toContain(world.selectedAttack!.name);
  }
);

Given(
  'a character at grid position {int},{int} with {int} health',
  function (world: MonsterAIWorld, x: number, y: number, health: number) {
    world.aiCharacters = world.aiCharacters || [];
    world.aiCharacters.push({ x, y, health });
  }
);

Given(
  'the monster has melee attack with range {int}',
  function (world: MonsterAIWorld, range: number) {
    world.aiMonster = {
      name: 'Test Monster',
      stats: { health: 100, speed: 2 },
      attacks: {
        melee: { name: 'Melee', damage: '1d6', range },
      },
    };
    world.currentPhase = null;
  }
);

When('deciding monster action', function (world: MonsterAIWorld) {
  world.action = world.monsterAI!.decideAction(
    world.monsterPosition!,
    world.aiMonster!,
    world.currentPhase ?? null,
    world.aiCharacters!,
    world.arenaBounds!.width,
    world.arenaBounds!.height,
    world.blockingTokens || []
  );
});

Then('the action should be {string}', function (world: MonsterAIWorld, actionType: string) {
  expect(world.action).not.toBeNull();
  expect(world.action!.type).toBe(actionType);
});

Given(
  'a target at grid position {int},{int}',
  function (world: MonsterAIWorld, x: number, y: number) {
    world.targetPosition = { x, y };
  }
);

When('calculating movement with speed {int}', function (world: MonsterAIWorld, speed: number) {
  world.destination = world.monsterAI!.calculateMovement(
    world.monsterPosition!,
    world.targetPosition!,
    speed,
    world.arenaBounds!.width,
    world.arenaBounds!.height,
    world.blockingTokens || []
  );
});

Then(
  'the destination should be {int},{int}',
  function (world: MonsterAIWorld, x: number, y: number) {
    expect(world.destination).not.toBeNull();
    expect(world.destination!.x).toBe(x);
    expect(world.destination!.y).toBe(y);
  }
);

Given(
  'arena bounds of {int}x{int}',
  function (world: MonsterAIWorld, width: number, height: number) {
    world.arenaBounds = { width, height };
  }
);

Then('the destination should be within bounds', function (world: MonsterAIWorld) {
  expect(world.destination).not.toBeNull();
  expect(world.destination!.x).toBeGreaterThanOrEqual(0);
  expect(world.destination!.x).toBeLessThan(world.arenaBounds!.width);
  expect(world.destination!.y).toBeGreaterThanOrEqual(0);
  expect(world.destination!.y).toBeLessThan(world.arenaBounds!.height);
});

Given(
  'a blocking token at position {int},{int}',
  function (world: MonsterAIWorld, x: number, y: number) {
    world.blockingTokens = world.blockingTokens || [];
    world.blockingTokens.push({ x, y });
  }
);

Then(
  'the destination should not be {int},{int}',
  function (world: MonsterAIWorld, x: number, y: number) {
    if (world.destination) {
      const isBlocked = world.destination.x === x && world.destination.y === y;
      expect(isBlocked).toBe(false);
    }
  }
);
