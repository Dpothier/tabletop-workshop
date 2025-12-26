import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid, MoveResult, Position } from '@src/state/BattleGrid';
import { Entity, AttackResult } from '@src/entities/Entity';

interface EntityWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  entity?: Entity;
  entities?: Map<string, Entity>;
  entityPosition?: Position | null;
  entityMoveResult?: MoveResult;
  attackResult?: AttackResult;
}

// Use the grid from battle-grid.steps.ts
Given(
  'an entity {string} with {int} health registered at position {int},{int}',
  function (world: EntityWorld, id: string, health: number, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.entities) {
      world.entities = new Map();
    }

    const entity = new Entity(id, health, world.grid);
    world.grid.register(id, x, y);
    world.entities.set(id, entity);
    world.entity = entity;
  }
);

// Position queries

When('I query the entity position', function (world: EntityWorld) {
  world.entityPosition = world.entity!.getPosition();
});

Then(
  'the entity position should be {int},{int}',
  function (world: EntityWorld, x: number, y: number) {
    const pos = world.entity!.getPosition();
    expect(pos).not.toBeNull();
    expect(pos!.x).toBe(x);
    expect(pos!.y).toBe(y);
  }
);

// Movement

When(
  'the entity moves to position {int},{int}',
  function (world: EntityWorld, x: number, y: number) {
    world.entityMoveResult = world.entity!.moveTo({ x, y });
  }
);

When(
  'entity {string} moves to position {int},{int}',
  function (world: EntityWorld, id: string, x: number, y: number) {
    const entity = world.entities!.get(id)!;
    world.entityMoveResult = entity.moveTo({ x, y });
  }
);

Then('the entity move result should be successful', function (world: EntityWorld) {
  expect(world.entityMoveResult).toBeDefined();
  expect(world.entityMoveResult!.success).toBe(true);
});

Then(
  'the entity move result should fail with reason {string}',
  function (world: EntityWorld, reason: string) {
    expect(world.entityMoveResult).toBeDefined();
    expect(world.entityMoveResult!.success).toBe(false);
    expect(world.entityMoveResult!.reason).toBe(reason);
  }
);

// Health management

When('the entity receives {int} damage', function (world: EntityWorld, damage: number) {
  world.attackResult = world.entity!.receiveAttack(damage);
});

Then('the entity should have {int} health', function (world: EntityWorld, expectedHealth: number) {
  expect(world.entity!.currentHealth).toBe(expectedHealth);
});

Then(
  'the attack result should be successful with {int} damage dealt',
  function (world: EntityWorld, damage: number) {
    expect(world.attackResult).toBeDefined();
    expect(world.attackResult!.success).toBe(true);
    expect(world.attackResult!.damage).toBe(damage);
  }
);

Then('the entity should be alive', function (world: EntityWorld) {
  expect(world.entity!.isAlive()).toBe(true);
});

Then('the entity should not be alive', function (world: EntityWorld) {
  expect(world.entity!.isAlive()).toBe(false);
});

// Healing

Given('the entity has taken {int} damage', function (world: EntityWorld, damage: number) {
  world.entity!.receiveAttack(damage);
});

When('the entity heals {int} health', function (world: EntityWorld, amount: number) {
  world.entity!.heal(amount);
});

// Entity identification

Then('the entity ID should be {string}', function (world: EntityWorld, expectedId: string) {
  expect(world.entity!.id).toBe(expectedId);
});

Then('the entity max health should be {int}', function (world: EntityWorld, expectedMax: number) {
  expect(world.entity!.maxHealth).toBe(expectedMax);
});
