import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { ActionWheel, WheelEntry } from '../../src/systems/ActionWheel';

interface ActionWheelWorld extends QuickPickleWorld {
  actionWheel?: ActionWheel;
  nextActor?: string | null;
  entitiesAtPosition?: WheelEntry[];
  error?: Error;
}

Given('an empty action wheel', function (world: ActionWheelWorld) {
  world.actionWheel = new ActionWheel();
});

Given(
  'an action wheel with entity {string} at position {int}',
  function (world: ActionWheelWorld, id: string, position: number) {
    world.actionWheel = new ActionWheel();
    world.actionWheel.addEntity(id, position);
  }
);

Given(
  'an action wheel with entities:',
  function (world: ActionWheelWorld, dataTable: { rawTable: string[][] }) {
    world.actionWheel = new ActionWheel();
    // Skip header row
    for (let i = 1; i < dataTable.rawTable.length; i++) {
      const row = dataTable.rawTable[i];
      const id = row[0];
      const position = parseInt(row[1]);
      world.actionWheel.addEntity(id, position);
    }
  }
);

When(
  'I add entity {string} at position {int}',
  function (world: ActionWheelWorld, id: string, position: number) {
    world.actionWheel!.addEntity(id, position);
  }
);

When(
  'I try to add entity {string} at position {int}',
  function (world: ActionWheelWorld, id: string, position: number) {
    try {
      world.actionWheel!.addEntity(id, position);
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When(
  'entity {string} takes action with cost {int}',
  function (world: ActionWheelWorld, id: string, cost: number) {
    world.actionWheel!.advanceEntity(id, cost);
  }
);

When(
  'I try to advance entity {string} with cost {int}',
  function (world: ActionWheelWorld, id: string, cost: number) {
    try {
      world.actionWheel!.advanceEntity(id, cost);
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When('I get the next actor', function (world: ActionWheelWorld) {
  world.nextActor = world.actionWheel!.getNextActor();
});

When('I remove entity {string}', function (world: ActionWheelWorld, id: string) {
  world.actionWheel!.removeEntity(id);
});

When('I get entities at position {int}', function (world: ActionWheelWorld, position: number) {
  world.entitiesAtPosition = world.actionWheel!.getEntitiesAtPosition(position);
});

Then(
  'entity {string} should be at position {int}',
  function (world: ActionWheelWorld, id: string, position: number) {
    expect(world.actionWheel!.getPosition(id)).toBe(position);
  }
);

Then(
  'the wheel should have {int} entity/entities',
  function (world: ActionWheelWorld, count: number) {
    expect(world.actionWheel!.getAllEntities().length).toBe(count);
  }
);

Then('an error should be thrown', function (world: ActionWheelWorld) {
  expect(world.error).toBeDefined();
});

Then(
  'entity {string} should have lower arrival order than {string}',
  function (world: ActionWheelWorld, id1: string, id2: string) {
    const order1 = world.actionWheel!.getArrivalOrder(id1);
    const order2 = world.actionWheel!.getArrivalOrder(id2);
    expect(order1).toBeDefined();
    expect(order2).toBeDefined();
    expect(order1!).toBeLessThan(order2!);
  }
);

Then(
  'entity {string} should have higher arrival order than {string}',
  function (world: ActionWheelWorld, id1: string, id2: string) {
    const order1 = world.actionWheel!.getArrivalOrder(id1);
    const order2 = world.actionWheel!.getArrivalOrder(id2);
    expect(order1).toBeDefined();
    expect(order2).toBeDefined();
    expect(order1!).toBeGreaterThan(order2!);
  }
);

Then('the next actor should be {string}', function (world: ActionWheelWorld, expectedId: string) {
  const nextActor = world.nextActor ?? world.actionWheel!.getNextActor();
  expect(nextActor).toBe(expectedId);
});

Then('the next actor should be null', function (world: ActionWheelWorld) {
  expect(world.nextActor).toBeNull();
});

Then(
  'entity {string} should not exist on the wheel',
  function (world: ActionWheelWorld, id: string) {
    expect(world.actionWheel!.hasEntity(id)).toBe(false);
  }
);

Then(
  'I should get {int} entities at that position',
  function (world: ActionWheelWorld, count: number) {
    expect(world.entitiesAtPosition!.length).toBe(count);
  }
);
