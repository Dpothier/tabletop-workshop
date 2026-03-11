import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Action, type HydratedEffect } from '@src/models/Action';
import { ActionResolution } from '@src/systems/ActionResolution';
import { AttackEffect } from '@src/effects/AttackEffect';
import type { ActionDefinition, ActionResult } from '@src/types/ActionDefinition';
import type { GameContext } from '@src/types/Effect';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';

interface WeaponPipelineWorld extends QuickPickleWorld {
  wpGrid?: BattleGrid;
  wpAttacker?: Entity;
  wpTarget?: Entity;
  wpGameContext?: GameContext;
  wpMockAdapter?: BattleAdapter;
  wpResult?: ActionResult;
  wpEntities?: Map<string, Entity>;
}

// ===== Background Setup =====

Given(
  'a weapon pipeline grid of {int}x{int}',
  function (world: WeaponPipelineWorld, width: number, height: number) {
    world.wpGrid = new BattleGrid(width, height);
    world.wpEntities = new Map();
  }
);

Given('a weapon pipeline game context with the grid', function (world: WeaponPipelineWorld) {
  if (!world.wpGrid) {
    throw new Error('Grid not initialized');
  }
  if (!world.wpEntities) {
    world.wpEntities = new Map();
  }

  // Note: adapter will be added later when we have the mock adapter
  world.wpGameContext = {
    grid: world.wpGrid,
    actorId: 'wp-attacker',
    getEntity(id: string): Entity | undefined {
      return world.wpEntities?.get(id);
    },
    getBeadHand(_entityId: string) {
      return undefined;
    },
  };
});

Given('a weapon pipeline mock BattleAdapter', function (world: WeaponPipelineWorld) {
  world.wpMockAdapter = {
    promptTile: vi.fn(),
    promptOptions: vi.fn(),
    promptEntity: vi.fn(),
    animate: vi.fn(async () => {}),
    log: vi.fn(),
    showPlayerTurn: vi.fn(),
    awaitPlayerAction: vi.fn(),
    transition: vi.fn(),
    delay: vi.fn(),
    notifyBeadsChanged: vi.fn(),
  } as unknown as BattleAdapter;

  // Add adapter to the game context so AttackEffect can use it for defensive reactions
  if (world.wpGameContext) {
    world.wpGameContext.adapter = world.wpMockAdapter;
  }
});

// ===== Entity Setup =====

Given(
  'a weapon pipeline attacker at {int},{int}',
  function (world: WeaponPipelineWorld, x: number, y: number) {
    if (!world.wpGrid) {
      throw new Error('Grid not initialized');
    }
    if (!world.wpEntities) {
      world.wpEntities = new Map();
    }

    world.wpAttacker = new Entity('wp-attacker', 100, world.wpGrid);
    world.wpGrid.register('wp-attacker', x, y);
    world.wpEntities.set('wp-attacker', world.wpAttacker);
  }
);

Given(
  'a weapon pipeline target at {int},{int} with {int} health and {int} armor {int} guard {int} evasion',
  function (
    world: WeaponPipelineWorld,
    x: number,
    y: number,
    health: number,
    armor: number,
    guard: number,
    evasion: number
  ) {
    if (!world.wpGrid) {
      throw new Error('Grid not initialized');
    }
    if (!world.wpEntities) {
      world.wpEntities = new Map();
    }

    world.wpTarget = new Entity('wp-target', health, world.wpGrid);
    world.wpTarget.setArmor(armor);
    world.wpTarget.setGuard(guard);
    world.wpTarget.setEvasion(evasion);
    world.wpGrid.register('wp-target', x, y);
    world.wpEntities.set('wp-target', world.wpTarget);
  }
);

// ===== Action Execution =====

When(
  'I execute a weapon attack with power {int} and agility {int}',
  async function (world: WeaponPipelineWorld, power: number, agility: number) {
    if (!world.wpGameContext) {
      throw new Error('Game context not initialized');
    }
    if (!world.wpMockAdapter) {
      throw new Error('Mock adapter not initialized');
    }
    if (!world.wpAttacker || !world.wpTarget) {
      throw new Error('Attacker or target not initialized');
    }

    // Create AttackEffect
    const attackEffect = new AttackEffect();

    // Create HydratedEffect with weapon stats as direct params
    const hydratedEffects: HydratedEffect[] = [
      {
        id: 'attack-1',
        type: 'attack',
        effect: attackEffect,
        params: {
          targetEntity: 'wp-target',
          power,
          agility,
        },
      },
    ];

    // Create ActionDefinition
    const definition: ActionDefinition = {
      id: 'weapon-attack',
      name: 'Weapon Attack',
      category: 'attack',
      cost: { time: 2 },
      parameters: [],
      effects: [
        {
          id: 'attack-1',
          type: 'attack',
          params: {
            targetEntity: 'wp-target',
            power,
            agility,
          },
        },
      ],
    };

    // Create Action with context factory
    const contextFactory = (_actorId: string): GameContext => world.wpGameContext!;
    const action = new Action(definition, hydratedEffects, contextFactory);

    // Create ActionResolution and execute
    const resolution = new ActionResolution(
      action,
      'wp-attacker',
      world.wpGameContext,
      world.wpMockAdapter
    );
    world.wpResult = await resolution.execute();
  }
);

// ===== Result Assertions =====

Then('the weapon pipeline result should succeed', function (world: WeaponPipelineWorld) {
  expect(world.wpResult).toBeDefined();
  expect(world.wpResult!.success).toBe(true);
});

Then('the weapon pipeline result should fail', function (world: WeaponPipelineWorld) {
  expect(world.wpResult).toBeDefined();
  expect(world.wpResult!.success).toBe(false);
});

Then(
  'the weapon pipeline outcome should be {string}',
  function (world: WeaponPipelineWorld, expectedOutcome: string) {
    expect(world.wpResult).toBeDefined();
    expect(world.wpResult!.data).toBeDefined();
    expect(world.wpResult!.data.outcome).toBe(expectedOutcome);
  }
);

Then(
  'the weapon pipeline target health should be less than {int}',
  function (world: WeaponPipelineWorld, expectedMax: number) {
    expect(world.wpTarget).toBeDefined();
    expect(world.wpTarget!.currentHealth).toBeLessThan(expectedMax);
  }
);

Then(
  'the weapon pipeline target should have {int} health',
  function (world: WeaponPipelineWorld, expectedHealth: number) {
    expect(world.wpTarget).toBeDefined();
    expect(world.wpTarget!.currentHealth).toBe(expectedHealth);
  }
);

Then(
  'the weapon pipeline result should have animation events',
  function (world: WeaponPipelineWorld) {
    expect(world.wpResult).toBeDefined();
    expect(world.wpResult!.events).toBeDefined();
    expect(world.wpResult!.events.length).toBeGreaterThan(0);
  }
);
