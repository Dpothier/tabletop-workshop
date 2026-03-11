import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { ActionWheel } from '@src/systems/ActionWheel';
import { Character } from '@src/entities/Character';
import { MonsterEntity } from '@src/entities/MonsterEntity';
import type { BattleState } from '@src/state/BattleState';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { BeadCounts } from '@src/types/Beads';
import type { StateConfig } from '@src/entities/MonsterEntity';

// Lazy import - will fail at test runtime, not at module load time
let createBattleSnapshot: any;
async function loadSnapshotModule() {
  const mod = await import('@src/recording/BattleSnapshot');
  createBattleSnapshot = mod.createBattleSnapshot;
}

interface BattleSnapshotWorld extends QuickPickleWorld {
  arena?: any;
  grid?: BattleGrid;
  wheel?: ActionWheel;
  snapshotCharacters?: Map<string, Character>;
  snapshotMonster?: MonsterEntity;
  snapshotActions?: ActionDefinition[];
  snapshot?: any;
}

function parseBeadCounts(str: string): BeadCounts {
  const counts: BeadCounts = { red: 0, blue: 0, green: 0, white: 0 };
  const parts = str.split(', ');
  parts.forEach((part) => {
    const [color, count] = part.split('=');
    counts[color.trim() as keyof BeadCounts] = parseInt(count, 10);
  });
  return counts;
}

function parseEquipment(str: string): Record<string, string> {
  const equip: Record<string, string> = {};
  const parts = str.split(', ');
  parts.forEach((part) => {
    const [slot, id] = part.split('=');
    equip[slot.trim()] = id.trim();
  });
  return equip;
}

// Background steps — all prefixed with "snapshot" to avoid collisions

Given(
  'a snapshot arena of {int}x{int} named {string}',
  function (world: BattleSnapshotWorld, width: number, height: number, name: string) {
    world.arena = { name, width, height };
  }
);

// NOTE: 'a battle grid of size {int}x{int}' is defined in battle-grid.steps.ts — reused via shared world

Given('a snapshot action wheel', function (world: BattleSnapshotWorld) {
  world.wheel = new ActionWheel();
});

Given(
  'a snapshot character {string} at position {int},{int} with {int} health',
  function (world: BattleSnapshotWorld, characterId: string, x: number, y: number, health: number) {
    if (!world.grid) throw new Error('BattleGrid not initialized');
    if (!world.snapshotCharacters) world.snapshotCharacters = new Map();

    const character = new Character(
      characterId,
      health,
      world.grid,
      { registerEntity: () => {} } as any,
      undefined,
      world.snapshotCharacters.size
    );
    character.setCharacterData(characterId, {} as any, undefined);
    world.grid.register(characterId, x, y);
    world.snapshotCharacters.set(characterId, character);
  }
);

Given(
  'a snapshot monster {string} at position {int},{int} with {int} health',
  function (world: BattleSnapshotWorld, monsterId: string, x: number, y: number, health: number) {
    if (!world.grid) throw new Error('BattleGrid not initialized');
    const monster = new MonsterEntity(monsterId, health, world.grid);
    world.grid.register(monsterId, x, y);
    world.snapshotMonster = monster;
  }
);

Given(
  'snapshot character {string} has equipment slot {string} with id {string}',
  function (world: BattleSnapshotWorld, characterId: string, slot: string, equipmentId: string) {
    const character = world.snapshotCharacters?.get(characterId);
    if (!character) throw new Error(`Character ${characterId} not found`);
    character.equip({
      id: equipmentId,
      name: equipmentId,
      slot: slot as any,
      actions: [],
      properties: {},
    } as any);
  }
);

Given(
  'snapshot character {string} has available actions: {string}',
  function (world: BattleSnapshotWorld, characterId: string, actionsStr: string) {
    const character = world.snapshotCharacters?.get(characterId);
    if (!character) throw new Error(`Character ${characterId} not found`);
    const actionIds = actionsStr.split(', ').map((a) => a.trim());
    character.setInnateActions(actionIds);
  }
);

Given(
  'snapshot character {string} has bead hand with counts: {string}',
  function (world: BattleSnapshotWorld, characterId: string, countsStr: string) {
    const character = world.snapshotCharacters?.get(characterId);
    if (!character) throw new Error(`Character ${characterId} not found`);
    const counts = parseBeadCounts(countsStr);
    character.initializeBeadHand();
    character.setBeadHand(counts);
  }
);

Given(
  'snapshot monster {string} has bead bag with counts: {string}',
  function (world: BattleSnapshotWorld, monsterId: string, countsStr: string) {
    if (!world.snapshotMonster || world.snapshotMonster.id !== monsterId) {
      throw new Error(`Monster ${monsterId} not initialized`);
    }
    const counts = parseBeadCounts(countsStr);
    world.snapshotMonster.initializeBeadBag(counts);
  }
);

Given(
  'snapshot monster {string} has state machine with states: {string}',
  function (world: BattleSnapshotWorld, monsterId: string, statesStr: string) {
    if (!world.snapshotMonster || world.snapshotMonster.id !== monsterId) {
      throw new Error(`Monster ${monsterId} not initialized`);
    }
    const stateNames = statesStr.split(', ').map((s) => s.trim());
    const stateConfigs: StateConfig[] = stateNames.map((name) => ({
      name,
      transitions: {
        red: stateNames[0],
        blue: stateNames[1] || stateNames[0],
        green: stateNames[2] || stateNames[0],
        white: stateNames[0],
      },
    }));
    world.snapshotMonster.initializeStateMachine(stateConfigs, stateNames[0]);
  }
);

Given(
  'the snapshot wheel has entries: {string}',
  function (world: BattleSnapshotWorld, entriesStr: string) {
    if (!world.wheel) throw new Error('ActionWheel not initialized');
    const entries = entriesStr.split(', ');
    entries.forEach((entry) => {
      const [id, posStr] = entry.split(' at position ');
      const position = parseInt(posStr, 10);
      world.wheel!.addEntity(id, position);
    });
  }
);

Given(
  'the following snapshot action definitions exist:',
  function (world: BattleSnapshotWorld, dataTable: any) {
    world.snapshotActions = [];
    dataTable.hashes().forEach((row: any) => {
      world.snapshotActions!.push({
        id: row.id,
        name: row.name,
        cost: { time: parseInt(row.cost, 10) },
        category: 'standard',
        parameters: [],
        effects: [],
      } as any);
    });
  }
);

// When: Create snapshot
When('I create a battle snapshot', async function (world: BattleSnapshotWorld) {
  await loadSnapshotModule();
  if (
    !world.arena ||
    !world.grid ||
    !world.wheel ||
    !world.snapshotCharacters ||
    !world.snapshotMonster
  ) {
    throw new Error('BattleState components not fully initialized');
  }

  const battleState: BattleState = {
    arena: world.arena,
    monster: { id: world.snapshotMonster.id, name: world.snapshotMonster.id } as any,
    classes: [],
    actions: world.snapshotActions || [],
    grid: world.grid,
    wheel: world.wheel,
    characters: Array.from(world.snapshotCharacters.values()),
    monsterEntity: world.snapshotMonster,
    entityMap: new Map<string, any>([
      ...Array.from(world.snapshotCharacters.entries()),
      [world.snapshotMonster.id, world.snapshotMonster],
    ]),
    actionRegistry: {} as any,
    turnController: {} as any,
    effectRegistry: {} as any,
    stateObserver: {} as any,
    createGameContext: () => ({}) as any,
  };

  world.snapshot = createBattleSnapshot(battleState);
});

// Then steps

Then(
  'the snapshot should contain character {string} at position {int},{int}',
  function (world: BattleSnapshotWorld, characterId: string, x: number, y: number) {
    expect(world.snapshot).toBeDefined();
    const charData = world.snapshot.characters.find((c: any) => c.id === characterId);
    expect(charData).toBeDefined();
    expect(charData.position).toEqual({ x, y });
  }
);

Then(
  'the snapshot should contain monster {string} at position {int},{int}',
  function (world: BattleSnapshotWorld, monsterId: string, x: number, y: number) {
    expect(world.snapshot).toBeDefined();
    expect(world.snapshot.monster.id).toBe(monsterId);
    expect(world.snapshot.monster.position).toEqual({ x, y });
  }
);

Then(
  'the snapshot should show monster {string} has health {int}',
  function (world: BattleSnapshotWorld, _monsterId: string, health: number) {
    expect(world.snapshot).toBeDefined();
    expect(world.snapshot.monster.health).toBe(health);
  }
);

Then(
  'the snapshot should include monster state machine config with states: {string}',
  function (world: BattleSnapshotWorld, statesStr: string) {
    expect(world.snapshot).toBeDefined();
    const expectedStates = statesStr.split(', ').map((s) => s.trim());
    const snapshotStates = world.snapshot.monster.stateMachine?.states || [];
    expect(snapshotStates).toEqual(expect.arrayContaining(expectedStates));
  }
);

Then(
  'the snapshot should show character {string} pool beads as: {string}',
  function (world: BattleSnapshotWorld, characterId: string, countsStr: string) {
    expect(world.snapshot).toBeDefined();
    const expectedCounts = parseBeadCounts(countsStr);
    const charData = world.snapshot.characters.find((c: any) => c.id === characterId);
    expect(charData).toBeDefined();
    expect(charData.beadPool).toEqual(expectedCounts);
  }
);

Then(
  'the snapshot should show character {string} discard beads as: {string}',
  function (world: BattleSnapshotWorld, characterId: string, countsStr: string) {
    expect(world.snapshot).toBeDefined();
    const expectedCounts = parseBeadCounts(countsStr);
    const charData = world.snapshot.characters.find((c: any) => c.id === characterId);
    expect(charData).toBeDefined();
    expect(charData.beadDiscard).toEqual(expectedCounts);
  }
);

Then(
  'the snapshot should show character {string} hand beads as: {string}',
  function (world: BattleSnapshotWorld, characterId: string, countsStr: string) {
    expect(world.snapshot).toBeDefined();
    const expectedCounts = parseBeadCounts(countsStr);
    const charData = world.snapshot.characters.find((c: any) => c.id === characterId);
    expect(charData).toBeDefined();
    expect(charData.beadHand).toEqual(expectedCounts);
  }
);

Then(
  'the snapshot should show monster {string} bag beads as: {string}',
  function (world: BattleSnapshotWorld, _monsterId: string, countsStr: string) {
    expect(world.snapshot).toBeDefined();
    const expectedCounts = parseBeadCounts(countsStr);
    expect(world.snapshot.monster.beadBag).toEqual(expectedCounts);
  }
);

Then(
  'the snapshot should show {string} at wheel position {int} with arrival order {int}',
  function (world: BattleSnapshotWorld, entityId: string, position: number, arrivalOrder: number) {
    expect(world.snapshot).toBeDefined();
    const wheelEntry = world.snapshot.wheelEntries.find((e: any) => e.id === entityId);
    expect(wheelEntry).toBeDefined();
    expect(wheelEntry.position).toBe(position);
    expect(wheelEntry.arrivalOrder).toBe(arrivalOrder);
  }
);

Then(
  'the snapshot should show character {string} with equipment: {string}',
  function (world: BattleSnapshotWorld, characterId: string, equipStr: string) {
    expect(world.snapshot).toBeDefined();
    const charData = world.snapshot.characters.find((c: any) => c.id === characterId);
    expect(charData).toBeDefined();
    const expectedEquip = parseEquipment(equipStr);
    expect(charData.equipment).toEqual(expectedEquip);
  }
);

Then(
  'the snapshot should show character {string} available actions: {string}',
  function (world: BattleSnapshotWorld, characterId: string, actionsStr: string) {
    expect(world.snapshot).toBeDefined();
    const expectedActions = actionsStr.split(', ').map((a) => a.trim());
    const charData = world.snapshot.characters.find((c: any) => c.id === characterId);
    expect(charData).toBeDefined();
    expect(charData.availableActionIds).toEqual(expectedActions);
  }
);

Then(
  'the snapshot should include arena named {string} with dimensions {int}x{int}',
  function (world: BattleSnapshotWorld, name: string, width: number, height: number) {
    expect(world.snapshot).toBeDefined();
    expect(world.snapshot.arena.name).toBe(name);
    expect(world.snapshot.arena.width).toBe(width);
    expect(world.snapshot.arena.height).toBe(height);
  }
);

Then(
  'the snapshot should include character names: {string}',
  function (world: BattleSnapshotWorld, namesStr: string) {
    expect(world.snapshot).toBeDefined();
    const expectedNames = namesStr.split(', ').map((n) => n.trim());
    const snapshotNames = world.snapshot.characters.map((c: any) => c.id);
    expect(snapshotNames).toEqual(expect.arrayContaining(expectedNames));
  }
);

Then(
  'the snapshot should include monster name: {string}',
  function (world: BattleSnapshotWorld, name: string) {
    expect(world.snapshot).toBeDefined();
    expect(world.snapshot.monster.id).toBe(name);
  }
);

Then('the snapshot should be JSON serializable', function (world: BattleSnapshotWorld) {
  expect(world.snapshot).toBeDefined();
  expect(() => JSON.stringify(world.snapshot)).not.toThrow();
});

Then(
  'JSON stringified snapshot should deep-equal original snapshot',
  function (world: BattleSnapshotWorld) {
    expect(world.snapshot).toBeDefined();
    const serialized = JSON.stringify(world.snapshot);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(world.snapshot);
  }
);

Then(
  'the snapshot should include character {string} with human-readable name {string}',
  function (world: BattleSnapshotWorld, characterId: string, humanName: string) {
    expect(world.snapshot).toBeDefined();
    const charData = world.snapshot.characters.find((c: any) => c.id === characterId);
    expect(charData).toBeDefined();
    expect(charData.name || charData.id).toBe(humanName);
  }
);

Then(
  'the snapshot should include monster {string} with human-readable name {string}',
  function (world: BattleSnapshotWorld, _monsterId: string, humanName: string) {
    expect(world.snapshot).toBeDefined();
    expect(world.snapshot.monster.name || world.snapshot.monster.id).toBe(humanName);
  }
);

Then(
  'the snapshot should map entity IDs to display names: {string}',
  function (world: BattleSnapshotWorld, idsStr: string) {
    expect(world.snapshot).toBeDefined();
    const expectedIds = idsStr.split(', ').map((id) => id.trim());
    const allIds = [...world.snapshot.characters.map((c: any) => c.id), world.snapshot.monster.id];
    expect(allIds).toEqual(expect.arrayContaining(expectedIds));
  }
);
