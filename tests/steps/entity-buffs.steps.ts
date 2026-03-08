import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';

interface BuffsWorld extends QuickPickleWorld {
  buffsGrid?: BattleGrid;
  buffsEntity?: Entity;
  buffsPreparationManager?: {
    addStacks(entity: Entity, name: string, count: number): void;
  };
  buffsStatusEffectManager?: {
    resolveEndOfRound(entity: Entity): void;
  };
}

// Helper function to set stacks on entity (used in steps)
function setStacksOnEntity(entity: Entity, effectName: string, count: number): void {
  // Clear first, then add to set to exact count
  (entity as any).clearStacks(effectName);
  if (count > 0) {
    (entity as any).addStacks(effectName, count);
  }
}

// Helper function to add stacks to entity
function addStacksToEntity(entity: Entity, effectName: string, count: number): void {
  // This will fail at runtime until Entity has addStacks method
  (entity as any).addStacks(effectName, count);
}

// Helper function to get stacks from entity
function getStacksFromEntity(entity: Entity, effectName: string): number {
  // This will fail at runtime until Entity has getStacks method
  return (entity as any).getStacks(effectName) ?? 0;
}

// Helper function to clear stacks
function clearStacksOnEntity(entity: Entity, effectName: string): void {
  // This will fail at runtime until Entity has clearStacks method
  (entity as any).clearStacks(effectName);
}

// Helper function to clear all stacks
function clearAllStacksOnEntity(entity: Entity): void {
  // This will fail at runtime until Entity has clearAll method
  (entity as any).clearAll();
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
    setStacksOnEntity(world.buffsEntity!, effectName, count);
  }
);

Given(
  'a preparation manager with max {int} stacks for {string}',
  function (world: BuffsWorld, maxStacks: number, effectName: string) {
    // Create a local PreparationManager implementation for testing
    world.buffsPreparationManager = {
      addStacks: (entity: Entity, name: string, count: number) => {
        if (name === effectName) {
          // Get current stacks, then set to min(current + count, maxStacks)
          const current = getStacksFromEntity(entity, name);
          const newStacks = Math.min(current + count, maxStacks);
          setStacksOnEntity(entity, name, newStacks);
        } else {
          // For other effects, just add normally
          addStacksToEntity(entity, name, count);
        }
      },
    };
  }
);

Given(
  'a status effect manager',
  function (world: BuffsWorld) {
    // Create a local StatusEffectManager implementation for testing
    world.buffsStatusEffectManager = {
      resolveEndOfRound: (entity: Entity) => {
        // Burn effect: 1 damage per stack, then fully consume (MFG-14)
        const burnStacks = getStacksFromEntity(entity, 'burn');
        if (burnStacks > 0) {
          entity.receiveDamage(burnStacks);
          setStacksOnEntity(entity, 'burn', 0);
        }
      },
    };
  }
);

// When steps

When(
  'I add {int} stacks of {string} to the buffs entity',
  function (world: BuffsWorld, count: number, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    addStacksToEntity(world.buffsEntity!, effectName, count);
  }
);

When(
  'I clear stacks of {string} on the buffs entity',
  function (world: BuffsWorld, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    clearStacksOnEntity(world.buffsEntity!, effectName);
  }
);

When(
  'I clear all stacks on the buffs entity',
  function (world: BuffsWorld) {
    expect(world.buffsEntity).toBeDefined();
    clearAllStacksOnEntity(world.buffsEntity!);
  }
);

When(
  'I query stacks of {string} on the buffs entity',
  function (world: BuffsWorld, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    // Just query - assertion happens in Then step
    const stacks = getStacksFromEntity(world.buffsEntity!, effectName);
    expect(stacks).toBeDefined();
  }
);

When(
  'I add {int} windup stacks via the preparation manager',
  function (world: BuffsWorld, count: number) {
    expect(world.buffsEntity).toBeDefined();
    expect(world.buffsPreparationManager).toBeDefined();
    world.buffsPreparationManager!.addStacks(world.buffsEntity!, 'windup', count);
  }
);

When(
  'the status effect manager resolves end of round',
  function (world: BuffsWorld) {
    expect(world.buffsEntity).toBeDefined();
    expect(world.buffsStatusEffectManager).toBeDefined();
    world.buffsStatusEffectManager!.resolveEndOfRound(world.buffsEntity!);
  }
);

// Then steps

Then(
  'the buffs entity should have {int} stacks of {string}',
  function (world: BuffsWorld, expectedCount: number, effectName: string) {
    expect(world.buffsEntity).toBeDefined();
    const actualCount = getStacksFromEntity(world.buffsEntity!, effectName);
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
