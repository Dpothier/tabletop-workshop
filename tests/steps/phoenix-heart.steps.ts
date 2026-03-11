import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { StabilizeEffect } from '@src/effects/StabilizeEffect';
import { PhoenixBurstEffect } from '@src/effects/PhoenixBurstEffect';

interface PhoenixWorld extends QuickPickleWorld {
  // Unit test context
  phoenixTestGrid?: BattleGrid;
  phoenixTestEntities?: Map<string, Entity>;
  phoenixTestGameContext?: GameContext;
  phoenixTestCaster?: Entity;
  phoenixTestStabilizeEffect?: StabilizeEffect;
  phoenixTestBurstEffect?: PhoenixBurstEffect;
  phoenixTestStabilizeResult?: EffectResult;
  phoenixTestBurstResult?: EffectResult;
  phoenixTestCost?: { windup: number; whiteBeads: number };
  phoenixTestAllyAcceptance?: Map<string, boolean>;

  // Integration test context
  phoenixIntegrationGrid?: BattleGrid;
  phoenixIntegrationEntities?: Map<string, Entity>;
  phoenixIntegrationGameContext?: GameContext;
  phoenixIntegrationCaster?: Entity;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a phoenix test grid of {int}x{int}',
  function (world: PhoenixWorld, width: number, height: number) {
    world.phoenixTestGrid = new BattleGrid(width, height);
  }
);

Given('a phoenix test game context with the grid', function (world: PhoenixWorld) {
  if (!world.phoenixTestGrid) {
    world.phoenixTestGrid = new BattleGrid(12, 12);
  }
  if (!world.phoenixTestEntities) {
    world.phoenixTestEntities = new Map();
  }

  world.phoenixTestGameContext = {
    grid: world.phoenixTestGrid,
    actorId: 'phoenix-test-caster',
    getEntity(id: string): Entity | undefined {
      return world.phoenixTestEntities?.get(id);
    },
    getBeadHand(_entityId: string) {
      return undefined;
    },
  };

  world.phoenixTestStabilizeEffect = new StabilizeEffect();
  world.phoenixTestBurstEffect = new PhoenixBurstEffect();
  world.phoenixTestAllyAcceptance = new Map();
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a phoenix test caster at position {int},{int}',
  function (world: PhoenixWorld, x: number, y: number) {
    if (!world.phoenixTestGrid) {
      world.phoenixTestGrid = new BattleGrid(12, 12);
    }
    if (!world.phoenixTestEntities) {
      world.phoenixTestEntities = new Map();
    }

    const casterId = 'phoenix-test-caster';
    world.phoenixTestCaster = new Entity(casterId, 50, world.phoenixTestGrid);
    world.phoenixTestCaster.currentHealth = 50;
    world.phoenixTestEntities.set(casterId, world.phoenixTestCaster);
    world.phoenixTestGrid.register(casterId, x, y);
  }
);

Given(
  'a phoenix test ally {string} at position {int},{int} with {int} max health and {int} current health',
  function (
    world: PhoenixWorld,
    allyName: string,
    x: number,
    y: number,
    maxHealth: number,
    currentHealth: number
  ) {
    if (!world.phoenixTestGrid) {
      world.phoenixTestGrid = new BattleGrid(12, 12);
    }
    if (!world.phoenixTestEntities) {
      world.phoenixTestEntities = new Map();
    }

    const ally = new Entity(allyName, maxHealth, world.phoenixTestGrid);
    ally.currentHealth = currentHealth;
    world.phoenixTestEntities.set(allyName, ally);
    world.phoenixTestGrid.register(allyName, x, y);
  }
);

Given(
  'a phoenix test enemy {string} at position {int},{int} with {int} ward',
  function (world: PhoenixWorld, enemyName: string, x: number, y: number, ward: number) {
    if (!world.phoenixTestGrid) {
      world.phoenixTestGrid = new BattleGrid(12, 12);
    }
    if (!world.phoenixTestEntities) {
      world.phoenixTestEntities = new Map();
    }

    const enemy = new Entity(enemyName, 30, world.phoenixTestGrid);
    enemy.currentHealth = 30;
    enemy.ward = ward;
    world.phoenixTestEntities.set(enemyName, enemy);
    world.phoenixTestGrid.register(enemyName, x, y);
  }
);

Given(
  'a phoenix test ally-in-burst {string} at position {int},{int} with {int} max health and {int} current health accepting',
  function (
    world: PhoenixWorld,
    allyName: string,
    x: number,
    y: number,
    maxHealth: number,
    currentHealth: number
  ) {
    if (!world.phoenixTestGrid) {
      world.phoenixTestGrid = new BattleGrid(12, 12);
    }
    if (!world.phoenixTestEntities) {
      world.phoenixTestEntities = new Map();
    }
    if (!world.phoenixTestAllyAcceptance) {
      world.phoenixTestAllyAcceptance = new Map();
    }

    const ally = new Entity(allyName, maxHealth, world.phoenixTestGrid);
    ally.currentHealth = currentHealth;
    world.phoenixTestEntities.set(allyName, ally);
    world.phoenixTestGrid.register(allyName, x, y);
    world.phoenixTestAllyAcceptance.set(allyName, true);
  }
);

Given(
  'a phoenix test ally-in-burst {string} at position {int},{int} with {int} max health and {int} current health resisting',
  function (
    world: PhoenixWorld,
    allyName: string,
    x: number,
    y: number,
    maxHealth: number,
    currentHealth: number
  ) {
    if (!world.phoenixTestGrid) {
      world.phoenixTestGrid = new BattleGrid(12, 12);
    }
    if (!world.phoenixTestEntities) {
      world.phoenixTestEntities = new Map();
    }
    if (!world.phoenixTestAllyAcceptance) {
      world.phoenixTestAllyAcceptance = new Map();
    }

    const ally = new Entity(allyName, maxHealth, world.phoenixTestGrid);
    ally.currentHealth = currentHealth;
    world.phoenixTestEntities.set(allyName, ally);
    world.phoenixTestGrid.register(allyName, x, y);
    world.phoenixTestAllyAcceptance.set(allyName, false);
  }
);

// ============================================================================
// UNIT TEST - Effect Execution
// ============================================================================

When(
  'the phoenix test stabilize effect is executed targeting {string}',
  function (world: PhoenixWorld, targetId: string) {
    if (!world.phoenixTestStabilizeEffect) {
      world.phoenixTestStabilizeEffect = new StabilizeEffect();
    }

    world.phoenixTestStabilizeResult = world.phoenixTestStabilizeEffect.execute(
      world.phoenixTestGameContext!,
      { targetId },
      {},
      new Map()
    );
  }
);

When(
  'the phoenix test stabilize effect is executed with range targeting {string}',
  function (world: PhoenixWorld, targetId: string) {
    if (!world.phoenixTestStabilizeEffect) {
      world.phoenixTestStabilizeEffect = new StabilizeEffect();
    }

    world.phoenixTestStabilizeResult = world.phoenixTestStabilizeEffect.execute(
      world.phoenixTestGameContext!,
      { targetId },
      { range: true },
      new Map()
    );
  }
);

When(
  'the phoenix test burst effect is executed with target position {int},{int}',
  function (world: PhoenixWorld, targetX: number, targetY: number) {
    if (!world.phoenixTestBurstEffect) {
      world.phoenixTestBurstEffect = new PhoenixBurstEffect();
    }

    const chainResults = new Map();
    chainResults.set('phoenix-stabilize-1', {
      success: true,
      data: { targetPosition: { x: targetX, y: targetY } },
    });

    world.phoenixTestBurstResult = world.phoenixTestBurstEffect.execute(
      world.phoenixTestGameContext!,
      { targetPosition: { x: targetX, y: targetY } },
      { allyAcceptance: world.phoenixTestAllyAcceptance },
      chainResults
    );
  }
);

When(
  'the phoenix test burst effect is executed with ignite and target position {int},{int}',
  function (world: PhoenixWorld, targetX: number, targetY: number) {
    if (!world.phoenixTestBurstEffect) {
      world.phoenixTestBurstEffect = new PhoenixBurstEffect();
    }

    const chainResults = new Map();
    chainResults.set('phoenix-stabilize-1', {
      success: true,
      data: { targetPosition: { x: targetX, y: targetY } },
    });

    world.phoenixTestBurstResult = world.phoenixTestBurstEffect.execute(
      world.phoenixTestGameContext!,
      { targetPosition: { x: targetX, y: targetY } },
      { ignite: true, allyAcceptance: world.phoenixTestAllyAcceptance },
      chainResults
    );
  }
);

// ============================================================================
// UNIT TEST - Entity State Assertions
// ============================================================================

Then(
  'the phoenix test ally {string} should have {int} stabilized wound',
  function (world: PhoenixWorld, allyName: string, expectedWounds: number) {
    const ally = world.phoenixTestEntities!.get(allyName);
    expect(ally).toBeDefined();
    expect(ally!.stabilizedWounds).toBe(expectedWounds);
  }
);

Then(
  'the phoenix test ally {string} should have a hand size of {int}',
  function (world: PhoenixWorld, allyName: string, expectedHandSize: number) {
    const ally = world.phoenixTestEntities!.get(allyName);
    expect(ally).toBeDefined();
    expect(ally!.getHandSize()).toBe(expectedHandSize);
  }
);

Then(
  'the phoenix test enemy {string} should have taken {int} damage',
  function (world: PhoenixWorld, enemyName: string, expectedDamage: number) {
    const enemy = world.phoenixTestEntities!.get(enemyName);
    expect(enemy).toBeDefined();
    const healthLost = 30 - enemy!.currentHealth;
    expect(healthLost).toBe(expectedDamage);
  }
);

Then(
  'the phoenix test entity {string} should have taken {int} damage',
  function (world: PhoenixWorld, entityName: string, expectedDamage: number) {
    const entity = world.phoenixTestEntities!.get(entityName);
    expect(entity).toBeDefined();
    const currentHealth = entity!.currentHealth;
    const maxHealth = entity!.maxHealth;
    const healthLost = maxHealth - currentHealth;
    expect(healthLost).toBe(expectedDamage);
  }
);

Then(
  'the phoenix test enemy {string} should have burn status',
  function (world: PhoenixWorld, enemyName: string) {
    const enemy = world.phoenixTestEntities!.get(enemyName);
    expect(enemy).toBeDefined();
    const burnStacks = enemy!.getStacks('burn');
    expect(burnStacks).toBeGreaterThan(0);
  }
);

// ============================================================================
// UNIT TEST - Cost Verification
// ============================================================================

When('I check the phoenix test action cost from YAML', function (world: PhoenixWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number; beads?: { white?: number } } }>;
  };
  const phoenixAction = data.actions?.find((a: { id: string }) => a.id === 'phoenix_rebirth');

  if (!phoenixAction) {
    throw new Error('Phoenix Rebirth action not found in YAML');
  }

  world.phoenixTestCost = {
    windup: phoenixAction.cost?.time ?? 2,
    whiteBeads: phoenixAction.cost?.beads?.white ?? 1,
  };
});

Then(
  'the phoenix test cost should have {int} windup',
  function (world: PhoenixWorld, expectedWindup: number) {
    expect(world.phoenixTestCost?.windup).toBe(expectedWindup);
  }
);

Then(
  'the phoenix test cost should have {int} white bead',
  function (world: PhoenixWorld, expectedBeads: number) {
    expect(world.phoenixTestCost?.whiteBeads).toBe(expectedBeads);
  }
);

// ============================================================================
// UNIT TEST - Enhancement Prerequisites
// ============================================================================

When(
  'I check the phoenix test ignite enhancement requires from YAML',
  function (world: PhoenixWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; enhancements?: Array<any> }>;
    };
    const phoenixAction = data.actions?.find((a: { id: string }) => a.id === 'phoenix_rebirth');

    if (!phoenixAction) {
      throw new Error('Phoenix Rebirth action not found in YAML');
    }

    (world as any).phoenixIgniteEnhancements = phoenixAction.enhancements || [];
  }
);

Then(
  'the phoenix test ignite should require {string}',
  function (world: PhoenixWorld, requirement: string) {
    const enhancements = (world as any).phoenixIgniteEnhancements;
    expect(enhancements).toBeDefined();
    expect(Array.isArray(enhancements)).toBe(true);

    const ignite = enhancements.find((e: { id: string }) => e.id === 'ignite');
    expect(ignite).toBeDefined();
    expect(ignite.requires).toBe(requirement);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a phoenix integration grid of {int}x{int}',
  function (world: PhoenixWorld, width: number, height: number) {
    world.phoenixIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a phoenix integration game context with the grid', function (world: PhoenixWorld) {
  if (!world.phoenixIntegrationGrid) {
    world.phoenixIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.phoenixIntegrationEntities) {
    world.phoenixIntegrationEntities = new Map();
  }

  world.phoenixIntegrationGameContext = {
    grid: world.phoenixIntegrationGrid,
    actorId: 'phoenix-integration-caster',
    getEntity(id: string): Entity | undefined {
      return world.phoenixIntegrationEntities?.get(id);
    },
    getBeadHand(_entityId: string) {
      return undefined;
    },
  };
});

Given(
  'a phoenix integration caster at position {int},{int}',
  function (world: PhoenixWorld, x: number, y: number) {
    if (!world.phoenixIntegrationGrid) {
      world.phoenixIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.phoenixIntegrationEntities) {
      world.phoenixIntegrationEntities = new Map();
    }

    const casterId = 'phoenix-integration-caster';
    world.phoenixIntegrationCaster = new Entity(casterId, 50, world.phoenixIntegrationGrid);
    world.phoenixIntegrationCaster.currentHealth = 50;
    world.phoenixIntegrationEntities.set(casterId, world.phoenixIntegrationCaster);
    world.phoenixIntegrationGrid.register(casterId, x, y);
  }
);

Given(
  'a phoenix integration ally {string} at position {int},{int} with {int} max health and {int} current health',
  function (
    world: PhoenixWorld,
    allyName: string,
    x: number,
    y: number,
    maxHealth: number,
    currentHealth: number
  ) {
    if (!world.phoenixIntegrationGrid) {
      world.phoenixIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.phoenixIntegrationEntities) {
      world.phoenixIntegrationEntities = new Map();
    }

    const allyId = `phoenix-integration-${allyName}`;
    const ally = new Entity(allyId, maxHealth, world.phoenixIntegrationGrid);
    ally.currentHealth = currentHealth;
    world.phoenixIntegrationEntities.set(allyId, ally);
    world.phoenixIntegrationGrid.register(allyId, x, y);
  }
);

Given(
  'a phoenix integration enemy {string} at position {int},{int} with {int} ward',
  function (world: PhoenixWorld, enemyName: string, x: number, y: number, ward: number) {
    if (!world.phoenixIntegrationGrid) {
      world.phoenixIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.phoenixIntegrationEntities) {
      world.phoenixIntegrationEntities = new Map();
    }

    const enemyId = `phoenix-integration-${enemyName}`;
    const enemy = new Entity(enemyId, 30, world.phoenixIntegrationGrid);
    enemy.currentHealth = 30;
    enemy.ward = ward;
    world.phoenixIntegrationEntities.set(enemyId, enemy);
    world.phoenixIntegrationGrid.register(enemyId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Spell Casting
// ============================================================================

When(
  'the phoenix integration full chain is cast targeting {string} with burst and ignite',
  function (world: PhoenixWorld, allyName: string) {
    const stabilizeEffect = new StabilizeEffect();
    const burstEffect = new PhoenixBurstEffect();

    const allyId = allyName.startsWith('phoenix-integration-')
      ? allyName
      : `phoenix-integration-${allyName}`;
    const allyEntity = world.phoenixIntegrationEntities!.get(allyId);
    const allyPos = world.phoenixIntegrationGrid!.getPosition(allyId);

    if (!allyEntity || !allyPos) {
      throw new Error(`Ally ${allyId} not found in grid`);
    }

    const stabilizeResult = stabilizeEffect.execute(
      world.phoenixIntegrationGameContext!,
      { targetId: allyId },
      {},
      new Map()
    );

    const chainResults = new Map();
    chainResults.set('phoenix-stabilize-1', stabilizeResult);

    burstEffect.execute(
      world.phoenixIntegrationGameContext!,
      { targetPosition: allyPos },
      { ignite: true, allyAcceptance: new Map() },
      chainResults
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Entity State Assertions
// ============================================================================

Then(
  'the phoenix integration ally {string} should have {int} stabilized wound',
  function (world: PhoenixWorld, allyName: string, expectedWounds: number) {
    const allyId = allyName.startsWith('phoenix-integration-')
      ? allyName
      : `phoenix-integration-${allyName}`;
    const ally = world.phoenixIntegrationEntities!.get(allyId);
    expect(ally).toBeDefined();
    expect(ally!.stabilizedWounds).toBe(expectedWounds);
  }
);

Then(
  'the phoenix integration enemy {string} should have taken {int} damage',
  function (world: PhoenixWorld, enemyName: string, expectedDamage: number) {
    const enemyId = enemyName.startsWith('phoenix-integration-')
      ? enemyName
      : `phoenix-integration-${enemyName}`;
    const enemy = world.phoenixIntegrationEntities!.get(enemyId);
    expect(enemy).toBeDefined();
    const healthLost = 30 - enemy!.currentHealth;
    expect(healthLost).toBe(expectedDamage);
  }
);

Then(
  'the phoenix integration enemy {string} should have burn status',
  function (world: PhoenixWorld, enemyName: string) {
    const enemyId = enemyName.startsWith('phoenix-integration-')
      ? enemyName
      : `phoenix-integration-${enemyName}`;
    const enemy = world.phoenixIntegrationEntities!.get(enemyId);
    expect(enemy).toBeDefined();
    const burnStacks = enemy!.getStacks('burn');
    expect(burnStacks).toBeGreaterThan(0);
  }
);

Then(
  'the phoenix integration caster should be at position {int},{int}',
  function (world: PhoenixWorld, expectedX: number, expectedY: number) {
    const position = world.phoenixIntegrationGrid!.getPosition('phoenix-integration-caster');
    expect(position).toBeDefined();
    expect(position?.x).toBe(expectedX);
    expect(position?.y).toBe(expectedY);
  }
);
