import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { CombatRecorder } from '@src/recording/CombatRecorder';
import type {
  CombatLogEntry,
  TurnStartEntry,
  ActionSelectedEntry,
  BeadSpendEntry,
  BeadDrawEntry,
  MoveEntry,
  AttackAttemptEntry,
  DefensiveReactionEntry,
  CombatOutcomeEntry,
  StateChangeEntry,
  MonsterStateTransitionEntry,
  WheelAdvanceEntry,
  SegmentChangeEntry,
  RoundEndEntry,
  BattleEndEntry,
} from '@src/recording/CombatRecorder';
import type { BeadCounts } from '@src/types/Beads';

interface RecorderWorld extends QuickPickleWorld {
  recorder?: CombatRecorder;
  lastEntry?: CombatLogEntry;
  entries?: CombatLogEntry[];
}

// Parse bead hand string like "red:2 blue:1"
function parseBeadHand(handStr: string): BeadCounts {
  const hand: BeadCounts = { red: 0, blue: 0, green: 0, white: 0 };
  if (!handStr || handStr.trim() === '') {
    return hand;
  }
  const pairs = handStr.split(/\s+/);
  for (const pair of pairs) {
    const [color, countStr] = pair.split(':');
    if (color && countStr) {
      const count = parseInt(countStr, 10);
      hand[color as keyof BeadCounts] = count;
    }
  }
  return hand;
}

// Helper to check if value is a plain object
function isPlainObject(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  return Object.getPrototypeOf(obj) === Object.prototype;
}

// Helper to detect circular references
function hasCircularReference(obj: unknown, seen = new WeakSet()): boolean {
  if (obj === null || typeof obj !== 'object') return false;
  if (seen.has(obj as object)) return true;
  seen.add(obj as object);

  const objToCheck = obj as Record<string, unknown>;
  for (const key in objToCheck) {
    if (hasCircularReference(objToCheck[key], seen)) {
      return true;
    }
  }
  return false;
}

Given('a new CombatRecorder', function (world: RecorderWorld) {
  world.recorder = new CombatRecorder();
  world.entries = [];
});

When(
  'I record a turn-start entry for actor {string} at wheel position {int}',
  function (world: RecorderWorld, actorId: string, wheelPosition: number) {
    const entry: TurnStartEntry = {
      type: 'turn-start',
      seq: 0, // Will be set by recorder
      actorId,
      actorName: actorId,
      actorType: 'player',
      wheelPosition,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a turn-start entry for actor {string} named {string} type {string} at wheel position {int}',
  function (
    world: RecorderWorld,
    actorId: string,
    actorName: string,
    actorType: string,
    wheelPosition: number
  ) {
    const entry: TurnStartEntry = {
      type: 'turn-start',
      seq: 0,
      actorId,
      actorName,
      actorType: actorType as 'player' | 'monster',
      wheelPosition,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record an action-selected entry for actor {string} with action {string}',
  function (world: RecorderWorld, actorId: string, actionId: string) {
    const entry: ActionSelectedEntry = {
      type: 'action-selected',
      seq: 0,
      actorId,
      actorName: actorId,
      actionId,
      actionName: actionId,
      modifiers: [],
      beadCost: 0,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record an action-selected entry for actor {string} with action {string} and modifier {string} costing {int} beads',
  function (
    world: RecorderWorld,
    actorId: string,
    actionId: string,
    modifier: string,
    cost: number
  ) {
    const entry: ActionSelectedEntry = {
      type: 'action-selected',
      seq: 0,
      actorId,
      actorName: actorId,
      actionId,
      actionName: actionId,
      modifiers: [modifier],
      beadCost: cost,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a bead-spend entry for actor {string} with reason {string}',
  function (world: RecorderWorld, entityId: string, reason: string) {
    const entry: BeadSpendEntry = {
      type: 'bead-spend',
      seq: 0,
      entityId,
      entityName: entityId,
      color: 'red',
      reason: reason as 'action-cost' | 'defensive-reaction',
      handAfter: { red: 0, blue: 0, green: 0, white: 0 },
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a bead-spend entry for actor {string} with reason {string} and hand {string}',
  function (world: RecorderWorld, entityId: string, reason: string, handStr: string) {
    const entry: BeadSpendEntry = {
      type: 'bead-spend',
      seq: 0,
      entityId,
      entityName: entityId,
      color: 'red',
      reason: reason as 'action-cost' | 'defensive-reaction',
      handAfter: parseBeadHand(handStr),
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a bead-draw entry for actor {string} with source {string} and hand {string}',
  function (world: RecorderWorld, entityId: string, source: string, handStr: string) {
    const entry: BeadDrawEntry = {
      type: 'bead-draw',
      seq: 0,
      entityId,
      entityName: entityId,
      colors: ['red'],
      source: source as 'rest' | 'start' | 'reshuffle',
      handAfter: parseBeadHand(handStr),
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a move entry from {string} to position {string}',
  function (world: RecorderWorld, entityId: string, toPos: string) {
    const entry: MoveEntry = {
      type: 'move',
      seq: 0,
      entityId,
      entityName: entityId,
      from: '0,0',
      to: toPos,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record an attack-attempt entry from {string} to {string} with power {int} agility {int}',
  function (
    world: RecorderWorld,
    attackerId: string,
    targetId: string,
    power: number,
    agility: number
  ) {
    const entry: AttackAttemptEntry = {
      type: 'attack-attempt',
      seq: 0,
      attackerId,
      attackerName: attackerId,
      targetId,
      targetName: targetId,
      power,
      agility,
      modifiers: [],
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a defensive-reaction entry for actor {string} type {string} spending {string}',
  function (world: RecorderWorld, defenderId: string, reactionType: string, beadsSpentStr: string) {
    const beadCount = parseInt(beadsSpentStr.split(':')[1] || '1', 10);
    const beadColor = beadsSpentStr.split(':')[0] as keyof BeadCounts;
    const beadsSpent = { red: 0, blue: 0, green: 0, white: 0, [beadColor]: beadCount };

    const entry: DefensiveReactionEntry = {
      type: 'defensive-reaction',
      seq: 0,
      defenderId,
      defenderName: defenderId,
      reactionType: reactionType as 'guard' | 'dodge' | 'resist',
      beadsSpent,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a combat-outcome entry from {string} to {string} with outcome {string} damage {int}',
  function (
    world: RecorderWorld,
    attackerId: string,
    targetId: string,
    outcome: string,
    damage: number
  ) {
    const entry: CombatOutcomeEntry = {
      type: 'combat-outcome',
      seq: 0,
      attackerId,
      targetId,
      outcome: outcome as 'hit' | 'dodged' | 'guarded',
      damage,
      blockedDamage: 0,
      targetHealthAfter: 100,
      targetMaxHealth: 100,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a state-change entry for actor {string} type {string} with stack {string}',
  function (world: RecorderWorld, entityId: string, changeType: string, stackName: string) {
    const entry: StateChangeEntry = {
      type: 'state-change',
      seq: 0,
      entityId,
      entityName: entityId,
      changeType: changeType as 'buff-add' | 'buff-remove' | 'hp-change' | 'status-effect',
      details: { stackName },
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a monster-state-transition entry from {string} to {string} with drawn bead {string}',
  function (world: RecorderWorld, fromState: string, toState: string, drawnBead: string) {
    const entry: MonsterStateTransitionEntry = {
      type: 'monster-state-transition',
      seq: 0,
      fromState,
      toState,
      drawnBead: drawnBead as any,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a wheel-advance entry for actor {string} costing {int} segment to position {int}',
  function (world: RecorderWorld, entityId: string, cost: number, newPosition: number) {
    const entry: WheelAdvanceEntry = {
      type: 'wheel-advance',
      seq: 0,
      entityId,
      entityName: entityId,
      cost,
      newPosition,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a segment-change entry from {string} to {string}',
  function (world: RecorderWorld, previousSegment: string, newSegment: string) {
    const entry: SegmentChangeEntry = {
      type: 'segment-change',
      seq: 0,
      previousSegment,
      newSegment,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a round-end entry with entities {string}',
  function (world: RecorderWorld, entitiesStr: string) {
    const entitySummaries = entitiesStr.split(',').map((ent: string) => {
      const [id, hpStr] = ent.trim().split(':');
      const [hp, maxHp] = hpStr.split('/').map(Number);
      return {
        id: id.trim(),
        name: id.trim(),
        hp,
        maxHp,
        handCounts: { red: 0, blue: 0, green: 0, white: 0 },
      };
    });

    const entry: RoundEndEntry = {
      type: 'round-end',
      seq: 0,
      entitySummaries,
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When(
  'I record a battle-end entry with outcome {string}',
  function (world: RecorderWorld, outcome: string) {
    const entry: BattleEndEntry = {
      type: 'battle-end',
      seq: 0,
      outcome: outcome as 'victory' | 'defeat',
    };
    world.recorder!.record(entry);
    world.lastEntry = entry;
    world.entries!.push(entry);
  }
);

When('I clear the recorder', function (world: RecorderWorld) {
  world.recorder!.clear();
  world.entries = [];
});

Then(
  'the recorded entry should have seq {int}',
  function (world: RecorderWorld, expectedSeq: number) {
    const entries = world.recorder!.getEntries();
    expect(entries).toHaveLength(expectedSeq);
    expect(entries[entries.length - 1].seq).toBe(expectedSeq);
  }
);

Then(
  'the last recorded entry should have seq {int}',
  function (world: RecorderWorld, expectedSeq: number) {
    const entries = world.recorder!.getEntries();
    expect(entries[entries.length - 1].seq).toBe(expectedSeq);
  }
);

Then(
  'the recorded entries should have seq {string}',
  function (world: RecorderWorld, seqStr: string) {
    const expectedSeqs = seqStr.split(',').map((s: string) => parseInt(s.trim(), 10));
    const entries = world.recorder!.getEntries();
    expect(entries).toHaveLength(expectedSeqs.length);
    expectedSeqs.forEach((expectedSeq: number, idx: number) => {
      expect(entries[idx].seq).toBe(expectedSeq);
    });
  }
);

Then(
  'getEntries should return {int} entries',
  function (world: RecorderWorld, expectedCount: number) {
    const entries = world.recorder!.getEntries();
    expect(entries).toHaveLength(expectedCount);
  }
);

Then(
  'the entries in order should be from actors {string}',
  function (world: RecorderWorld, actorsStr: string) {
    const expectedActors = actorsStr.split(',').map((a: string) => a.trim());
    const entries = world.recorder!.getEntries();
    expect(entries).toHaveLength(expectedActors.length);

    entries.forEach((entry: CombatLogEntry, idx: number) => {
      const entryWithId = entry as any;
      expect(entryWithId.actorId).toBe(expectedActors[idx]);
    });
  }
);

Then(
  'entry {int} should have seq {int}',
  function (world: RecorderWorld, entryIdx: number, expectedSeq: number) {
    const entries = world.recorder!.getEntries();
    expect(entries[entryIdx].seq).toBe(expectedSeq);
  }
);

Then('the entry should have fields: {string}', function (world: RecorderWorld, fieldsStr: string) {
  const expectedFields = fieldsStr.split(',').map((f: string) => f.trim());
  const entries = world.recorder!.getEntries();
  expect(entries.length).toBeGreaterThan(0);

  const entry = entries[entries.length - 1] as any;
  expectedFields.forEach((field: string) => {
    expect(entry).toHaveProperty(field);
  });
});

Then('the entry should serialize to valid JSON', function (world: RecorderWorld) {
  const entries = world.recorder!.getEntries();
  expect(entries.length).toBeGreaterThan(0);

  const entry = entries[entries.length - 1];
  const jsonStr = JSON.stringify(entry);
  expect(jsonStr).toBeDefined();
  expect(typeof jsonStr).toBe('string');

  // Should be parseable
  const parsed = JSON.parse(jsonStr);
  expect(parsed).toBeDefined();
});

Then(
  'all entries should be plain objects with no class instances',
  function (world: RecorderWorld) {
    const entries = world.recorder!.getEntries();
    expect(entries.length).toBeGreaterThan(0);

    entries.forEach((entry: CombatLogEntry) => {
      expect(isPlainObject(entry)).toBe(true);

      // Check nested objects are also plain
      const entryAny = entry as any;
      Object.values(entryAny).forEach((value: any) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          expect(isPlainObject(value)).toBe(true);
        }
      });
    });
  }
);

Then('entries should have no circular references', function (world: RecorderWorld) {
  const entries = world.recorder!.getEntries();
  expect(entries.length).toBeGreaterThan(0);

  entries.forEach((entry: CombatLogEntry) => {
    expect(hasCircularReference(entry)).toBe(false);
  });
});

Then(
  'round number {int} should be derivable from entries',
  function (world: RecorderWorld, roundNum: number) {
    const entries = world.recorder!.getEntries();
    const roundEndCount = entries.filter((e: CombatLogEntry) => e.type === 'round-end').length;
    expect(roundEndCount).toBeGreaterThanOrEqual(roundNum);
  }
);

Then(
  'turn number {int} should be derivable from entries',
  function (world: RecorderWorld, turnNum: number) {
    const entries = world.recorder!.getEntries();
    const turnStartCount = entries.filter((e: CombatLogEntry) => e.type === 'turn-start').length;
    expect(turnStartCount).toBeGreaterThanOrEqual(turnNum);
  }
);
