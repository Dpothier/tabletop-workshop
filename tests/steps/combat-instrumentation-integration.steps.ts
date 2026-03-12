import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { CombatRecorder } from '@src/recording/CombatRecorder';
import type {
  CombatLogEntry,
  TurnStartEntry,
  ActionSelectedEntry,
  WheelAdvanceEntry,
  RoundEndEntry,
} from '@src/recording/CombatRecorder';
import type { BattleState } from '@src/state/BattleState';
import type { GameContext } from '@src/types/Effect';
import { Character } from '@src/entities/Character';
import { MonsterEntity } from '@src/entities/MonsterEntity';
import { MoveEffect } from '@src/effects/MoveEffect';
import { AttackEffect } from '@src/effects/AttackEffect';
import { TurnFlowController } from '@src/controllers/TurnFlowController';
import type { Monster, Arena, CharacterClass } from '@src/systems/DataLoader';
import { BattleBuilder } from '@src/builders/BattleBuilder';

interface CombatInstrumentationWorld extends QuickPickleWorld {
  battleState?: BattleState;
  recorder?: CombatRecorder;
  gameContext?: GameContext;
  characters?: Character[];
  monster?: MonsterEntity;
  lastEntries?: CombatLogEntry[];
  executionError?: Error;
  battleAdapter?: any;
}

/**
 * Create a minimal mock BattleAdapter for testing
 */
function createMockBattleAdapter() {
  return {
    promptTile: async () => null,
    promptEntity: async () => null,
    promptOptions: async () => null,
    animate: async () => {},
    log: () => {},
    showPlayerTurn: () => {},
    awaitPlayerAction: async () => 'move',
    transition: () => {},
    delay: async () => {},
    notifyBeadsChanged: () => {},
  };
}

function createMinimalTestMonster(): Monster {
  return {
    name: 'TestBoss',
    stats: { health: 50 },
  } as any;
}

function createMonsterWithStateMachine(): Monster {
  return {
    name: 'TestBoss',
    stats: { health: 50 },
    beads: { red: 3, blue: 2, green: 1, white: 2 },
    states: {
      idle: {
        damage: 0,
        wheel_cost: 1,
        transitions: { red: 'attack', blue: 'defend', green: 'idle', white: 'idle' },
      },
      attack: {
        damage: 3,
        wheel_cost: 2,
        transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
      },
      defend: {
        damage: 0,
        wheel_cost: 1,
        transitions: { red: 'attack', blue: 'defend', green: 'idle', white: 'idle' },
      },
    },
    start_state: 'idle',
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

// ============================================================================
// GIVEN: Setup steps
// ============================================================================

Given(
  'integration instrumentation battle with recorder',
  function (world: CombatInstrumentationWorld) {
    try {
      const recorder = new CombatRecorder();
      const monster = createMinimalTestMonster();
      const arena = createMinimalTestArena();
      const testClass = createMinimalTestClass();

      const builder = new BattleBuilder()
        .withMonster(monster)
        .withArena(arena)
        .withClasses([testClass])
        .withRecorder(recorder)
        .withActions([])
        .withPartySize(1);

      world.battleState = builder.build();
      world.recorder = recorder;
      world.characters = world.battleState!.characters;
      world.monster = world.battleState!.monsterEntity;
      world.gameContext = world.battleState!.createGameContext('hero-0');
      world.lastEntries = [];
    } catch (error) {
      world.executionError = error as Error;
      throw error;
    }
  }
);

Given(
  'integration instrumentation battle with recorder and monster with state machine',
  function (world: CombatInstrumentationWorld) {
    try {
      const recorder = new CombatRecorder();
      const monster = createMonsterWithStateMachine();
      const arena = createMinimalTestArena();
      const testClass = createMinimalTestClass();

      const builder = new BattleBuilder()
        .withMonster(monster)
        .withArena(arena)
        .withClasses([testClass])
        .withRecorder(recorder)
        .withActions([])
        .withPartySize(2);

      world.battleState = builder.build();
      world.recorder = recorder;
      world.characters = world.battleState!.characters;
      world.monster = world.battleState!.monsterEntity;
      world.gameContext = world.battleState!.createGameContext('hero-0');
      world.lastEntries = [];
    } catch (error) {
      world.executionError = error as Error;
      throw error;
    }
  }
);

Given(
  'integration instrumentation battle with recorder and multiple entities',
  function (world: CombatInstrumentationWorld) {
    try {
      const recorder = new CombatRecorder();
      const monster = createMinimalTestMonster();
      const arena = createMinimalTestArena();
      const testClass = createMinimalTestClass();

      const builder = new BattleBuilder()
        .withMonster(monster)
        .withArena(arena)
        .withClasses([testClass])
        .withRecorder(recorder)
        .withActions([])
        .withPartySize(3);

      world.battleState = builder.build();
      world.recorder = recorder;
      world.characters = world.battleState!.characters;
      world.monster = world.battleState!.monsterEntity;
      world.gameContext = world.battleState!.createGameContext('hero-0');
      world.lastEntries = [];
    } catch (error) {
      world.executionError = error as Error;
      throw error;
    }
  }
);

// ============================================================================
// WHEN: Action steps
// ============================================================================

When(
  'integration instrumentation player executes move and attack',
  async function (world: CombatInstrumentationWorld) {
    try {
      if (!world.battleState || !world.recorder) {
        throw new Error('Battle state not initialized');
      }

      const character = world.characters![0];
      const gameContext = world.battleState.createGameContext(character.id);

      // Record action selection
      world.recorder.record({
        type: 'action-selected',
        seq: 0,
        actorId: character.id,
        actorName: (character as any).name || character.id,
        actionId: 'move',
        actionName: 'move',
        modifiers: [],
        beadCost: 0,
      } as ActionSelectedEntry);

      // Execute move effect
      const moveEffect = new MoveEffect();
      moveEffect.execute(
        gameContext,
        {
          destination: { x: 4, y: 4 },
        },
        {},
        new Map()
      );

      // Record attack selection
      world.recorder.record({
        type: 'action-selected',
        seq: 0,
        actorId: character.id,
        actorName: (character as any).name || character.id,
        actionId: 'attack',
        actionName: 'attack',
        modifiers: [],
        beadCost: 1,
      } as ActionSelectedEntry);

      // Execute attack effect
      const attackEffect = new AttackEffect();
      await attackEffect.execute(
        gameContext,
        {
          targetEntity: 'monster',
        },
        {},
        new Map()
      );

      world.lastEntries = world.recorder.getEntries();
    } catch (error) {
      world.executionError = error as Error;
      throw error;
    }
  }
);

When(
  'integration instrumentation monster executes turn',
  async function (world: CombatInstrumentationWorld) {
    try {
      if (!world.battleState || !world.recorder || !world.monster) {
        throw new Error('Battle state not initialized');
      }

      // Record turn start
      world.recorder.record({
        type: 'turn-start',
        seq: 0,
        actorId: 'monster',
        actorName: (world.monster as any).name || 'monster',
        actorType: 'monster',
        wheelPosition: 0,
      } as TurnStartEntry);

      // Get alive characters as targets
      const targets = world.characters!.filter((c) => c.isAlive());

      // Execute monster's turn
      const decision = world.monster.decideTurn(targets, world.recorder);

      // Record wheel advance
      world.recorder.record({
        type: 'wheel-advance',
        seq: 0,
        entityId: 'monster',
        entityName: (world.monster as any).name || 'monster',
        cost: decision.wheelCost,
        newPosition: decision.wheelCost,
      } as WheelAdvanceEntry);

      world.lastEntries = world.recorder.getEntries();
    } catch (error) {
      world.executionError = error as Error;
      throw error;
    }
  }
);

When('integration instrumentation round ends', function (world: CombatInstrumentationWorld) {
  try {
    if (!world.battleState || !world.recorder) {
      throw new Error('Battle state not initialized');
    }

    // Create TurnFlowController and call resolveEndOfRound
    world.battleAdapter = createMockBattleAdapter();
    const controller = new TurnFlowController(world.battleState, world.battleAdapter);

    controller.resolveEndOfRound();

    world.lastEntries = world.recorder.getEntries();
  } catch (error) {
    world.executionError = error as Error;
    throw error;
  }
});

// ============================================================================
// THEN: Assertion steps
// ============================================================================

Then(
  'integration instrumentation recorder should contain action-selected entry',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const actionSelectedEntries = entries.filter((e) => e.type === 'action-selected');
    expect(actionSelectedEntries.length).toBeGreaterThan(0);
  }
);

Then(
  'integration instrumentation recorder should contain move entry',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const moveEntries = entries.filter((e) => e.type === 'move');
    expect(moveEntries.length).toBeGreaterThan(0);
  }
);

Then(
  'integration instrumentation recorder should contain attack-attempt entry',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const attackEntries = entries.filter((e) => e.type === 'attack-attempt');
    expect(attackEntries.length).toBeGreaterThan(0);
  }
);

Then(
  'integration instrumentation recorder should contain combat-outcome entry',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const outcomeEntries = entries.filter((e) => e.type === 'combat-outcome');
    expect(outcomeEntries.length).toBeGreaterThan(0);
  }
);

Then(
  'integration instrumentation entries should be in correct order',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();

    // Find indices of key entry types
    const actionSelectedIdx = entries.findIndex((e) => e.type === 'action-selected');
    const moveIdx = entries.findIndex((e) => e.type === 'move');
    const attackIdx = entries.findIndex((e) => e.type === 'attack-attempt');
    const outcomeIdx = entries.findIndex((e) => e.type === 'combat-outcome');

    // All must exist
    expect(actionSelectedIdx).toBeGreaterThanOrEqual(0);
    expect(moveIdx).toBeGreaterThanOrEqual(0);
    expect(attackIdx).toBeGreaterThanOrEqual(0);
    expect(outcomeIdx).toBeGreaterThanOrEqual(0);

    // Verify sequence: action-selected, move, attack, outcome
    // (allowing for other entries in between)
    expect(actionSelectedIdx).toBeLessThan(moveIdx);
    expect(moveIdx).toBeLessThan(attackIdx);
    expect(attackIdx).toBeLessThan(outcomeIdx);
  }
);

Then(
  'integration instrumentation recorder should contain turn-start entry type monster',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const turnStartEntries = entries.filter(
      (e) => e.type === 'turn-start' && (e as TurnStartEntry).actorType === 'monster'
    );
    expect(turnStartEntries.length).toBeGreaterThan(0);
  }
);

Then(
  'integration instrumentation recorder should contain monster-state-transition entry',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const stateTransitions = entries.filter((e) => e.type === 'monster-state-transition');
    expect(stateTransitions.length).toBeGreaterThan(0);
  }
);

Then(
  'integration instrumentation recorder should contain wheel-advance entry',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const wheelAdvances = entries.filter((e) => e.type === 'wheel-advance');
    expect(wheelAdvances.length).toBeGreaterThan(0);
  }
);

Then(
  'integration instrumentation monster action events should be recorded',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();

    // Verify we have turn-start, state-transition, and wheel-advance
    const hasTurnStart = entries.some((e) => e.type === 'turn-start');
    const hasStateTransition = entries.some((e) => e.type === 'monster-state-transition');
    const hasWheelAdvance = entries.some((e) => e.type === 'wheel-advance');

    expect(hasTurnStart).toBe(true);
    expect(hasStateTransition).toBe(true);
    expect(hasWheelAdvance).toBe(true);
  }
);

Then(
  'integration instrumentation recorder should contain round-end entry',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const roundEnds = entries.filter((e) => e.type === 'round-end');
    expect(roundEnds.length).toBeGreaterThan(0);
  }
);

Then(
  'integration instrumentation round-end should have all entity summaries',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const roundEnds = entries.filter((e) => e.type === 'round-end') as RoundEndEntry[];
    expect(roundEnds.length).toBeGreaterThan(0);

    const lastRoundEnd = roundEnds[roundEnds.length - 1];
    expect(lastRoundEnd.entitySummaries).toBeDefined();
    expect(Array.isArray(lastRoundEnd.entitySummaries)).toBe(true);
    expect(lastRoundEnd.entitySummaries.length).toBeGreaterThan(0);

    // Verify each summary has required fields
    for (const summary of lastRoundEnd.entitySummaries) {
      expect(summary.id).toBeDefined();
      expect(summary.name).toBeDefined();
      expect(typeof summary.hp).toBe('number');
      expect(typeof summary.maxHp).toBe('number');
      expect(summary.handCounts).toBeDefined();
    }
  }
);

Then(
  'integration instrumentation entity summaries should include characters and monster',
  function (world: CombatInstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const roundEnds = entries.filter((e) => e.type === 'round-end') as RoundEndEntry[];
    expect(roundEnds.length).toBeGreaterThan(0);

    const lastRoundEnd = roundEnds[roundEnds.length - 1];
    const summaries = lastRoundEnd.entitySummaries;

    // Should have at least one character + monster
    const characterSummaries = summaries.filter((s) => s.id.startsWith('hero-'));
    const monsterSummaries = summaries.filter((s) => s.id === 'monster');

    expect(characterSummaries.length).toBeGreaterThan(0);
    expect(monsterSummaries.length).toBe(1);

    // Total should match characters + monster
    expect(summaries.length).toBe(world.characters!.length + 1);
  }
);
