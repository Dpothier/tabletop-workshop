import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { TurnController, AliveQueryable, BattleStatus } from '@src/systems/TurnController';
import { ActionWheel } from '@src/systems/ActionWheel';

interface TurnControllerWorld extends QuickPickleWorld {
  turnController?: TurnController;
  actionWheel?: ActionWheel;
  monsterMock?: AliveQueryable;
  characterMocks?: AliveQueryable[];
  nextActor?: string | null;
  battleStatus?: BattleStatus;
  isVictory?: boolean;
  isDefeat?: boolean;
}

/**
 * Create a mock AliveQueryable object
 */
function createAliveMock(isAlive: boolean): AliveQueryable {
  return {
    isAlive: () => isAlive,
  };
}

Given(
  'a turn controller with a dead monster and {int} alive characters',
  function (world: TurnControllerWorld, characterCount: number) {
    world.actionWheel = new ActionWheel();
    world.monsterMock = createAliveMock(false);
    world.characterMocks = Array.from({ length: characterCount }, () => createAliveMock(true));
    world.turnController = new TurnController(
      world.actionWheel,
      world.monsterMock,
      world.characterMocks
    );
  }
);

Given(
  'a turn controller with an alive monster and {int} alive characters',
  function (world: TurnControllerWorld, characterCount: number) {
    world.actionWheel = new ActionWheel();
    world.monsterMock = createAliveMock(true);
    world.characterMocks = Array.from({ length: characterCount }, () => createAliveMock(true));
    world.turnController = new TurnController(
      world.actionWheel,
      world.monsterMock,
      world.characterMocks
    );
  }
);

Given(
  'a turn controller with an alive monster and {int} alive character',
  function (world: TurnControllerWorld, characterCount: number) {
    world.actionWheel = new ActionWheel();
    world.monsterMock = createAliveMock(true);
    world.characterMocks = Array.from({ length: characterCount }, () => createAliveMock(true));
    world.turnController = new TurnController(
      world.actionWheel,
      world.monsterMock,
      world.characterMocks
    );
  }
);

Given('a turn controller with an empty wheel', function (world: TurnControllerWorld) {
  world.actionWheel = new ActionWheel();
  world.monsterMock = createAliveMock(true);
  world.characterMocks = [createAliveMock(true)];
  world.turnController = new TurnController(
    world.actionWheel,
    world.monsterMock,
    world.characterMocks
  );
});

Given(
  'a turn controller with entities on the wheel:',
  function (world: TurnControllerWorld, dataTable: { rawTable: string[][] }) {
    world.actionWheel = new ActionWheel();
    // Skip header row
    for (let i = 1; i < dataTable.rawTable.length; i++) {
      const row = dataTable.rawTable[i];
      const id = row[0];
      const position = parseInt(row[1]);
      world.actionWheel!.addEntity(id, position);
    }
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(true)];
    world.turnController = new TurnController(
      world.actionWheel,
      world.monsterMock,
      world.characterMocks
    );
  }
);

Given(
  'a turn controller with an entity {string} at position {int}',
  function (world: TurnControllerWorld, entityId: string, position: number) {
    world.actionWheel = new ActionWheel();
    world.actionWheel.addEntity(entityId, position);
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(true)];
    world.turnController = new TurnController(
      world.actionWheel,
      world.monsterMock,
      world.characterMocks
    );
  }
);

When('I check victory', function (world: TurnControllerWorld) {
  world.isVictory = world.turnController!.checkVictory();
});

When('I check defeat', function (world: TurnControllerWorld) {
  world.isDefeat = world.turnController!.checkDefeat();
});

When('I get the next actor from turn controller', function (world: TurnControllerWorld) {
  world.nextActor = world.turnController!.getNextActor();
});

When(
  'I advance turn for {string} with cost {int}',
  function (world: TurnControllerWorld, entityId: string, cost: number) {
    world.turnController!.advanceTurn(entityId, cost);
  }
);

When('I get the battle status', function (world: TurnControllerWorld) {
  world.battleStatus = world.turnController!.getBattleStatus();
});

Then('victory should be true', function (world: TurnControllerWorld) {
  expect(world.isVictory).toBe(true);
});

Then('victory should be false', function (world: TurnControllerWorld) {
  expect(world.isVictory).toBe(false);
});

Then('defeat should be true', function (world: TurnControllerWorld) {
  expect(world.isDefeat).toBe(true);
});

Then('defeat should be false', function (world: TurnControllerWorld) {
  expect(world.isDefeat).toBe(false);
});

Then(
  'the next actor from turn controller should be {string}',
  function (world: TurnControllerWorld, expectedId: string) {
    expect(world.nextActor).toBe(expectedId);
  }
);

Then('the next actor from turn controller should be null', function (world: TurnControllerWorld) {
  expect(world.nextActor).toBeNull();
});

Then(
  '{string} should be at position {int} on the wheel',
  function (world: TurnControllerWorld, entityId: string, expectedPosition: number) {
    expect(world.actionWheel!.getPosition(entityId)).toBe(expectedPosition);
  }
);

Then(
  'the battle status should be {string}',
  function (world: TurnControllerWorld, expectedStatus: string) {
    expect(world.battleStatus).toBe(expectedStatus);
  }
);
