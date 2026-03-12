import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleBuilder } from '@src/builders/BattleBuilder';
import { CombatRecorder } from '@src/recording/CombatRecorder';
import type { Monster, Arena, CharacterClass } from '@src/systems/DataLoader';
import type { BattleState } from '@src/state/BattleState';

interface BattleBuilderRecorderWorld extends QuickPickleWorld {
  testMonster?: Monster;
  testArena?: Arena;
  testClass?: CharacterClass;
  recorder?: CombatRecorder;
  battleState?: BattleState;
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

// Background: Load test data

Given('battle recorder test data is loaded', function (world: BattleBuilderRecorderWorld) {
  world.testMonster = createMinimalTestMonster();
  world.testArena = createMinimalTestArena();
  world.testClass = createMinimalTestClass();
});

// Setup recorder configuration

Given(
  'a BattleBuilder configured with a CombatRecorder',
  function (world: BattleBuilderRecorderWorld) {
    world.recorder = new CombatRecorder();
  }
);

Given(
  'a BattleBuilder configured without a recorder',
  function (world: BattleBuilderRecorderWorld) {
    world.recorder = undefined;
  }
);

// Build battle

When('the builder builds the battle state', function (world: BattleBuilderRecorderWorld) {
  const builder = new BattleBuilder();
  builder.withMonster(world.testMonster!);
  builder.withArena(world.testArena!);
  builder.withPartySize(1);
  builder.withClasses([world.testClass!]);
  builder.withActions([]);

  if (world.recorder) {
    builder.withRecorder(world.recorder);
  }

  world.battleState = builder.build();
});

// Assertions

Then(
  'the battle state should have a defined recorder',
  function (world: BattleBuilderRecorderWorld) {
    expect(world.battleState).toBeDefined();
    expect(world.battleState!.recorder).toBeDefined();
    expect(world.battleState!.recorder).toBe(world.recorder);
  }
);

Then('the recorder should be able to record entries', function (world: BattleBuilderRecorderWorld) {
  expect(world.battleState).toBeDefined();
  expect(world.battleState!.recorder).toBeDefined();

  const recorder = world.battleState!.recorder!;

  // Record a test entry
  recorder.record({
    type: 'turn-start',
    seq: 0,
    actorId: 'test-actor',
    actorName: 'TestActor',
    actorType: 'player',
    wheelPosition: 0,
  });

  // Verify the entry was recorded
  const entries = recorder.getEntries();
  expect(entries).toBeDefined();
  expect(entries.length).toBe(1);
  expect(entries[0].type).toBe('turn-start');
  expect((entries[0] as any).actorId).toBe('test-actor');
  expect(entries[0].seq).toBe(1); // seq counter should be incremented to 1
});

Then('the battle state recorder should be undefined', function (world: BattleBuilderRecorderWorld) {
  expect(world.battleState).toBeDefined();
  expect(world.battleState!.recorder).toBeUndefined();
});
