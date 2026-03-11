import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { BattleGrid } from '@src/state/BattleGrid';
import { Character } from '@src/entities/Character';
import { MonsterEntity } from '@src/entities/MonsterEntity';
import type { Position } from '@src/state/BattleGrid';

interface SnapshotHydratorWorld extends QuickPickleWorld {
  hydratorGrid?: BattleGrid;
  hydratorCharacters?: Map<string, Character>;
  hydratorMonster?: MonsterEntity;
  hydratorSnapshot?: any;
  hydratorPositions?: Map<string, Position>;
}

Given(
  'a hydrator battle snapshot with 2 characters and 1 monster',
  async function (world: SnapshotHydratorWorld) {
    const { BattleGrid } = await import('@src/state/BattleGrid');
    world.hydratorGrid = new BattleGrid(10, 10);
    world.hydratorCharacters = new Map();

    // Create character 1 at position (2, 3)
    const char1 = new Character(
      'hero-0',
      100,
      world.hydratorGrid,
      { registerEntity: () => {} } as any,
      undefined,
      0
    );
    char1.setCharacterData('hero-0', {} as any, undefined);
    world.hydratorGrid.register('hero-0', 2, 3);
    world.hydratorCharacters.set('hero-0', char1);

    // Create character 2 at position (5, 6)
    const char2 = new Character(
      'hero-1',
      100,
      world.hydratorGrid,
      { registerEntity: () => {} } as any,
      undefined,
      1
    );
    char2.setCharacterData('hero-1', {} as any, undefined);
    world.hydratorGrid.register('hero-1', 5, 6);
    world.hydratorCharacters.set('hero-1', char2);

    // Create monster at position (8, 8)
    const monster = new MonsterEntity('monster', 100, world.hydratorGrid);
    world.hydratorGrid.register('monster', 8, 8);
    world.hydratorMonster = monster;

    // Create a mock snapshot object matching the structure
    world.hydratorSnapshot = {
      characters: [
        {
          id: 'hero-0',
          name: 'hero-0',
          health: 100,
          maxHealth: 100,
          position: { x: 2, y: 3 },
          beadHand: { red: 0, blue: 0, green: 0, white: 0 },
          beadPool: { red: 0, blue: 0, green: 0, white: 0 },
          beadDiscard: { red: 0, blue: 0, green: 0, white: 0 },
          equipment: {},
          availableActionIds: [],
        },
        {
          id: 'hero-1',
          name: 'hero-1',
          health: 100,
          maxHealth: 100,
          position: { x: 5, y: 6 },
          beadHand: { red: 0, blue: 0, green: 0, white: 0 },
          beadPool: { red: 0, blue: 0, green: 0, white: 0 },
          beadDiscard: { red: 0, blue: 0, green: 0, white: 0 },
          equipment: {},
          availableActionIds: [],
        },
      ],
      monster: {
        id: 'monster',
        name: 'monster',
        health: 100,
        maxHealth: 100,
        position: { x: 8, y: 8 },
        beadBag: { red: 0, blue: 0, green: 0, white: 0 },
        stateMachine: {
          states: ['idle', 'attack'],
        },
      },
      arena: { name: 'Arena', width: 10, height: 10 },
      wheelEntries: [],
      actions: [],
    };
  }
);

When(
  'I hydrator extract entity positions from the snapshot',
  async function (world: SnapshotHydratorWorld) {
    const { SnapshotHydrator } = await import('@src/recording/SnapshotHydrator');
    const hydrator = new SnapshotHydrator();
    world.hydratorPositions = hydrator.getInitialPositions(world.hydratorSnapshot);
  }
);

Then(
  'the hydrator positions map should have {int} entries',
  function (world: SnapshotHydratorWorld, expectedCount: number) {
    expect(world.hydratorPositions).toBeDefined();
    expect(world.hydratorPositions!.size).toBe(expectedCount);
  }
);

Then(
  'the hydrator position for {string} should match the snapshot',
  function (world: SnapshotHydratorWorld, entityId: string) {
    expect(world.hydratorPositions).toBeDefined();
    const position = world.hydratorPositions!.get(entityId);
    expect(position).toBeDefined();

    // Find the entity in the snapshot
    let expectedPosition: Position | undefined;
    const charInSnapshot = world.hydratorSnapshot.characters.find((c: any) => c.id === entityId);
    const monsterInSnapshot =
      world.hydratorSnapshot.monster.id === entityId ? world.hydratorSnapshot.monster : undefined;

    if (charInSnapshot) {
      expectedPosition = charInSnapshot.position;
    } else if (monsterInSnapshot) {
      expectedPosition = monsterInSnapshot.position;
    }

    expect(expectedPosition).toBeDefined();
    expect(position).toEqual(expectedPosition);
  }
);
