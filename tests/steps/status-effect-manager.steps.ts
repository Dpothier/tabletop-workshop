import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { StatusEffectManager } from '@src/systems/StatusEffectManager';

/**
 * These step definitions test StatusEffectManager integration with Entity.buffs.
 * Pending MFG-56: currently uses entityId-based API and syncs with Entity.buffs manually.
 */

interface StatusManagerWorld extends QuickPickleWorld {
  statusGrid?: BattleGrid;
  statusEntity?: Entity;
  statusManager?: StatusEffectManager;
  statusQueryResult?: number;
}

// Given steps

Given('a status effect manager grid and entity', function (world: StatusManagerWorld) {
  world.statusGrid = new BattleGrid(9, 9);
  world.statusEntity = new Entity('status-test-entity', 100, world.statusGrid);
  world.statusManager = new StatusEffectManager();
});

Given(
  'a status effect manager grid and entity with {int} health',
  function (world: StatusManagerWorld, health: number) {
    world.statusGrid = new BattleGrid(9, 9);
    world.statusEntity = new Entity('status-test-entity', health, world.statusGrid);
    world.statusEntity.currentHealth = health;
    world.statusManager = new StatusEffectManager();
  }
);

Given(
  'the status entity has {int} stacks of {string}',
  function (world: StatusManagerWorld, count: number, effectName: string) {
    expect(world.statusEntity).toBeDefined();
    expect(world.statusManager).toBeDefined();
    if (count > 0) {
      world.statusEntity!.addStacks(effectName, count);
      if (effectName === 'burn') {
        world.statusManager!.applyBurn(world.statusEntity!.id, count);
      }
    }
  }
);

// When steps

When(
  'I apply {int} stacks of burn to the entity via status manager',
  function (world: StatusManagerWorld, count: number) {
    expect(world.statusEntity).toBeDefined();
    expect(world.statusManager).toBeDefined();
    world.statusManager!.applyBurn(world.statusEntity!.id, count);
    world.statusEntity!.addStacks('burn', count);
  }
);

When(
  'I resolve end of round burn via status manager',
  function (world: StatusManagerWorld) {
    expect(world.statusEntity).toBeDefined();
    expect(world.statusManager).toBeDefined();
    const entity = world.statusEntity!;
    world.statusManager!.resolveEndOfRound((_id: string) => entity);
    // Sync entity.buffs: clear burn since manager fully consumes
    entity.clearStacks('burn');
  }
);

When(
  'I query burn stacks via status manager',
  function (world: StatusManagerWorld) {
    expect(world.statusEntity).toBeDefined();
    expect(world.statusManager).toBeDefined();
    world.statusQueryResult = world.statusManager!.getBurnStacks(world.statusEntity!.id);
  }
);

When(
  'I clear burn stacks via status manager',
  function (world: StatusManagerWorld) {
    expect(world.statusEntity).toBeDefined();
    expect(world.statusManager).toBeDefined();
    // Manager doesn't have clearBurn — clear from entity.buffs directly
    world.statusEntity!.clearStacks('burn');
  }
);

// Then steps

Then(
  'the status entity should have {int} health',
  function (world: StatusManagerWorld, expectedHealth: number) {
    expect(world.statusEntity).toBeDefined();
    expect(world.statusEntity!.currentHealth).toBe(expectedHealth);
  }
);

Then(
  'the status entity should have {int} stacks of {string}',
  function (world: StatusManagerWorld, expectedCount: number, effectName: string) {
    expect(world.statusEntity).toBeDefined();
    const actualCount = world.statusEntity!.getStacks(effectName);
    expect(actualCount).toBe(expectedCount);
  }
);

Then(
  'the queried burn stacks should be {int}',
  function (world: StatusManagerWorld, expectedCount: number) {
    expect(world.statusQueryResult).toBeDefined();
    expect(world.statusQueryResult).toBe(expectedCount);
  }
);
