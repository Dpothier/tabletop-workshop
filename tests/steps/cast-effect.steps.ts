import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { CastEffect } from '@src/effects/CastEffect';

interface CastEffectWorld extends QuickPickleWorld {
  castEffectGrid?: BattleGrid;
  castEffectEntities?: Map<string, Entity>;
  castEffectGameContext?: GameContext;
  castEffectCaster?: Entity;
  castEffectTarget?: Entity;
  castEffectResult?: EffectResult;
  castEffectIsAlly?: boolean;
}

// Background: Setup

Given(
  'a cast effect grid of {int}x{int}',
  function (world: CastEffectWorld, width: number, height: number) {
    world.castEffectGrid = new BattleGrid(width, height);
  }
);

Given('a cast effect game context with the grid', function (world: CastEffectWorld) {
  if (!world.castEffectEntities) {
    world.castEffectEntities = new Map();
  }
  if (!world.castEffectGrid) {
    world.castEffectGrid = new BattleGrid(9, 9);
  }

  world.castEffectGameContext = {
    grid: world.castEffectGrid,
    actorId: 'cast-effect-caster',
    getEntity(id: string): Entity | undefined {
      return world.castEffectEntities?.get(id);
    },
    getBeadHand(_entityId: string) {
      return undefined;
    },
  };
});

// Given steps for caster and target setup

Given(
  'a cast effect caster at position {int},{int} with spell power {int}',
  function (world: CastEffectWorld, x: number, y: number, spellPower: number) {
    if (!world.castEffectGrid) {
      world.castEffectGrid = new BattleGrid(9, 9);
    }
    if (!world.castEffectEntities) {
      world.castEffectEntities = new Map();
    }

    const casterId = 'cast-effect-caster';
    world.castEffectCaster = new Entity(casterId, 50, world.castEffectGrid);
    world.castEffectCaster.currentHealth = 50;
    world.castEffectEntities.set(casterId, world.castEffectCaster);
    world.castEffectGrid.register(casterId, x, y);

    // Store spell power as a property on the entity for reference
    (world.castEffectCaster as any).spellPower = spellPower;
  }
);

Given(
  'a cast effect target at position {int},{int} with {int} health and {int} ward',
  function (world: CastEffectWorld, x: number, y: number, health: number, ward: number) {
    if (!world.castEffectGrid) {
      world.castEffectGrid = new BattleGrid(9, 9);
    }
    if (!world.castEffectEntities) {
      world.castEffectEntities = new Map();
    }

    const targetId = 'cast-effect-target';
    world.castEffectTarget = new Entity(targetId, health, world.castEffectGrid);
    world.castEffectTarget.currentHealth = health;
    world.castEffectTarget.setWard(ward);
    world.castEffectEntities.set(targetId, world.castEffectTarget);
    world.castEffectGrid.register(targetId, x, y);

    world.castEffectIsAlly = false;
  }
);

Given(
  'a cast effect ally target at position {int},{int} with {int} health and {int} ward',
  function (world: CastEffectWorld, x: number, y: number, health: number, ward: number) {
    if (!world.castEffectGrid) {
      world.castEffectGrid = new BattleGrid(9, 9);
    }
    if (!world.castEffectEntities) {
      world.castEffectEntities = new Map();
    }

    const targetId = 'cast-effect-target';
    world.castEffectTarget = new Entity(targetId, health, world.castEffectGrid);
    world.castEffectTarget.currentHealth = health;
    world.castEffectTarget.setWard(ward);
    world.castEffectEntities.set(targetId, world.castEffectTarget);
    world.castEffectGrid.register(targetId, x, y);

    world.castEffectIsAlly = true;
  }
);

// When steps for execution

When(
  'I execute cast effect with base damage {int} and {int} extra beads',
  async function (world: CastEffectWorld, baseDamage: number, extraBeads: number) {
    expect(world.castEffectTarget).toBeDefined();
    expect(world.castEffectGameContext).toBeDefined();

    const effect = new CastEffect();
    const targetId = 'cast-effect-target';

    const result = effect.execute(
      world.castEffectGameContext!,
      {
        targetEntity: targetId,
        baseDamage,
        extraBeads,
        baseCost: 0,
        channelStacks: 0,
        isAlly: world.castEffectIsAlly ?? false,
      },
      {},
      new Map()
    );

    world.castEffectResult = result instanceof Promise ? await result : result;
  }
);

When(
  'I execute cast effect with base damage {int} and {int} extra beads targeting ally',
  async function (world: CastEffectWorld, baseDamage: number, extraBeads: number) {
    expect(world.castEffectTarget).toBeDefined();
    expect(world.castEffectGameContext).toBeDefined();

    const effect = new CastEffect();
    const targetId = 'cast-effect-target';

    const result = effect.execute(
      world.castEffectGameContext!,
      {
        targetEntity: targetId,
        baseDamage,
        extraBeads,
        baseCost: 0,
        channelStacks: 0,
        isAlly: true,
      },
      {},
      new Map()
    );

    world.castEffectResult = result instanceof Promise ? await result : result;
  }
);

When(
  'I execute cast effect with base cost {int} and channel stacks {int}',
  async function (world: CastEffectWorld, baseCost: number, channelStacks: number) {
    expect(world.castEffectTarget).toBeDefined();
    expect(world.castEffectGameContext).toBeDefined();

    const effect = new CastEffect();
    const targetId = 'cast-effect-target';

    // For this scenario, baseDamage defaults to 0 since we're testing cost, not damage
    const result = effect.execute(
      world.castEffectGameContext!,
      {
        targetEntity: targetId,
        baseDamage: 0,
        extraBeads: 0,
        baseCost,
        channelStacks,
        isAlly: world.castEffectIsAlly ?? false,
      },
      {},
      new Map()
    );

    world.castEffectResult = result instanceof Promise ? await result : result;
  }
);

// Then steps for assertions

Then('the cast effect should succeed', function (world: CastEffectWorld) {
  expect(world.castEffectResult).toBeDefined();
  expect(world.castEffectResult!.success).toBe(true);
});

Then('the cast effect target should take damage', function (world: CastEffectWorld) {
  expect(world.castEffectTarget).toBeDefined();
  expect(world.castEffectResult).toBeDefined();
  // Target took damage if current health is less than initial
  // We assume the test set up the initial health correctly
  expect(world.castEffectTarget!.currentHealth).toBeLessThan(world.castEffectTarget!.maxHealth);
});

Then(
  'the cast effect target should have {int} health',
  function (world: CastEffectWorld, expectedHealth: number) {
    expect(world.castEffectTarget).toBeDefined();
    expect(world.castEffectTarget!.currentHealth).toBe(expectedHealth);
  }
);

Then(
  'the cast effect result should show intensity {int}',
  function (world: CastEffectWorld, expectedIntensity: number) {
    expect(world.castEffectResult).toBeDefined();
    expect(world.castEffectResult!.data).toBeDefined();
    expect(world.castEffectResult!.data.intensity).toBe(expectedIntensity);
  }
);

Then(
  'the cast effect result should show effective cost {int}',
  function (world: CastEffectWorld, expectedCost: number) {
    expect(world.castEffectResult).toBeDefined();
    expect(world.castEffectResult!.data).toBeDefined();
    expect(world.castEffectResult!.data.effectiveCost).toBe(expectedCost);
  }
);

Then('the cast effect result should show blocked by ward', function (world: CastEffectWorld) {
  expect(world.castEffectResult).toBeDefined();
  expect(world.castEffectResult!.data).toBeDefined();
  expect(world.castEffectResult!.data.blocked).toBe(true);
  expect(world.castEffectResult!.data.manifests).toBe(false);
});

Then('the cast effect result should show damage manifested', function (world: CastEffectWorld) {
  expect(world.castEffectResult).toBeDefined();
  expect(world.castEffectResult!.data).toBeDefined();
  expect(world.castEffectResult!.data.manifests).toBe(true);
});

Then(
  'the cast effect result should show damage {int}',
  function (world: CastEffectWorld, expectedDamage: number) {
    expect(world.castEffectResult).toBeDefined();
    expect(world.castEffectResult!.data).toBeDefined();
    expect(world.castEffectResult!.data.damage).toBe(expectedDamage);
  }
);
