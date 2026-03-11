import { When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Entity } from '@src/entities/Entity';
import { BattleGrid } from '@src/state/BattleGrid';

interface EndOfRoundDamage {
  entityId: string;
  type: string;
  damage: number;
  consumed: boolean;
}

interface StatusEffectsWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  entities?: Map<string, Entity>;
  endOfRoundResults?: EndOfRoundDamage[];
  affectedEntitiesList?: string[];
}

// Apply burn stacks

When(
  'entity {string} has {int} burn stack applied',
  function (world: StatusEffectsWorld, entityId: string, stacks: number) {
    const entity = world.entities!.get(entityId)!;
    entity.addStacks('burn', stacks);
  }
);

When(
  'entity {string} has {int} burn stacks applied',
  function (world: StatusEffectsWorld, entityId: string, stacks: number) {
    const entity = world.entities!.get(entityId)!;
    entity.addStacks('burn', stacks);
  }
);

// Query burn stacks

Then(
  'entity {string} should have {int} burn stacks',
  function (world: StatusEffectsWorld, entityId: string, expectedStacks: number) {
    const entity = world.entities!.get(entityId)!;
    const stacks = entity.getStacks('burn');
    expect(stacks).toBe(expectedStacks);
  }
);

Then('entity {string} should have no burn', function (world: StatusEffectsWorld, entityId: string) {
  const entity = world.entities!.get(entityId)!;
  const stacks = entity.getStacks('burn');
  expect(stacks).toBe(0);
});

Then(
  'entity {string} should have {int} burn stack',
  function (world: StatusEffectsWorld, entityId: string, expectedStacks: number) {
    const entity = world.entities!.get(entityId)!;
    const stacks = entity.getStacks('burn');
    expect(stacks).toBe(expectedStacks);
  }
);

Then('entity {string} should have burn', function (world: StatusEffectsWorld, entityId: string) {
  const entity = world.entities!.get(entityId)!;
  expect(entity.getStacks('burn')).toBeGreaterThan(0);
});

// End-of-round resolution

When('end of round is resolved', function (world: StatusEffectsWorld) {
  const allEntities = Array.from(world.entities!.values());
  const results: EndOfRoundDamage[] = [];
  for (const entity of allEntities) {
    const stacks = entity.getStacks('burn');
    if (stacks > 0) {
      const actualDamage = Math.min(stacks, entity.currentHealth);
      entity.receiveDamage(stacks);
      entity.clearStacks('burn');
      results.push({ entityId: entity.id, type: 'burn', damage: actualDamage, consumed: true });
    }
  }
  world.endOfRoundResults = results;
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
    world.affectedEntitiesList = allEntities
      .filter((e) => e.getStacks('burn') > 0)
      .map((e) => e.id);
    expect(world.affectedEntitiesList).toContain(entityId);
  }
);

Then(
  'the affected entities list should not contain {string}',
  function (world: StatusEffectsWorld, entityId: string) {
    const allEntities = Array.from(world.entities!.values());
    world.affectedEntitiesList = allEntities
      .filter((e) => e.getStacks('burn') > 0)
      .map((e) => e.id);
    expect(world.affectedEntitiesList).not.toContain(entityId);
  }
);
