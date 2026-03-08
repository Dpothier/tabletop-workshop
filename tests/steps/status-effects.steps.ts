import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Entity } from '@src/entities/Entity';
import { BattleGrid } from '@src/state/BattleGrid';
import { StatusEffectManager, type EndOfRoundDamage } from '@src/systems/StatusEffectManager';

interface StatusEffectsWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  entities?: Map<string, Entity>;
  statusManager?: StatusEffectManager;
  endOfRoundResults?: EndOfRoundDamage[];
  affectedEntitiesList?: string[];
}

// Background

Given('a burn status effect manager', function (world: StatusEffectsWorld) {
  world.statusManager = new StatusEffectManager();
  if (!world.entities) {
    world.entities = new Map();
  }
});

// Apply burn stacks

When(
  'entity {string} has {int} burn stack applied',
  function (world: StatusEffectsWorld, entityId: string, stacks: number) {
    const entity = world.entities!.get(entityId)!;
    world.statusManager!.applyBurn(entity, stacks);
  }
);

When(
  'entity {string} has {int} burn stacks applied',
  function (world: StatusEffectsWorld, entityId: string, stacks: number) {
    const entity = world.entities!.get(entityId)!;
    world.statusManager!.applyBurn(entity, stacks);
  }
);

// Query burn stacks

Then(
  'entity {string} should have {int} burn stacks',
  function (world: StatusEffectsWorld, entityId: string, expectedStacks: number) {
    const entity = world.entities!.get(entityId)!;
    const stacks = world.statusManager!.getBurnStacks(entity);
    expect(stacks).toBe(expectedStacks);
  }
);

Then('entity {string} should have no burn', function (world: StatusEffectsWorld, entityId: string) {
  const entity = world.entities!.get(entityId)!;
  const stacks = world.statusManager!.getBurnStacks(entity);
  expect(stacks).toBe(0);
  expect(world.statusManager!.hasBurn(entity)).toBe(false);
});

Then(
  'entity {string} should have {int} burn stack',
  function (world: StatusEffectsWorld, entityId: string, expectedStacks: number) {
    const entity = world.entities!.get(entityId)!;
    const stacks = world.statusManager!.getBurnStacks(entity);
    expect(stacks).toBe(expectedStacks);
  }
);

Then('entity {string} should have burn', function (world: StatusEffectsWorld, entityId: string) {
  const entity = world.entities!.get(entityId)!;
  expect(world.statusManager!.hasBurn(entity)).toBe(true);
});

// End-of-round resolution

When('end of round is resolved', function (world: StatusEffectsWorld) {
  const allEntities = Array.from(world.entities!.values());
  world.endOfRoundResults = world.statusManager!.resolveEndOfRound(allEntities);
});

// Query end-of-round results

Then(
  'the end-of-round results should show {int} damage to {string}',
  function (world: StatusEffectsWorld, expectedDamage: number, entityId: string) {
    const result = world.endOfRoundResults!.find((r) => r.entityId === entityId);
    expect(result).toBeDefined();
    expect(result!.damage).toBe(expectedDamage);
    expect(result!.consumed).toBe(true);
  }
);

Then(
  'there should be {int} end-of-round damage events',
  function (world: StatusEffectsWorld, expectedCount: number) {
    expect(world.endOfRoundResults!).toHaveLength(expectedCount);
  }
);

// Affected entities

Then(
  'the affected entities list should contain {string}',
  function (world: StatusEffectsWorld, entityId: string) {
    const allEntities = Array.from(world.entities!.values());
    world.affectedEntitiesList = world.statusManager!.getAffectedEntities(allEntities);
    expect(world.affectedEntitiesList).toContain(entityId);
  }
);

Then(
  'the affected entities list should not contain {string}',
  function (world: StatusEffectsWorld, entityId: string) {
    const allEntities = Array.from(world.entities!.values());
    world.affectedEntitiesList = world.statusManager!.getAffectedEntities(allEntities);
    expect(world.affectedEntitiesList).not.toContain(entityId);
  }
);
