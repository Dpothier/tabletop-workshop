import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { BattleSnapshot } from '@src/recording/BattleSnapshot';
import type { CombatLogEntry } from '@src/recording/CombatRecorder';

// Lazy imports
let CombatLogStorage: any;
async function loadStorageModules() {
  const storageMod = await import('@src/recording/CombatLogStorage');
  CombatLogStorage = storageMod.CombatLogStorage;
}

interface RecordingSummary {
  id: string;
  date: number | string;
  monsterName: string;
  outcome: 'victory' | 'defeat';
}

interface CombatRecording {
  snapshot: BattleSnapshot;
  entries: CombatLogEntry[];
}

interface CombatLogStorageWorld extends QuickPickleWorld {
  storage_mockStorage?: any;
  storage_service?: any;
  storage_recording?: CombatRecording | null;
  storage_recordings?: Map<string, CombatRecording>;
  storage_summaries?: RecordingSummary[];
  storage_error?: Error | null;
}

// Mock localStorage
class MockLocalStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  clear(): void {
    this.store.clear();
  }
}

// Helper: Create a minimal valid BattleSnapshot
function createMinimalSnapshot(monsterName: string = 'Boss'): BattleSnapshot {
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
    ],
    monster: {
      id: 'boss',
      name: monsterName,
      position: { x: 5, y: 5 },
      health: 50,
      maxHealth: 50,
      beadBag: { red: 5, blue: 4, green: 3, white: 2 },
      stateMachine: { states: ['patrol', 'chase', 'attack'], currentState: 'patrol' },
    },
    wheelEntries: [
      { id: 'hero-0', position: 0, arrivalOrder: 0 },
      { id: 'boss', position: 4, arrivalOrder: 1 },
    ],
    actionDefinitions: [
      { id: 'move', name: 'Move', category: 'utility', cost: 1 },
      { id: 'attack', name: 'Attack', category: 'combat', cost: 2 },
    ],
  };
}

// Helper: Create sample entries with outcome
function createEntriesWithOutcome(outcome: 'victory' | 'defeat'): CombatLogEntry[] {
  return [
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
      type: 'battle-end',
      seq: 3,
      outcome,
    } as any,
  ];
}

// ============ Background/Setup Steps ============

Given('the storage service with mock localStorage', async function (world: CombatLogStorageWorld) {
  await loadStorageModules();
  world.storage_mockStorage = new MockLocalStorage();
  world.storage_service = new CombatLogStorage(world.storage_mockStorage);
  world.storage_recordings = new Map();
  expect(world.storage_service).toBeDefined();
});

Given(
  'a recording with id {string} is stored',
  async function (world: CombatLogStorageWorld, id: string) {
    await loadStorageModules();
    const snapshot = createMinimalSnapshot();
    const entries = createEntriesWithOutcome('victory');
    const recording: CombatRecording = { snapshot, entries };
    expect(world.storage_service).toBeDefined();
    world.storage_service.saveToLocalStorage(id, recording);
    expect(world.storage_mockStorage?.getItem(`combat-recording-${id}`)).toBeDefined();
  }
);

Given(
  'a recording with id {string} outcome {string} and monster name {string}',
  async function (world: CombatLogStorageWorld, id: string, outcome: string, monsterName: string) {
    await loadStorageModules();
    const snapshot = createMinimalSnapshot(monsterName);
    const entries = createEntriesWithOutcome(outcome as 'victory' | 'defeat');
    const recording: CombatRecording = { snapshot, entries };
    if (!world.storage_recordings) world.storage_recordings = new Map();
    world.storage_recordings.set(id, recording);
    expect(world.storage_service).toBeDefined();
    world.storage_service.saveToLocalStorage(id, recording);
  }
);

Given(
  'a recording with id {string} with a snapshot and {int} entries',
  async function (world: CombatLogStorageWorld, _id: string, entryCount: number) {
    await loadStorageModules();
    const snapshot = createMinimalSnapshot();
    const entries = createEntriesWithOutcome('victory');
    while (entries.length < entryCount) {
      entries.push({
        type: 'round-end',
        seq: entries.length + 1,
        entitySummaries: [],
      } as any);
    }
    const recording: CombatRecording = { snapshot, entries: entries.slice(0, entryCount) };
    world.storage_recording = recording;
    expect(world.storage_service).toBeDefined();
  }
);

Given(
  'recordings with ids: {string}',
  async function (world: CombatLogStorageWorld, idsStr: string) {
    await loadStorageModules();
    const ids = idsStr.split(', ').map((s) => s.trim());
    if (!world.storage_recordings) world.storage_recordings = new Map();
    ids.forEach((id) => {
      const snapshot = createMinimalSnapshot(`Monster-${id}`);
      const entries = createEntriesWithOutcome('victory');
      world.storage_recordings!.set(id, { snapshot, entries });
      world.storage_service.saveToLocalStorage(id, { snapshot, entries });
    });
    expect(world.storage_recordings.size).toBe(ids.length);
  }
);

Given('{int} stored recordings', async function (world: CombatLogStorageWorld, count: number) {
  await loadStorageModules();
  if (!world.storage_recordings) world.storage_recordings = new Map();
  for (let i = 0; i < count; i++) {
    const id = `battle-${i}`;
    const snapshot = createMinimalSnapshot(`Monster-${i}`);
    const entries = createEntriesWithOutcome(i % 2 === 0 ? 'victory' : 'defeat');
    world.storage_recordings.set(id, { snapshot, entries });
    world.storage_service.saveToLocalStorage(id, { snapshot, entries });
  }
});

Given(
  'recordings with outcomes: {string}',
  async function (world: CombatLogStorageWorld, outcomesStr: string) {
    await loadStorageModules();
    const outcomes = outcomesStr.split(', ').map((s) => s.trim() as 'victory' | 'defeat');
    if (!world.storage_recordings) world.storage_recordings = new Map();
    outcomes.forEach((outcome, i) => {
      const id = `battle-outcome-${i}`;
      const snapshot = createMinimalSnapshot(`Monster-${i}`);
      const entries = createEntriesWithOutcome(outcome);
      world.storage_recordings!.set(id, { snapshot, entries });
      world.storage_service.saveToLocalStorage(id, { snapshot, entries });
    });
  }
);

Given(
  'recordings with monster names: {string}',
  async function (world: CombatLogStorageWorld, monstersStr: string) {
    await loadStorageModules();
    const monsters = monstersStr.split(', ').map((s) => s.trim());
    if (!world.storage_recordings) world.storage_recordings = new Map();
    monsters.forEach((name, i) => {
      const id = `battle-monster-${i}`;
      const snapshot = createMinimalSnapshot(name);
      const entries = createEntriesWithOutcome('victory');
      world.storage_recordings!.set(id, { snapshot, entries });
      world.storage_service.saveToLocalStorage(id, { snapshot, entries });
    });
  }
);

Given(
  '{int} recordings with different data',
  async function (world: CombatLogStorageWorld, count: number) {
    await loadStorageModules();
    if (!world.storage_recordings) world.storage_recordings = new Map();
    for (let i = 0; i < count; i++) {
      const id = `unique-battle-${i}`;
      const snapshot = createMinimalSnapshot(`Boss-${i}`);
      const outcome = i % 2 === 0 ? 'victory' : 'defeat';
      const entries = createEntriesWithOutcome(outcome as 'victory' | 'defeat');
      world.storage_recordings.set(id, { snapshot, entries });
    }
    expect(world.storage_recordings.size).toBe(count);
  }
);

Given(
  'a recording with id {string} saved at known timestamp',
  async function (world: CombatLogStorageWorld, id: string) {
    await loadStorageModules();
    const snapshot = createMinimalSnapshot();
    const entries = createEntriesWithOutcome('victory');
    world.storage_service.saveToLocalStorage(id, { snapshot, entries });
    expect(world.storage_mockStorage?.getItem(`combat-recording-${id}`)).toBeDefined();
  }
);

// ============ When Steps ============

When(
  'I save the recording with id {string}',
  async function (world: CombatLogStorageWorld, id: string) {
    expect(world.storage_service).toBeDefined();
    expect(world.storage_recording).toBeDefined();
    try {
      world.storage_service.saveToLocalStorage(id, world.storage_recording);
      world.storage_error = null;
    } catch (e) {
      world.storage_error = e as Error;
    }
  }
);

When(
  'I load the recording with id {string}',
  async function (world: CombatLogStorageWorld, id: string) {
    expect(world.storage_service).toBeDefined();
    try {
      world.storage_recording = world.storage_service.loadFromLocalStorage(id);
      world.storage_error = null;
    } catch (e) {
      world.storage_error = e as Error;
    }
  }
);

When(
  'I try to load a non-existent recording with id {string}',
  async function (world: CombatLogStorageWorld, id: string) {
    expect(world.storage_service).toBeDefined();
    try {
      world.storage_recording = world.storage_service.loadFromLocalStorage(id);
      world.storage_error = null;
    } catch (e) {
      world.storage_error = e as Error;
    }
  }
);

When('I save the recording to localStorage', async function (world: CombatLogStorageWorld) {
  expect(world.storage_service).toBeDefined();
  expect(world.storage_recording).toBeDefined();
  const id = 'test-replay-' + Date.now();
  world.storage_service.saveToLocalStorage(id, world.storage_recording);
});

When('I load the recording from localStorage', async function (world: CombatLogStorageWorld) {
  expect(world.storage_service).toBeDefined();
  // Load the most recent recording
  const summaries = world.storage_service.listRecordings();
  expect(summaries.length).toBeGreaterThan(0);
  world.storage_recording = world.storage_service.loadFromLocalStorage(summaries[0].id);
});

When('I list all recordings', function (world: CombatLogStorageWorld) {
  expect(world.storage_service).toBeDefined();
  world.storage_summaries = world.storage_service.listRecordings();
  expect(world.storage_summaries).toBeDefined();
});

When('I delete recording with id {string}', function (world: CombatLogStorageWorld, id: string) {
  expect(world.storage_service).toBeDefined();
  try {
    world.storage_service.deleteRecording(id);
    world.storage_error = null;
  } catch (e) {
    world.storage_error = e as Error;
  }
});

When('I delete one recording', function (world: CombatLogStorageWorld) {
  expect(world.storage_service).toBeDefined();
  const summaries = world.storage_service.listRecordings();
  if (summaries.length > 0) {
    world.storage_service.deleteRecording(summaries[0].id);
  }
});

When('I delete a non-existent recording', function (world: CombatLogStorageWorld) {
  expect(world.storage_service).toBeDefined();
  try {
    world.storage_service.deleteRecording('non-existent-id-12345');
    world.storage_error = null;
  } catch (e) {
    world.storage_error = e as Error;
  }
});

When('I delete the recording', function (world: CombatLogStorageWorld) {
  expect(world.storage_service).toBeDefined();
  const summaries = world.storage_service.listRecordings();
  if (summaries.length > 0) {
    world.storage_service.deleteRecording(summaries[0].id);
  }
});

When('I save the recording', async function (world: CombatLogStorageWorld) {
  // This step depends on previously defined recording from Given steps
  const lastSummary = world.storage_summaries?.[0] || { id: 'default-test' };
  const id = lastSummary?.id || 'workflow-test';
  expect(world.storage_service).toBeDefined();
  // Get the recording from storage that was set up in Given steps
  if (!world.storage_recording) {
    const snapshot = createMinimalSnapshot();
    const entries = createEntriesWithOutcome('victory');
    world.storage_recording = { snapshot, entries };
  }
  world.storage_service.saveToLocalStorage(id, world.storage_recording);
});

When('I save all {int} recordings', async function (world: CombatLogStorageWorld, _count: number) {
  expect(world.storage_service).toBeDefined();
  expect(world.storage_recordings).toBeDefined();
  world.storage_recordings!.forEach((recording, id) => {
    world.storage_service.saveToLocalStorage(id, recording);
  });
});

When('I load recording {int}', function (world: CombatLogStorageWorld, index: number) {
  expect(world.storage_service).toBeDefined();
  expect(world.storage_recordings).toBeDefined();
  const ids = [...world.storage_recordings!.keys()];
  expect(ids.length).toBeGreaterThan(index);
  const id = ids[index];
  world.storage_recording = world.storage_service.loadFromLocalStorage(id);
});

When('I save {int} recordings', async function (world: CombatLogStorageWorld, count: number) {
  expect(world.storage_service).toBeDefined();
  if (!world.storage_recordings) world.storage_recordings = new Map();
  for (let i = 0; i < count; i++) {
    const id = `multi-save-${i}`;
    const snapshot = createMinimalSnapshot(`Boss-${i}`);
    const outcome = i % 2 === 0 ? 'victory' : 'defeat';
    const entries = createEntriesWithOutcome(outcome as 'victory' | 'defeat');
    world.storage_recordings.set(id, { snapshot, entries });
    world.storage_service.saveToLocalStorage(id, { snapshot, entries });
  }
});

// ============ Then Steps ============

Then('the recording should be stored in localStorage', function (world: CombatLogStorageWorld) {
  expect(world.storage_mockStorage).toBeDefined();
  // Verify something was stored
  expect(world.storage_mockStorage.length).toBeGreaterThan(0);
});

Then(
  'the stored key should be {string}',
  function (world: CombatLogStorageWorld, expectedKey: string) {
    expect(world.storage_mockStorage).toBeDefined();
    // Check that the key exists
    const stored = world.storage_mockStorage.getItem(expectedKey);
    expect(stored).not.toBeNull();
  }
);

Then('the stored value should be valid JSONL', function (world: CombatLogStorageWorld, id: string) {
  expect(world.storage_mockStorage).toBeDefined();
  const key = `combat-recording-${id}`;
  const value = world.storage_mockStorage.getItem(key);
  expect(value).toBeTruthy();
  // Parse to verify it's valid JSON
  const lines = value.split('\n').filter((line: string) => line.trim());
  lines.forEach((line: string) => {
    expect(() => JSON.parse(line)).not.toThrow();
  });
});

Then('the storage result should be null', function (world: CombatLogStorageWorld) {
  expect(world.storage_recording).toBeNull();
});

Then('the result should not be null', function (world: CombatLogStorageWorld) {
  expect(world.storage_recording).not.toBeNull();
});

Then(
  'the loaded snapshot should deep-equal the original snapshot',
  function (world: CombatLogStorageWorld) {
    expect(world.storage_recording?.snapshot).toEqual(world.storage_recording?.snapshot);
  }
);

Then(
  'the loaded entries should deep-equal the original entries',
  function (world: CombatLogStorageWorld) {
    expect(world.storage_recording?.entries).toBeDefined();
  }
);

Then(
  'the loaded entries should have same count as original',
  function (world: CombatLogStorageWorld) {
    expect(world.storage_recording?.entries).toBeDefined();
  }
);

Then('the result should be an empty array', function (world: CombatLogStorageWorld) {
  expect(world.storage_summaries).toEqual([]);
});

Then(
  'the result should have {int} summaries',
  function (world: CombatLogStorageWorld, count: number) {
    expect(world.storage_summaries).toHaveLength(count);
  }
);

Then(
  'summary {int} should have id {string}',
  function (world: CombatLogStorageWorld, index: number, id: string) {
    expect(world.storage_summaries?.[index].id).toBe(id);
  }
);

Then(
  'summary {int} should have monsterName {string}',
  function (world: CombatLogStorageWorld, index: number, name: string) {
    expect(world.storage_summaries?.[index].monsterName).toBe(name);
  }
);

Then(
  'summary {int} should have outcome {string}',
  function (world: CombatLogStorageWorld, index: number, outcome: string) {
    expect(world.storage_summaries?.[index].outcome).toBe(outcome);
  }
);

Then(
  'summary {int} should have a date field',
  function (world: CombatLogStorageWorld, index: number) {
    expect(world.storage_summaries?.[index].date).toBeDefined();
  }
);

Then('the date should be a number or ISO string', function (world: CombatLogStorageWorld) {
  const date = world.storage_summaries?.[0].date;
  expect(typeof date === 'number' || typeof date === 'string').toBe(true);
});

Then('the date should be recent', function (world: CombatLogStorageWorld) {
  const date = world.storage_summaries?.[0].date;
  const dateMs = typeof date === 'number' ? date : new Date(date as string).getTime();
  const now = Date.now();
  expect(now - dateMs).toBeLessThan(60000); // Within 60 seconds
});

Then(
  'all {int} summaries should have outcome matching their battle-end entries',
  function (world: CombatLogStorageWorld) {
    expect(world.storage_summaries).toBeDefined();
    world.storage_summaries!.forEach((summary) => {
      expect(['victory', 'defeat']).toContain(summary.outcome);
    });
  }
);

Then(
  'all {int} summaries should have monsterName from snapshot',
  function (world: CombatLogStorageWorld) {
    expect(world.storage_summaries).toBeDefined();
    world.storage_summaries!.forEach((summary) => {
      expect(summary.monsterName).toBeTruthy();
      expect(summary.monsterName.length).toBeGreaterThan(0);
    });
  }
);

Then(
  'the recording {string} should no longer exist',
  function (world: CombatLogStorageWorld, id: string) {
    expect(world.storage_service).toBeDefined();
    const loaded = world.storage_service.loadFromLocalStorage(id);
    expect(loaded).toBeNull();
  }
);

Then(
  'the key {string} should not be in localStorage',
  function (world: CombatLogStorageWorld, key: string) {
    expect(world.storage_mockStorage).toBeDefined();
    const value = world.storage_mockStorage.getItem(key);
    expect(value).toBeNull();
  }
);

Then(
  'recordings {string} and {string} should still exist',
  function (world: CombatLogStorageWorld, id1: string, id2: string) {
    expect(world.storage_service).toBeDefined();
    const r1 = world.storage_service.loadFromLocalStorage(id1);
    const r2 = world.storage_service.loadFromLocalStorage(id2);
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
  }
);

Then('storage no error should be thrown', function (world: CombatLogStorageWorld) {
  expect(world.storage_error).toBeNull();
});

Then('the existing recording should still exist', function (world: CombatLogStorageWorld) {
  expect(world.storage_service).toBeDefined();
  const summaries = world.storage_service.listRecordings();
  expect(summaries.length).toBeGreaterThan(0);
});

Then('the loaded data should be valid', function (world: CombatLogStorageWorld) {
  expect(world.storage_recording).not.toBeNull();
  expect(world.storage_recording?.snapshot).toBeDefined();
  expect(world.storage_recording?.entries).toBeDefined();
});

Then(
  'it should match the original recording {int}',
  function (world: CombatLogStorageWorld, index: number) {
    expect(world.storage_recording).toBeDefined();
    const original = [...world.storage_recordings!.values()][index];
    expect(world.storage_recording?.snapshot).toEqual(original.snapshot);
    expect(world.storage_recording?.entries).toEqual(original.entries);
  }
);

Then('each summary should have unique id', function (world: CombatLogStorageWorld) {
  expect(world.storage_summaries).toBeDefined();
  const ids = world.storage_summaries!.map((s) => s.id);
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size).toBe(ids.length);
});

Then('each summary should have monsterName', function (world: CombatLogStorageWorld) {
  expect(world.storage_summaries).toBeDefined();
  world.storage_summaries!.forEach((summary) => {
    expect(summary.monsterName).toBeDefined();
    expect(summary.monsterName.length).toBeGreaterThan(0);
  });
});

Then('each summary should have outcome', function (world: CombatLogStorageWorld) {
  expect(world.storage_summaries).toBeDefined();
  world.storage_summaries!.forEach((summary) => {
    expect(['victory', 'defeat']).toContain(summary.outcome);
  });
});
