import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PreparationManager } from '@src/systems/PreparationManager';
import { StatusEffectManager } from '@src/systems/StatusEffectManager';
import type { PreparationType } from '@src/systems/PreparationManager';

interface BuffsWorld extends QuickPickleWorld {
  buffsGrid?: BattleGrid;
  buffsEntity?: Entity;
  buffsPreparationManager?: PreparationManager;
  buffsStatusEffectManager?: StatusEffectManager;
}

// Given steps

Given(
  'a buffs entity {string} with {int} health',
  function (world: BuffsWorld, entityName: string, health: number) {
    if (!world.buffsGrid) {
      world.buffsGrid = new BattleGrid(9, 9);
    }
    world.buffsEntity = new Entity(entityName, health, world.buffsGrid);
    world.buffsEntity.currentHealth = health;
  }
);

Given(
  'the buffs entity has {int} stacks of {string}',
  function (world: BuffsWorld, count: number, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    world.buffsEntity!.clearStacks(effectName);
    if (count > 0) {
      world.buffsEntity!.addStacks(effectName, count);
    }
  }
);

Given(
  'a preparation manager with max {int} stacks for {string}',
  function (world: BuffsWorld, _maxStacks: number, _effectName: string) {
    world.buffsPreparationManager = new PreparationManager();
  }
);

Given(
  'a status effect manager',
  function (world: BuffsWorld) {
    world.buffsStatusEffectManager = new StatusEffectManager();
  }
);

// When steps

When(
  'I add {int} stacks of {string} to the buffs entity',
  function (world: BuffsWorld, count: number, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    world.buffsEntity!.addStacks(effectName, count);
  }
);

When(
  'I clear stacks of {string} on the buffs entity',
  function (world: BuffsWorld, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    world.buffsEntity!.clearStacks(effectName);
  }
);

When(
  'I clear all stacks on the buffs entity',
  function (world: BuffsWorld) {
    expect(world.buffsEntity).toBeDefined();
    world.buffsEntity!.clearAll();
  }
);

When(
  'I query stacks of {string} on the buffs entity',
  function (world: BuffsWorld, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    const stacks = world.buffsEntity!.getStacks(effectName);
    expect(stacks).toBeDefined();
  }
);

When(
  'I add {int} windup stacks via the preparation manager',
  function (world: BuffsWorld, count: number) {
    expect(world.buffsEntity).toBeDefined();
    expect(world.buffsPreparationManager).toBeDefined();
    world.buffsPreparationManager!.prepare(world.buffsEntity!, 'windup' as PreparationType, count);
  }
);

When(
  'the status effect manager resolves end of round',
  function (world: BuffsWorld) {
    expect(world.buffsEntity).toBeDefined();
    expect(world.buffsStatusEffectManager).toBeDefined();
    world.buffsStatusEffectManager!.resolveEndOfRound([world.buffsEntity!]);
  }
);

// Then steps

Then(
  'the buffs entity should have {int} stacks of {string}',
  function (world: BuffsWorld, expectedCount: number, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    const actualCount = world.buffsEntity!.getStacks(effectName);
    expect(actualCount).toBe(expectedCount);
  }
);

Then(
  'the buffs entity should have {int} health',
  function (world: BuffsWorld, expectedHealth: number) {
    expect(world.buffsEntity).toBeDefined();
    expect(world.buffsEntity!.currentHealth).toBe(expectedHealth);
  }
);
