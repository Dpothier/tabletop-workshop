import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { BattleSnapshot } from '@src/recording/BattleSnapshot';
import type { CombatLogEntry } from '@src/recording/CombatRecorder';

// Lazy import - will fail at test runtime, not at module load time
let CombatLogSerializer: any;
async function loadSerializer() {
  const mod = await import('@src/recording/CombatLogSerializer');
  CombatLogSerializer = mod.CombatLogSerializer;
}

interface CombatLogSerializerWorld extends QuickPickleWorld {
  serializer_snapshot?: BattleSnapshot;
  serializer_entries?: CombatLogEntry[];
  serializer_jsonl?: string;
  serializer_parsed?: { snapshot: BattleSnapshot; entries: CombatLogEntry[] } | null;
  serializer_error?: Error | null;
  serializer_roundTripped?: { snapshot: BattleSnapshot; entries: CombatLogEntry[] } | null;
}

// Helper: Create a minimal valid BattleSnapshot
function createMinimalSnapshot(): BattleSnapshot {
  return {
    arena: { name: 'Test', width: 9, height: 9 },
    characters: [
      {
        id: 'hero-0',
        name: 'Hero 0',
        position: { x: 2, y: 3 },
        maxHealth: 20,
        currentHealth: 20,
        equipment: {},
        availableActionIds: ['move', 'attack'],
        beadHand: { red: 2, blue: 1, green: 0, white: 1 },
        beadPool: { red: 3, blue: 3, green: 3, white: 3 },
        beadDiscard: { red: 0, blue: 0, green: 0, white: 0 },
      },
      {
        id: 'hero-1',
        name: 'Hero 1',
        position: { x: 4, y: 3 },
        maxHealth: 18,
        currentHealth: 18,
        equipment: {},
        availableActionIds: ['move', 'run'],
        beadHand: { red: 1, blue: 2, green: 1, white: 0 },
        beadPool: { red: 3, blue: 3, green: 3, white: 3 },
        beadDiscard: { red: 0, blue: 0, green: 0, white: 0 },
      },
    ],
    monster: {
      id: 'boss',
      name: 'Boss',
      position: { x: 5, y: 5 },
      health: 50,
      maxHealth: 50,
      beadBag: { red: 5, blue: 4, green: 3, white: 2 },
      stateMachine: { states: ['patrol', 'chase', 'attack'], currentState: 'patrol' },
    },
    wheelEntries: [
      { id: 'hero-0', position: 0, arrivalOrder: 0 },
      { id: 'hero-1', position: 2, arrivalOrder: 1 },
      { id: 'boss', position: 4, arrivalOrder: 2 },
    ],
    actionDefinitions: [
      { id: 'move', name: 'Move', category: 'utility', cost: 1 },
      { id: 'attack', name: 'Attack', category: 'combat', cost: 2 },
    ],
  };
}

// Helper: Create sample combat log entries
function createSampleEntries(count: number = 3): CombatLogEntry[] {
  const entries: CombatLogEntry[] = [];
  let seq = 1;

  // Add turn-start entry
  if (count >= 1) {
    entries.push({
      type: 'turn-start',
      seq: seq++,
      actorId: 'hero-0',
      actorName: 'Hero 0',
      actorType: 'player',
      wheelPosition: 0,
    } as any);
  }

  // Add action-selected entry
  if (count >= 2) {
    entries.push({
      type: 'action-selected',
      seq: seq++,
      actorId: 'hero-0',
      actorName: 'Hero 0',
      actionId: 'attack',
      actionName: 'Attack',
      modifiers: [],
      beadCost: 2,
    } as any);
  }

  // Add bead-spend entry
  if (count >= 3) {
    entries.push({
      type: 'bead-spend',
      seq: seq++,
      entityId: 'hero-0',
      entityName: 'Hero 0',
      color: 'red',
      reason: 'action-cost',
      handAfter: { red: 1, blue: 1, green: 0, white: 1 },
    } as any);
  }

  // Add battle-end entry
  if (count >= 4) {
    entries.push({
      type: 'battle-end',
      seq: seq++,
      outcome: 'victory',
    } as any);
  }

  // Add more entries as needed
  while (entries.length < count) {
    entries.push({
      type: 'round-end',
      seq: seq++,
      entitySummaries: [
        {
          id: 'hero-0',
          name: 'Hero 0',
          hp: 20,
          maxHp: 20,
          handCounts: { red: 1, blue: 1, green: 0, white: 1 },
        },
      ],
    } as any);
  }

  return entries;
}

// ============ Background/Setup Steps ============

Given(
  'a serializer with a battle snapshot and entries',
  async function (world: CombatLogSerializerWorld) {
    await loadSerializer();
    world.serializer_snapshot = createMinimalSnapshot();
    world.serializer_entries = createSampleEntries(3);
    expect(world.serializer_snapshot).toBeDefined();
    expect(world.serializer_entries).toHaveLength(3);
  }
);

Given(
  'a serializer with a battle snapshot and {int} entries',
  async function (world: CombatLogSerializerWorld, count: number) {
    await loadSerializer();
    world.serializer_snapshot = createMinimalSnapshot();
    world.serializer_entries = createSampleEntries(count);
    expect(world.serializer_entries).toHaveLength(count);
  }
);

Given(
  'a serializer with a serialized JSONL battle',
  async function (world: CombatLogSerializerWorld) {
    await loadSerializer();
    const snapshot = createMinimalSnapshot();
    const entries = createSampleEntries(3);
    world.serializer_jsonl = CombatLogSerializer.toJSONL(snapshot, entries);
    expect(world.serializer_jsonl).toBeDefined();
  }
);

Given(
  'a serializer with a serialized JSONL with mixed entry types',
  async function (world: CombatLogSerializerWorld) {
    await loadSerializer();
    const snapshot = createMinimalSnapshot();
    const entries: CombatLogEntry[] = [
      {
        type: 'turn-start',
        seq: 1,
        actorId: 'hero-0',
        actorName: 'Hero 0',
        actorType: 'player',
        wheelPosition: 0,
      } as any,
      {
        type: 'action-selected',
        seq: 2,
        actorId: 'hero-0',
        actorName: 'Hero 0',
        actionId: 'attack',
        actionName: 'Attack',
        modifiers: [],
        beadCost: 2,
      } as any,
      {
        type: 'bead-spend',
        seq: 3,
        entityId: 'hero-0',
        entityName: 'Hero 0',
        color: 'red',
        reason: 'action-cost',
        handAfter: { red: 1, blue: 1, green: 0, white: 1 },
      } as any,
      {
        type: 'battle-end',
        seq: 4,
        outcome: 'victory',
      } as any,
    ];
    world.serializer_jsonl = CombatLogSerializer.toJSONL(snapshot, entries);
    expect(world.serializer_jsonl).toBeDefined();
  }
);

Given(
  'a serializer with entries containing nested objects',
  async function (world: CombatLogSerializerWorld) {
    await loadSerializer();
    const snapshot = createMinimalSnapshot();
    const entries: CombatLogEntry[] = [
      {
        type: 'bead-draw',
        seq: 1,
        entityId: 'hero-0',
        entityName: 'Hero 0',
        colors: ['red', 'blue'],
        source: 'rest',
        handAfter: { red: 3, blue: 2, green: 1, white: 0 },
      } as any,
      {
        type: 'state-change',
        seq: 2,
        entityId: 'hero-0',
        entityName: 'Hero 0',
        changeType: 'buff-add',
        details: { buffType: 'strength', value: 2 },
      } as any,
    ];
    world.serializer_snapshot = snapshot;
    world.serializer_entries = entries;
    expect(world.serializer_entries).toHaveLength(2);
  }
);

Given(
  'a serializer with JSONL containing empty lines between entries',
  async function (world: CombatLogSerializerWorld) {
    await loadSerializer();
    const snapshot = createMinimalSnapshot();
    const entries = createSampleEntries(3);
    const baseJSONL = CombatLogSerializer.toJSONL(snapshot, entries);
    // Add empty lines
    world.serializer_jsonl = baseJSONL
      .split('\n')
      .map((line: string, i: number) => (i === 1 ? '\n' + line : line))
      .join('\n');
    expect(world.serializer_jsonl).toBeDefined();
  }
);

Given(
  'a serializer with JSONL ending with multiple newlines',
  async function (world: CombatLogSerializerWorld) {
    await loadSerializer();
    const snapshot = createMinimalSnapshot();
    const entries = createSampleEntries(2);
    world.serializer_jsonl = CombatLogSerializer.toJSONL(snapshot, entries) + '\n\n\n';
    expect(world.serializer_jsonl).toBeDefined();
  }
);

Given(
  'a serializer with JSONL starting with regular entry',
  async function (world: CombatLogSerializerWorld) {
    await loadSerializer();
    // Create JSONL with entry instead of snapshot
    const entries = createSampleEntries(1);
    world.serializer_jsonl = JSON.stringify(entries[0]) + '\n';
    expect(world.serializer_jsonl).toBeDefined();
  }
);

Given(
  'a serializer with JSONL containing malformed JSON',
  async function (world: CombatLogSerializerWorld) {
    await loadSerializer();
    const snapshot = createMinimalSnapshot();
    const goodLine = JSON.stringify({ type: 'snapshot', version: 1, ...snapshot });
    world.serializer_jsonl = goodLine + '\n' + '{invalid json}\n';
    expect(world.serializer_jsonl).toBeDefined();
  }
);

Given(
  'a serializer with JSONL snapshot having version {int}',
  async function (world: CombatLogSerializerWorld, version: number) {
    await loadSerializer();
    const snapshot = createMinimalSnapshot();
    world.serializer_jsonl = JSON.stringify({ type: 'snapshot', version, ...snapshot }) + '\n';
    expect(world.serializer_jsonl).toBeDefined();
  }
);

// ============ When Steps ============

When('I serialize to JSONL', async function (world: CombatLogSerializerWorld) {
  await loadSerializer();
  expect(world.serializer_snapshot).toBeDefined();
  expect(world.serializer_entries).toBeDefined();
  world.serializer_jsonl = CombatLogSerializer.toJSONL(
    world.serializer_snapshot,
    world.serializer_entries
  );
  expect(world.serializer_jsonl).toBeDefined();
});

When('I deserialize the JSONL', async function (world: CombatLogSerializerWorld) {
  await loadSerializer();
  expect(world.serializer_jsonl).toBeDefined();
  try {
    world.serializer_parsed = CombatLogSerializer.fromJSONL(world.serializer_jsonl);
    world.serializer_error = null;
  } catch (e) {
    world.serializer_error = e as Error;
  }
  world.serializer_roundTripped = world.serializer_parsed;
});

When('I try to deserialize the JSONL', async function (world: CombatLogSerializerWorld) {
  await loadSerializer();
  expect(world.serializer_jsonl).toBeDefined();
  try {
    world.serializer_parsed = CombatLogSerializer.fromJSONL(world.serializer_jsonl);
    world.serializer_error = null;
  } catch (e) {
    world.serializer_error = e as Error;
  }
});

When('I round-trip serialize and deserialize', async function (world: CombatLogSerializerWorld) {
  await loadSerializer();
  expect(world.serializer_snapshot).toBeDefined();
  expect(world.serializer_entries).toBeDefined();
  world.serializer_jsonl = CombatLogSerializer.toJSONL(
    world.serializer_snapshot,
    world.serializer_entries
  );
  world.serializer_roundTripped = CombatLogSerializer.fromJSONL(world.serializer_jsonl);
  expect(world.serializer_roundTripped).toBeDefined();
});

// ============ Then Steps (Snapshot Lines) ============

Then('the first line should be a snapshot JSON object', function (world: CombatLogSerializerWorld) {
  expect(world.serializer_jsonl).toBeDefined();
  const lines = world.serializer_jsonl!.split('\n').filter((line: string) => line.trim());
  expect(lines.length).toBeGreaterThan(0);
  const firstLine = JSON.parse(lines[0]);
  expect(firstLine).toBeInstanceOf(Object);
  expect(firstLine.type).toBe('snapshot');
});

Then(
  'the snapshot line should have type {string}',
  function (world: CombatLogSerializerWorld, type: string) {
    expect(world.serializer_jsonl).toBeDefined();
    const lines = world.serializer_jsonl!.split('\n').filter((line: string) => line.trim());
    const firstLine = JSON.parse(lines[0]);
    expect(firstLine.type).toBe(type);
  }
);

Then(
  'the snapshot line should have version {int}',
  function (world: CombatLogSerializerWorld, version: number) {
    expect(world.serializer_jsonl).toBeDefined();
    const lines = world.serializer_jsonl!.split('\n').filter((line: string) => line.trim());
    const firstLine = JSON.parse(lines[0]);
    expect(firstLine.version).toBe(version);
  }
);

Then(
  'the snapshot line should contain arena name {string}',
  function (world: CombatLogSerializerWorld, name: string) {
    expect(world.serializer_jsonl).toBeDefined();
    const lines = world.serializer_jsonl!.split('\n').filter((line: string) => line.trim());
    const firstLine = JSON.parse(lines[0]);
    expect(firstLine.arena?.name).toBe(name);
  }
);

// ============ Then Steps (Line Count) ============

Then(
  'the output should have {int} total lines',
  function (world: CombatLogSerializerWorld, count: number) {
    expect(world.serializer_jsonl).toBeDefined();
    const lines = world.serializer_jsonl!.split('\n').filter((line: string) => line.trim());
    expect(lines).toHaveLength(count);
  }
);

Then(
  'line {int} should be the snapshot',
  function (world: CombatLogSerializerWorld, lineNum: number) {
    expect(world.serializer_jsonl).toBeDefined();
    const lines = world.serializer_jsonl!.split('\n').filter((line: string) => line.trim());
    const line = JSON.parse(lines[lineNum - 1]);
    expect(line.type).toBe('snapshot');
  }
);

Then(
  'lines {int}-{int} should be combat log entries',
  function (world: CombatLogSerializerWorld, start: number, end: number) {
    expect(world.serializer_jsonl).toBeDefined();
    const lines = world.serializer_jsonl!.split('\n').filter((line: string) => line.trim());
    for (let i = start - 1; i < end; i++) {
      const line = JSON.parse(lines[i]);
      expect(['turn-start', 'action-selected', 'bead-spend', 'battle-end', 'round-end']).toContain(
        line.type
      );
    }
  }
);

Then('each entry line should be valid JSON', function (world: CombatLogSerializerWorld) {
  expect(world.serializer_jsonl).toBeDefined();
  const lines = world.serializer_jsonl!.split('\n').filter((line: string) => line.trim());
  expect(() => {
    lines.forEach((line: string) => JSON.parse(line));
  }).not.toThrow();
});

// ============ Then Steps (Parsing Results) ============

Then('the result should have a snapshot object', function (world: CombatLogSerializerWorld) {
  expect(world.serializer_parsed).toBeDefined();
  expect(world.serializer_parsed?.snapshot).toBeDefined();
  expect(typeof world.serializer_parsed?.snapshot).toBe('object');
});

Then(
  'the snapshot should have arena with name {string}',
  function (world: CombatLogSerializerWorld, name: string) {
    expect(world.serializer_parsed?.snapshot.arena.name).toBe(name);
  }
);

Then(
  'the snapshot should have {int} characters',
  function (world: CombatLogSerializerWorld, count: number) {
    expect(world.serializer_parsed?.snapshot.characters).toHaveLength(count);
  }
);

Then('the snapshot should have {int} monster', function (world: CombatLogSerializerWorld) {
  expect(world.serializer_parsed?.snapshot.monster).toBeDefined();
});

Then(
  'the result should have {int} entries',
  function (world: CombatLogSerializerWorld, count: number) {
    expect(world.serializer_parsed?.entries).toHaveLength(count);
  }
);

Then(
  'entry {int} should have type {string}',
  function (world: CombatLogSerializerWorld, index: number, type: string) {
    expect(world.serializer_parsed?.entries[index].type).toBe(type);
  }
);

Then(
  'parsed entry {int} should have seq {int}',
  function (world: CombatLogSerializerWorld, index: number, seq: number) {
    expect(world.serializer_parsed?.entries[index].seq).toBe(seq);
  }
);

Then(
  'entry {int} should have actorId {string}',
  function (world: CombatLogSerializerWorld, index: number, id: string) {
    const entry = world.serializer_parsed?.entries[index] as any;
    expect(entry.actorId).toBe(id);
  }
);

Then(
  'entry {int} should have actionId {string}',
  function (world: CombatLogSerializerWorld, index: number, id: string) {
    const entry = world.serializer_parsed?.entries[index] as any;
    expect(entry.actionId).toBe(id);
  }
);

Then(
  'entry {int} should have color {string}',
  function (world: CombatLogSerializerWorld, index: number, color: string) {
    const entry = world.serializer_parsed?.entries[index] as any;
    expect(entry.color).toBe(color);
  }
);

Then(
  'entry {int} should have outcome {string}',
  function (world: CombatLogSerializerWorld, index: number, outcome: string) {
    const entry = world.serializer_parsed?.entries[index] as any;
    expect(entry.outcome).toBe(outcome);
  }
);

// ============ Then Steps (Round-trip) ============

Then(
  'the round-tripped snapshot should deep-equal the original snapshot',
  function (world: CombatLogSerializerWorld) {
    expect(world.serializer_roundTripped?.snapshot).toEqual(world.serializer_snapshot);
  }
);

Then(
  'the round-tripped entries should have same count as original',
  function (world: CombatLogSerializerWorld) {
    expect(world.serializer_roundTripped?.entries).toHaveLength(
      world.serializer_entries?.length ?? 0
    );
  }
);

Then(
  'round-tripped entry {int} should deep-equal original entry {int}',
  function (world: CombatLogSerializerWorld, rtIdx: number, origIdx: number) {
    expect(world.serializer_roundTripped?.entries[rtIdx]).toEqual(
      world.serializer_entries?.[origIdx]
    );
  }
);

Then(
  'the round-tripped entries should preserve all nested field values',
  function (world: CombatLogSerializerWorld) {
    expect(world.serializer_roundTripped?.entries).toBeDefined();
    expect(world.serializer_entries).toBeDefined();
    world.serializer_roundTripped?.entries.forEach((entry, i) => {
      expect(entry).toEqual(world.serializer_entries![i]);
    });
  }
);

Then(
  'the round-tripped entries should have matching seq numbers',
  function (world: CombatLogSerializerWorld) {
    expect(world.serializer_roundTripped?.entries).toBeDefined();
    expect(world.serializer_entries).toBeDefined();
    world.serializer_roundTripped?.entries.forEach((entry, i) => {
      expect(entry.seq).toBe(world.serializer_entries![i].seq);
    });
  }
);

// ============ Then Steps (Whitespace Handling) ============

Then('empty lines should be skipped', function (world: CombatLogSerializerWorld) {
  expect(world.serializer_parsed?.entries).toBeDefined();
  // If empty lines were properly skipped, parse should succeed
  expect(world.serializer_error).toBeNull();
});

Then('all parsed entries should be valid', function (world: CombatLogSerializerWorld) {
  expect(world.serializer_parsed?.entries).toBeDefined();
  world.serializer_parsed?.entries.forEach((entry) => {
    expect(entry.type).toBeDefined();
    expect(entry.seq).toBeDefined();
  });
});

Then(
  'trailing newlines should not cause parsing errors',
  function (world: CombatLogSerializerWorld) {
    expect(world.serializer_error).toBeNull();
    expect(world.serializer_parsed?.entries).toBeDefined();
  }
);

// ============ Then Steps (Error Handling) ============

Then('a serializer error should be thrown', function (world: CombatLogSerializerWorld) {
  expect(world.serializer_error).not.toBeNull();
});

Then(
  'the error message should mention {string}',
  function (world: CombatLogSerializerWorld, keyword: string) {
    expect(world.serializer_error?.message).toContain(keyword);
  }
);

Then('the error should be descriptive', function (world: CombatLogSerializerWorld) {
  expect(world.serializer_error?.message).toBeTruthy();
  expect(world.serializer_error?.message.length).toBeGreaterThan(0);
});
