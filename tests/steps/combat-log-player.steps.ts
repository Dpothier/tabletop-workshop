import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type {
  CombatLogEntry,
  TurnStartEntry,
  MoveEntry,
  CombatOutcomeEntry,
  BeadDrawEntry,
  MonsterStateTransitionEntry,
} from '@src/recording/CombatRecorder';
import type { AnimationEvent } from '@src/types/AnimationEvent';

interface CombatLogPlayerWorld extends QuickPickleWorld {
  playerCombatLog?: CombatLogEntry[];
  playerInstance?: any;
  playerReplaySteps?: any[];
  playerCurrentStepIndex?: number;
  playerAnimationEvents?: AnimationEvent[];
  playerLastReplayStep?: any;
}

// Helper: Convert color string (e.g., "red,blue") to BeadColor array
function parseColors(colorStr: string): string[] {
  return colorStr.split(',').map((c) => c.trim());
}

// Background: Initialize combat log
Given(
  'a player combat log with 3 turn-start entries and interleaved events',
  function (world: CombatLogPlayerWorld) {
    world.playerCombatLog = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'action-selected',
        seq: 2,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actionId: 'attack',
        actionName: 'Attack',
        modifiers: [],
        beadCost: 0,
      } as any,
      {
        type: 'turn-start',
        seq: 3,
        actorId: 'hero-1',
        actorName: 'Mage',
        actorType: 'player',
        wheelPosition: 1,
      } as TurnStartEntry,
      {
        type: 'action-selected',
        seq: 4,
        actorId: 'hero-1',
        actorName: 'Mage',
        actionId: 'cast',
        actionName: 'Cast Spell',
        modifiers: [],
        beadCost: 1,
      } as any,
      {
        type: 'turn-start',
        seq: 5,
        actorId: 'monster-0',
        actorName: 'Goblin',
        actorType: 'monster',
        wheelPosition: 2,
      } as TurnStartEntry,
      {
        type: 'action-selected',
        seq: 6,
        actorId: 'monster-0',
        actorName: 'Goblin',
        actionId: 'attack',
        actionName: 'Attack',
        modifiers: [],
        beadCost: 0,
      } as any,
    ];
  }
);

Given(
  'a player combat log with 2 turns and a round-end after the second turn',
  function (world: CombatLogPlayerWorld) {
    world.playerCombatLog = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'action-selected',
        seq: 2,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actionId: 'attack',
        actionName: 'Attack',
        modifiers: [],
        beadCost: 0,
      } as any,
      {
        type: 'turn-start',
        seq: 3,
        actorId: 'hero-1',
        actorName: 'Mage',
        actorType: 'player',
        wheelPosition: 1,
      } as TurnStartEntry,
      {
        type: 'action-selected',
        seq: 4,
        actorId: 'hero-1',
        actorName: 'Mage',
        actionId: 'cast',
        actionName: 'Cast Spell',
        modifiers: [],
        beadCost: 1,
      } as any,
      {
        type: 'round-end',
        seq: 5,
        entitySummaries: [
          {
            id: 'hero-0',
            name: 'Warrior',
            hp: 100,
            maxHp: 100,
            handCounts: { red: 0, blue: 0, green: 0, white: 0 },
          },
          {
            id: 'hero-1',
            name: 'Mage',
            hp: 80,
            maxHp: 100,
            handCounts: { red: 1, blue: 0, green: 0, white: 0 },
          },
        ],
      } as any,
    ];
  }
);

Given(
  'a player combat log with a turn-start for actor {string} named {string}',
  function (world: CombatLogPlayerWorld, actorId: string, actorName: string) {
    world.playerCombatLog = [
      {
        type: 'turn-start',
        seq: 1,
        actorId,
        actorName,
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
    ];
  }
);

Given('a player with 3 built steps', async function (world: CombatLogPlayerWorld) {
  const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
  world.playerInstance = new CombatLogPlayer();
  const entries: CombatLogEntry[] = [
    {
      type: 'turn-start',
      seq: 1,
      actorId: 'hero-0',
      actorName: 'Warrior',
      actorType: 'player',
      wheelPosition: 0,
    } as TurnStartEntry,
    {
      type: 'action-selected',
      seq: 2,
      actorId: 'hero-0',
      actorName: 'Warrior',
      actionId: 'attack',
      actionName: 'Attack',
      modifiers: [],
      beadCost: 0,
    } as any,
    {
      type: 'turn-start',
      seq: 3,
      actorId: 'hero-1',
      actorName: 'Mage',
      actorType: 'player',
      wheelPosition: 1,
    } as TurnStartEntry,
    {
      type: 'action-selected',
      seq: 4,
      actorId: 'hero-1',
      actorName: 'Mage',
      actionId: 'cast',
      actionName: 'Cast Spell',
      modifiers: [],
      beadCost: 1,
    } as any,
    {
      type: 'turn-start',
      seq: 5,
      actorId: 'monster-0',
      actorName: 'Goblin',
      actorType: 'monster',
      wheelPosition: 2,
    } as TurnStartEntry,
    {
      type: 'action-selected',
      seq: 6,
      actorId: 'monster-0',
      actorName: 'Goblin',
      actionId: 'attack',
      actionName: 'Attack',
      modifiers: [],
      beadCost: 0,
    } as any,
  ];
  world.playerReplaySteps = world.playerInstance.buildSteps(entries);
  world.playerCurrentStepIndex = 0;
});

Given('a player with 2 built steps', async function (world: CombatLogPlayerWorld) {
  const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
  world.playerInstance = new CombatLogPlayer();
  const entries: CombatLogEntry[] = [
    {
      type: 'turn-start',
      seq: 1,
      actorId: 'hero-0',
      actorName: 'Warrior',
      actorType: 'player',
      wheelPosition: 0,
    } as TurnStartEntry,
    {
      type: 'action-selected',
      seq: 2,
      actorId: 'hero-0',
      actorName: 'Warrior',
      actionId: 'attack',
      actionName: 'Attack',
      modifiers: [],
      beadCost: 0,
    } as any,
    {
      type: 'turn-start',
      seq: 3,
      actorId: 'hero-1',
      actorName: 'Mage',
      actorType: 'player',
      wheelPosition: 1,
    } as TurnStartEntry,
    {
      type: 'action-selected',
      seq: 4,
      actorId: 'hero-1',
      actorName: 'Mage',
      actionId: 'cast',
      actionName: 'Cast Spell',
      modifiers: [],
      beadCost: 1,
    } as any,
  ];
  world.playerReplaySteps = world.playerInstance.buildSteps(entries);
  world.playerCurrentStepIndex = 0;
});

Given(
  'a player replay step with a move entry from {string} to {string}',
  async function (world: CombatLogPlayerWorld, fromPos: string, toPos: string) {
    const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
    world.playerInstance = new CombatLogPlayer();
    const entries: CombatLogEntry[] = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'move',
        seq: 2,
        entityId: 'hero-0',
        entityName: 'Warrior',
        from: fromPos,
        to: toPos,
      } as MoveEntry,
    ];
    world.playerReplaySteps = world.playerInstance.buildSteps(entries);
    world.playerLastReplayStep = world.playerReplaySteps![0];
  }
);

Given(
  'a player replay step with a combat-outcome hit entry dealing {int} damage',
  async function (world: CombatLogPlayerWorld, damage: number) {
    const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
    world.playerInstance = new CombatLogPlayer();
    const entries: CombatLogEntry[] = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'combat-outcome',
        seq: 2,
        attackerId: 'hero-0',
        targetId: 'monster-0',
        outcome: 'hit',
        damage,
        blockedDamage: 0,
        targetHealthAfter: 100 - damage,
        targetMaxHealth: 100,
      } as CombatOutcomeEntry,
    ];
    world.playerReplaySteps = world.playerInstance.buildSteps(entries);
    world.playerLastReplayStep = world.playerReplaySteps![0];
  }
);

Given(
  'a player replay step with a combat-outcome dodged entry',
  async function (world: CombatLogPlayerWorld) {
    const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
    world.playerInstance = new CombatLogPlayer();
    const entries: CombatLogEntry[] = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'combat-outcome',
        seq: 2,
        attackerId: 'monster-0',
        targetId: 'hero-0',
        outcome: 'dodged',
        damage: 0,
        blockedDamage: 0,
        targetHealthAfter: 100,
        targetMaxHealth: 100,
      } as CombatOutcomeEntry,
    ];
    world.playerReplaySteps = world.playerInstance.buildSteps(entries);
    world.playerLastReplayStep = world.playerReplaySteps![0];
  }
);

Given(
  'a player replay step with a combat-outcome guarded entry blocking {int} damage',
  async function (world: CombatLogPlayerWorld, blockedDamage: number) {
    const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
    world.playerInstance = new CombatLogPlayer();
    const entries: CombatLogEntry[] = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'combat-outcome',
        seq: 2,
        attackerId: 'monster-0',
        targetId: 'hero-0',
        outcome: 'guarded',
        damage: 5,
        blockedDamage,
        targetHealthAfter: 100 - (5 - blockedDamage),
        targetMaxHealth: 100,
      } as CombatOutcomeEntry,
    ];
    world.playerReplaySteps = world.playerInstance.buildSteps(entries);
    world.playerLastReplayStep = world.playerReplaySteps![0];
  }
);

Given(
  'a player replay step with a bead-draw entry with colors {string}',
  async function (world: CombatLogPlayerWorld, colorStr: string) {
    const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
    world.playerInstance = new CombatLogPlayer();
    const colors = parseColors(colorStr);
    const entries: CombatLogEntry[] = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'bead-draw',
        seq: 2,
        entityId: 'hero-0',
        entityName: 'Warrior',
        colors: colors as any,
        source: 'rest',
        handAfter: { red: 1, blue: 1, green: 0, white: 0 },
      } as BeadDrawEntry,
    ];
    world.playerReplaySteps = world.playerInstance.buildSteps(entries);
    world.playerLastReplayStep = world.playerReplaySteps![0];
  }
);

Given(
  'a player replay step with a monster-state-transition from {string} to {string} with bead {string}',
  async function (world: CombatLogPlayerWorld, fromState: string, toState: string, bead: string) {
    const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
    world.playerInstance = new CombatLogPlayer();
    const entries: CombatLogEntry[] = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'monster-0',
        actorName: 'Goblin',
        actorType: 'monster',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'monster-state-transition',
        seq: 2,
        fromState,
        toState,
        drawnBead: bead as any,
      } as MonsterStateTransitionEntry,
    ];
    world.playerReplaySteps = world.playerInstance.buildSteps(entries);
    world.playerLastReplayStep = world.playerReplaySteps![0];
  }
);

Given(
  'a player replay step with move then combat-outcome entries',
  async function (world: CombatLogPlayerWorld) {
    const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
    world.playerInstance = new CombatLogPlayer();
    const entries: CombatLogEntry[] = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Warrior',
        actorType: 'player',
        wheelPosition: 0,
      } as TurnStartEntry,
      {
        type: 'move',
        seq: 2,
        entityId: 'hero-0',
        entityName: 'Warrior',
        from: '0,0',
        to: '1,1',
      } as MoveEntry,
      {
        type: 'combat-outcome',
        seq: 3,
        attackerId: 'hero-0',
        targetId: 'monster-0',
        outcome: 'hit',
        damage: 3,
        blockedDamage: 0,
        targetHealthAfter: 97,
        targetMaxHealth: 100,
      } as CombatOutcomeEntry,
    ];
    world.playerReplaySteps = world.playerInstance.buildSteps(entries);
    world.playerLastReplayStep = world.playerReplaySteps![0];
  }
);

// When steps

When('I player build steps from the log', async function (world: CombatLogPlayerWorld) {
  const { CombatLogPlayer } = await import('@src/recording/CombatLogPlayer');
  world.playerInstance = new CombatLogPlayer();
  world.playerReplaySteps = world.playerInstance.buildSteps(world.playerCombatLog || []);
  world.playerCurrentStepIndex = 0;
});

When('I player call nextStep', function (world: CombatLogPlayerWorld) {
  const step = world.playerInstance!.nextStep();
  world.playerLastReplayStep = step;
});

When('I player call nextStep again', function (world: CombatLogPlayerWorld) {
  const step = world.playerInstance!.nextStep();
  world.playerLastReplayStep = step;
});

When('I player consume all steps', function (world: CombatLogPlayerWorld) {
  while (!world.playerInstance!.isComplete()) {
    world.playerInstance!.nextStep();
  }
});

When('I player convert the step to animation events', function (world: CombatLogPlayerWorld) {
  if (!world.playerLastReplayStep) {
    throw new Error('No replay step set');
  }
  world.playerAnimationEvents = world.playerInstance!.toAnimationEvents(world.playerLastReplayStep);
});

// Then steps

Then(
  'the player result should have {int} replay steps',
  function (world: CombatLogPlayerWorld, expectedCount: number) {
    expect(world.playerReplaySteps).toBeDefined();
    expect(world.playerReplaySteps).toHaveLength(expectedCount);
  }
);

Then(
  'the player last step should include the round-end entry',
  function (world: CombatLogPlayerWorld) {
    const lastStep = world.playerReplaySteps![world.playerReplaySteps!.length - 1];
    expect(lastStep.entries).toBeDefined();
    expect(lastStep.entries).toContainEqual(
      expect.objectContaining({
        type: 'round-end',
      })
    );
  }
);

Then(
  'the player last step includesRoundEnd should be true',
  function (world: CombatLogPlayerWorld) {
    const lastStep = world.playerReplaySteps![world.playerReplaySteps!.length - 1];
    expect(lastStep.includesRoundEnd).toBe(true);
  }
);

Then(
  'player step {int} should have actorId {string}',
  function (world: CombatLogPlayerWorld, stepIdx: number, expectedActorId: string) {
    expect(world.playerReplaySteps![stepIdx].actorId).toBe(expectedActorId);
  }
);

Then(
  'player step {int} should have actorName {string}',
  function (world: CombatLogPlayerWorld, stepIdx: number, expectedActorName: string) {
    expect(world.playerReplaySteps![stepIdx].actorName).toBe(expectedActorName);
  }
);

Then(
  'the player returned step should be step {int}',
  function (world: CombatLogPlayerWorld, expectedIdx: number) {
    expect(world.playerLastReplayStep).toBeDefined();
    expect(world.playerLastReplayStep).toEqual(world.playerReplaySteps![expectedIdx]);
  }
);

Then('player isComplete should be true', function (world: CombatLogPlayerWorld) {
  expect(world.playerInstance!.isComplete()).toBe(true);
});

Then(
  'the player events should contain a MoveEvent from {string} to {string}',
  function (world: CombatLogPlayerWorld, fromStr: string, toStr: string) {
    expect(world.playerAnimationEvents).toBeDefined();
    const moveEvent = world.playerAnimationEvents!.find((e) => e.type === 'move');
    expect(moveEvent).toBeDefined();
    const [fromX, fromY] = fromStr.split(',').map(Number);
    const [toX, toY] = toStr.split(',').map(Number);
    expect(moveEvent).toMatchObject({
      type: 'move',
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY },
    });
  }
);

Then('the player events should contain a HitEvent', function (world: CombatLogPlayerWorld) {
  expect(world.playerAnimationEvents).toBeDefined();
  const hitEvent = world.playerAnimationEvents!.find((e) => e.type === 'hit');
  expect(hitEvent).toBeDefined();
});

Then(
  'the player events should contain a DamageEvent with newHealth after {int} damage',
  function (world: CombatLogPlayerWorld, damage: number) {
    expect(world.playerAnimationEvents).toBeDefined();
    const damageEvent = world.playerAnimationEvents!.find((e) => e.type === 'damage');
    expect(damageEvent).toBeDefined();
    expect((damageEvent as any).newHealth).toBe(100 - damage);
  }
);

Then('the player events should contain a DodgeEvent', function (world: CombatLogPlayerWorld) {
  expect(world.playerAnimationEvents).toBeDefined();
  const dodgeEvent = world.playerAnimationEvents!.find((e) => e.type === 'dodge');
  expect(dodgeEvent).toBeDefined();
});

Then(
  'the player events should contain a GuardedEvent with blockedDamage {int}',
  function (world: CombatLogPlayerWorld, expectedBlockedDamage: number) {
    expect(world.playerAnimationEvents).toBeDefined();
    const guardedEvent = world.playerAnimationEvents!.find((e) => e.type === 'guarded');
    expect(guardedEvent).toBeDefined();
    expect((guardedEvent as any).blockedDamage).toBe(expectedBlockedDamage);
  }
);

Then(
  'the player events should contain a RestEvent with beadsDrawn {string}',
  function (world: CombatLogPlayerWorld, colorStr: string) {
    expect(world.playerAnimationEvents).toBeDefined();
    const restEvent = world.playerAnimationEvents!.find((e) => e.type === 'rest');
    expect(restEvent).toBeDefined();
    const expectedColors = parseColors(colorStr);
    expect((restEvent as any).beadsDrawn).toEqual(expectedColors);
  }
);

Then(
  'the player events should contain a BeadDrawEvent with color {string}',
  function (world: CombatLogPlayerWorld, expectedColor: string) {
    expect(world.playerAnimationEvents).toBeDefined();
    const beadDrawEvent = world.playerAnimationEvents!.find((e) => e.type === 'beadDraw');
    expect(beadDrawEvent).toBeDefined();
    expect((beadDrawEvent as any).color).toBe(expectedColor);
  }
);

Then(
  'the player events should contain a StateChangeEvent from {string} to {string}',
  function (world: CombatLogPlayerWorld, fromState: string, toState: string) {
    expect(world.playerAnimationEvents).toBeDefined();
    const stateChangeEvent = world.playerAnimationEvents!.find((e) => e.type === 'stateChange');
    expect(stateChangeEvent).toBeDefined();
    expect(stateChangeEvent).toMatchObject({
      type: 'stateChange',
      fromState,
      toState,
    });
  }
);

Then(
  'the player MoveEvent should come before the player combat events',
  function (world: CombatLogPlayerWorld) {
    expect(world.playerAnimationEvents).toBeDefined();
    const moveIdx = world.playerAnimationEvents!.findIndex((e) => e.type === 'move');
    const hitIdx = world.playerAnimationEvents!.findIndex((e) => e.type === 'hit');
    expect(moveIdx).toBeLessThan(hitIdx);
  }
);
