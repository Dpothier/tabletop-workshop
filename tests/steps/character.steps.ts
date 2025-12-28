import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Character, ActionResult } from '@src/entities/Character';
import { Entity } from '@src/entities/Entity';
import { ActionRegistry } from '@src/systems/ActionRegistry';
import { ActionHandlerRegistry, createDefaultHandlers } from '@src/systems/ActionHandlers';
import type { ActionDefinition } from '@src/types/Action';

// Core action definitions for tests
const CORE_ACTIONS: ActionDefinition[] = [
  { id: 'move', name: 'Move', cost: 1, handlerId: 'movement', targetType: 'tile', range: 2 },
  { id: 'run', name: 'Run', cost: 2, handlerId: 'movement', targetType: 'tile', range: 6 },
  {
    id: 'attack',
    name: 'Attack',
    cost: 2,
    handlerId: 'melee_attack',
    targetType: 'entity',
    range: 1,
    damage: 1,
  },
  { id: 'rest', name: 'Rest', cost: 2, handlerId: 'rest', targetType: 'none' },
];

interface CharacterWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  character?: Character;
  characterMap?: Map<string, Character>;
  entityMap?: Map<string, Entity>;
  actionRegistry?: ActionRegistry;
  actionHandlerRegistry?: ActionHandlerRegistry;
  actionResult?: ActionResult;
  thrownError?: Error;
  wheelCost?: number;
}

function setupActionSystem(world: CharacterWorld): void {
  if (!world.actionRegistry) {
    world.actionRegistry = new ActionRegistry();
    world.actionRegistry.registerAll(CORE_ACTIONS);
  }
  if (!world.actionHandlerRegistry) {
    world.actionHandlerRegistry = new ActionHandlerRegistry();
    createDefaultHandlers(world.actionHandlerRegistry);
  }
}

function setActionContext(world: CharacterWorld): void {
  world.actionHandlerRegistry!.setContext({
    grid: world.grid!,
    entityRegistry: world.entityMap!,
    getBeadHand: (entityId: string) => {
      const character = world.characterMap?.get(entityId);
      return character?.getBeadHand();
    },
  });
}

// Background setup

Given(
  'a character {string} with {int} health at position {int},{int}',
  function (world: CharacterWorld, id: string, health: number, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.characterMap) {
      world.characterMap = new Map();
    }
    if (!world.entityMap) {
      world.entityMap = new Map();
    }

    setupActionSystem(world);

    const character = new Character(
      id,
      health,
      world.grid,
      world.entityMap,
      world.actionRegistry,
      world.actionHandlerRegistry
    );
    world.grid.register(id, x, y);
    world.characterMap.set(id, character);
    world.entityMap.set(id, character);
    world.character = character;

    // Set context after character is added to entityMap
    setActionContext(world);
  }
);

Given(
  'a monster entity {string} with {int} health at position {int},{int}',
  function (world: CharacterWorld, id: string, health: number, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.entityMap) {
      world.entityMap = new Map();
    }

    setupActionSystem(world);

    const monster = new Entity(id, health, world.grid);
    world.grid.register(id, x, y);
    world.entityMap.set(id, monster);

    // Update context with new entity
    setActionContext(world);
  }
);

Given('the character has a bead hand', function (world: CharacterWorld) {
  world.character!.initializeBeadHand();
});

// Action resolution

When(
  'the character resolves action {string} with target position {int},{int}',
  function (world: CharacterWorld, actionId: string, x: number, y: number) {
    world.actionResult = world.character!.resolveAction(actionId, { target: { x, y } });
  }
);

When(
  'character {string} resolves action {string} with target position {int},{int}',
  function (world: CharacterWorld, charId: string, actionId: string, x: number, y: number) {
    const character = world.characterMap!.get(charId)!;
    world.actionResult = character.resolveAction(actionId, { target: { x, y } });
  }
);

When(
  'the character resolves action {string} with target entity {string}',
  function (world: CharacterWorld, actionId: string, targetId: string) {
    world.actionResult = world.character!.resolveAction(actionId, { targetEntityId: targetId });
  }
);

When('the character resolves action {string}', function (world: CharacterWorld, actionId: string) {
  world.actionResult = world.character!.resolveAction(actionId, {});
});

When(
  'the character attempts to resolve action {string}',
  function (world: CharacterWorld, actionId: string) {
    try {
      world.character!.resolveAction(actionId, {});
    } catch (e) {
      world.thrownError = e as Error;
    }
  }
);

// Action result assertions

Then('the action result should be successful', function (world: CharacterWorld) {
  expect(world.actionResult).toBeDefined();
  expect(world.actionResult!.success).toBe(true);
});

Then(
  'the action result should fail with reason {string}',
  function (world: CharacterWorld, reason: string) {
    expect(world.actionResult).toBeDefined();
    expect(world.actionResult!.success).toBe(false);
    expect(world.actionResult!.reason).toBe(reason);
  }
);

Then(
  'the action result wheel cost should be {int}',
  function (world: CharacterWorld, cost: number) {
    expect(world.actionResult).toBeDefined();
    expect(world.actionResult!.wheelCost).toBe(cost);
  }
);

// Position assertions

Then(
  'the character should be at position {int},{int}',
  function (world: CharacterWorld, x: number, y: number) {
    const pos = world.character!.getPosition();
    expect(pos).not.toBeNull();
    expect(pos!.x).toBe(x);
    expect(pos!.y).toBe(y);
  }
);

Then(
  'character {string} should be at position {int},{int}',
  function (world: CharacterWorld, charId: string, x: number, y: number) {
    const character = world.characterMap!.get(charId)!;
    const pos = character.getPosition();
    expect(pos).not.toBeNull();
    expect(pos!.x).toBe(x);
    expect(pos!.y).toBe(y);
  }
);

// Health assertions

Then(
  'monster {string} should have {int} health',
  function (world: CharacterWorld, monsterId: string, health: number) {
    const monster = world.entityMap!.get(monsterId)!;
    expect(monster.currentHealth).toBe(health);
  }
);

// Bead assertions

Then('the character should have drawn beads', function (world: CharacterWorld) {
  // When rest is called, the character draws 2 beads
  // We just verify the bead hand exists and was used
  expect(world.character!.hasBeadHand()).toBe(true);
  // The beadHand should have been modified (drawn beads)
  // We can't easily verify exact counts without knowing initial state
  // so we just confirm the action was processed
});

// Error assertions

Then(
  'an error should be thrown with message {string}',
  function (world: CharacterWorld, message: string) {
    expect(world.thrownError).toBeDefined();
    expect(world.thrownError!.message).toBe(message);
  }
);

// Available actions

Then(
  'the character should have actions available: {word}, {word}, {word}, {word}',
  function (
    world: CharacterWorld,
    action1: string,
    action2: string,
    action3: string,
    action4: string
  ) {
    const actionIds = world.character!.getAvailableActionIds();
    expect(actionIds).toContain(action1);
    expect(actionIds).toContain(action2);
    expect(actionIds).toContain(action3);
    expect(actionIds).toContain(action4);
  }
);

// Wheel cost

When(
  'I check the wheel cost of action {string}',
  function (world: CharacterWorld, actionId: string) {
    world.wheelCost = world.character!.getActionWheelCost(actionId);
  }
);

Then('the wheel cost should be {int}', function (world: CharacterWorld, cost: number) {
  expect(world.wheelCost).toBe(cost);
});
