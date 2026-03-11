import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { RallyEffect } from '@src/effects/RallyEffect';
import { InspireEffect } from '@src/effects/InspireEffect';

interface BannerWorld extends QuickPickleWorld {
  // Unit test
  bannerTestGrid?: BattleGrid;
  bannerTestEntities?: Map<string, Entity>;
  bannerTestBeadHands?: Map<string, PlayerBeadSystem>;
  bannerTestGameContext?: GameContext;
  bannerTestBearer?: Entity;
  bannerTestBearerBeadHand?: PlayerBeadSystem;
  bannerTestRallyResult?: EffectResult;
  bannerTestInspireResult?: EffectResult;
  bannerTestRallyCost?: { whiteBeads: number };
  bannerTestInspireCost?: { whiteBeads: number };
  bannerTestEquipment?: { slot: string; category: string };

  // Integration test
  bannerIntegrationGrid?: BattleGrid;
  bannerIntegrationEntities?: Map<string, Entity>;
  bannerIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  bannerIntegrationGameContext?: GameContext;
  bannerIntegrationBearer?: Entity;
  bannerIntegrationBearerBeadHand?: PlayerBeadSystem;
  bannerIntegrationRallyResult?: EffectResult;
  bannerIntegrationInspireResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a banner test grid of {int}x{int}',
  function (world: BannerWorld, width: number, height: number) {
    world.bannerTestGrid = new BattleGrid(width, height);
  }
);

Given('a banner test game context with the grid', function (world: BannerWorld) {
  if (!world.bannerTestGrid) {
    world.bannerTestGrid = new BattleGrid(12, 12);
  }
  if (!world.bannerTestEntities) {
    world.bannerTestEntities = new Map();
  }
  if (!world.bannerTestBeadHands) {
    world.bannerTestBeadHands = new Map();
  }

  world.bannerTestGameContext = {
    grid: world.bannerTestGrid,
    actorId: 'banner-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.bannerTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.bannerTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a banner test bearer at position {int},{int} with bead hand having {int} white',
  function (world: BannerWorld, x: number, y: number, white: number) {
    if (!world.bannerTestGrid) {
      world.bannerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.bannerTestEntities) {
      world.bannerTestEntities = new Map();
    }
    if (!world.bannerTestBeadHands) {
      world.bannerTestBeadHands = new Map();
    }

    const bearerId = 'banner-test-bearer';
    world.bannerTestBearer = new Entity(bearerId, 50, world.bannerTestGrid);
    world.bannerTestBearer.currentHealth = 50;
    world.bannerTestEntities.set(bearerId, world.bannerTestBearer);
    world.bannerTestGrid.register(bearerId, x, y);

    // Set up bearer's bead hand with specific white beads
    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green: 0, white });
    world.bannerTestBearerBeadHand = beadHand;
    world.bannerTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a banner test ally {string} at position {int},{int} with {int} windup stacks',
  function (world: BannerWorld, allyName: string, x: number, y: number, windupStacks: number) {
    if (!world.bannerTestGrid) {
      world.bannerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.bannerTestEntities) {
      world.bannerTestEntities = new Map();
    }
    if (!world.bannerTestBeadHands) {
      world.bannerTestBeadHands = new Map();
    }

    const ally = new Entity(allyName, 30, world.bannerTestGrid);
    ally.currentHealth = 30;
    if (windupStacks > 0) {
      ally.addStacks('windup', windupStacks);
    }
    world.bannerTestEntities.set(allyName, ally);
    world.bannerTestGrid.register(allyName, x, y);
  }
);

Given(
  'a banner test ally {string} at position {int},{int} with {int} guard',
  function (world: BannerWorld, allyName: string, x: number, y: number, guardValue: number) {
    if (!world.bannerTestGrid) {
      world.bannerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.bannerTestEntities) {
      world.bannerTestEntities = new Map();
    }
    if (!world.bannerTestBeadHands) {
      world.bannerTestBeadHands = new Map();
    }

    const ally = new Entity(allyName, 30, world.bannerTestGrid);
    ally.currentHealth = 30;
    ally.setGuard(guardValue);
    world.bannerTestEntities.set(allyName, ally);
    world.bannerTestGrid.register(allyName, x, y);
  }
);

// ============================================================================
// UNIT TEST - Rally Effect Execution
// ============================================================================

When(
  'the banner test rally is triggered for {string}',
  function (world: BannerWorld, allyId: string) {
    if (!world.bannerTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new RallyEffect();
    world.bannerTestRallyResult = effect.execute(
      world.bannerTestGameContext,
      { targetId: allyId },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Inspire Effect Execution
// ============================================================================

When(
  'the banner test inspire is triggered for {string}',
  function (world: BannerWorld, allyId: string) {
    if (!world.bannerTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new InspireEffect();
    world.bannerTestInspireResult = effect.execute(
      world.bannerTestGameContext,
      { targetId: allyId },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Assertions: Rally Result
// ============================================================================

Then('the banner test rally result should be successful', function (world: BannerWorld) {
  expect(world.bannerTestRallyResult).toBeDefined();
  expect(world.bannerTestRallyResult?.success).toBe(true);
});

Then('the banner test rally result should have failed', function (world: BannerWorld) {
  expect(world.bannerTestRallyResult).toBeDefined();
  expect(world.bannerTestRallyResult?.success).toBe(false);
});

// ============================================================================
// UNIT TEST - Assertions: Inspire Result
// ============================================================================

Then('the banner test inspire result should be successful', function (world: BannerWorld) {
  expect(world.bannerTestInspireResult).toBeDefined();
  expect(world.bannerTestInspireResult?.success).toBe(true);
});

Then('the banner test inspire result should have failed', function (world: BannerWorld) {
  expect(world.bannerTestInspireResult).toBeDefined();
  expect(world.bannerTestInspireResult?.success).toBe(false);
});

// ============================================================================
// UNIT TEST - Assertions: Ally Stacks and Guard
// ============================================================================

Then(
  'the banner test ally {string} should still have {int} windup stacks',
  function (world: BannerWorld, allyId: string, expected: number) {
    const ally = world.bannerTestEntities?.get(allyId);
    if (!ally) {
      throw new Error(`Ally ${allyId} not found`);
    }
    expect(ally.getStacks('windup')).toBe(expected);
  }
);

Then(
  'the banner test ally {string} should have {int} guard',
  function (world: BannerWorld, allyId: string, expected: number) {
    const ally = world.bannerTestEntities?.get(allyId);
    if (!ally) {
      throw new Error(`Ally ${allyId} not found`);
    }
    expect(ally.guard).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Cost from YAML
// ============================================================================

When('I check the banner test rally action cost from YAML', function (world: BannerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { beads?: { white?: number } } }>;
  };
  const rallyAction = data.actions?.find((a: { id: string }) => a.id === 'rally');

  if (!rallyAction) {
    throw new Error('Rally action not found in YAML');
  }

  world.bannerTestRallyCost = {
    whiteBeads: rallyAction.cost?.beads?.white ?? 0,
  };
});

Then(
  'the banner test rally cost should have {int} white bead',
  function (world: BannerWorld, expected: number) {
    expect(world.bannerTestRallyCost).toBeDefined();
    expect(world.bannerTestRallyCost?.whiteBeads).toBe(expected);
  }
);

When('I check the banner test inspire action cost from YAML', function (world: BannerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { beads?: { white?: number } } }>;
  };
  const inspireAction = data.actions?.find((a: { id: string }) => a.id === 'inspire');

  if (!inspireAction) {
    throw new Error('Inspire action not found in YAML');
  }

  world.bannerTestInspireCost = {
    whiteBeads: inspireAction.cost?.beads?.white ?? 0,
  };
});

Then(
  'the banner test inspire cost should have {int} white bead',
  function (world: BannerWorld, expected: number) {
    expect(world.bannerTestInspireCost).toBeDefined();
    expect(world.bannerTestInspireCost?.whiteBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the banner test equipment from YAML', function (world: BannerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{ id: string; slot: string; category: string }>;
  };
  const bannerEquipment = data.equipment?.find((e: { id: string }) => e.id === 'banner');

  if (!bannerEquipment) {
    throw new Error('Banner equipment not found in YAML');
  }

  world.bannerTestEquipment = {
    slot: bannerEquipment.slot,
    category: bannerEquipment.category,
  };
});

Then(
  'the banner test equipment slot should be {string}',
  function (world: BannerWorld, expected: string) {
    expect(world.bannerTestEquipment).toBeDefined();
    expect(world.bannerTestEquipment?.slot).toBe(expected);
  }
);

Then(
  'the banner test equipment category should be {string}',
  function (world: BannerWorld, expected: string) {
    expect(world.bannerTestEquipment).toBeDefined();
    expect(world.bannerTestEquipment?.category).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a banner integration grid of {int}x{int}',
  function (world: BannerWorld, width: number, height: number) {
    world.bannerIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a banner integration game context with the grid', function (world: BannerWorld) {
  if (!world.bannerIntegrationGrid) {
    world.bannerIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.bannerIntegrationEntities) {
    world.bannerIntegrationEntities = new Map();
  }
  if (!world.bannerIntegrationBeadHands) {
    world.bannerIntegrationBeadHands = new Map();
  }

  world.bannerIntegrationGameContext = {
    grid: world.bannerIntegrationGrid,
    actorId: 'banner-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.bannerIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.bannerIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a banner integration bearer at position {int},{int} with bead hand having {int} white',
  function (world: BannerWorld, x: number, y: number, white: number) {
    if (!world.bannerIntegrationGrid) {
      world.bannerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.bannerIntegrationEntities) {
      world.bannerIntegrationEntities = new Map();
    }
    if (!world.bannerIntegrationBeadHands) {
      world.bannerIntegrationBeadHands = new Map();
    }

    const bearerId = 'banner-integration-bearer';
    world.bannerIntegrationBearer = new Entity(bearerId, 50, world.bannerIntegrationGrid);
    world.bannerIntegrationBearer.currentHealth = 50;
    world.bannerIntegrationEntities.set(bearerId, world.bannerIntegrationBearer);
    world.bannerIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green: 0, white });
    world.bannerIntegrationBearerBeadHand = beadHand;
    world.bannerIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a banner integration ally {string} at position {int},{int} with {int} windup stacks',
  function (world: BannerWorld, allyName: string, x: number, y: number, windupStacks: number) {
    if (!world.bannerIntegrationGrid) {
      world.bannerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.bannerIntegrationEntities) {
      world.bannerIntegrationEntities = new Map();
    }
    if (!world.bannerIntegrationBeadHands) {
      world.bannerIntegrationBeadHands = new Map();
    }

    const allyId = `banner-integration-${allyName}`;
    const ally = new Entity(allyId, 30, world.bannerIntegrationGrid);
    ally.currentHealth = 30;
    if (windupStacks > 0) {
      ally.addStacks('windup', windupStacks);
    }
    world.bannerIntegrationEntities.set(allyId, ally);
    world.bannerIntegrationGrid.register(allyId, x, y);
  }
);

Given(
  'a banner integration ally {string} at position {int},{int} with {int} guard',
  function (world: BannerWorld, allyName: string, x: number, y: number, guardValue: number) {
    if (!world.bannerIntegrationGrid) {
      world.bannerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.bannerIntegrationEntities) {
      world.bannerIntegrationEntities = new Map();
    }
    if (!world.bannerIntegrationBeadHands) {
      world.bannerIntegrationBeadHands = new Map();
    }

    const allyId = `banner-integration-${allyName}`;
    const ally = new Entity(allyId, 30, world.bannerIntegrationGrid);
    ally.currentHealth = 30;
    ally.setGuard(guardValue);
    world.bannerIntegrationEntities.set(allyId, ally);
    world.bannerIntegrationGrid.register(allyId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Interruption Handling
// ============================================================================

When(
  'the banner integration ally {string} would be interrupted',
  function (world: BannerWorld, allyId: string) {
    // Just mark that the ally would be interrupted
    // The actual interruption logic happens implicitly in the system
    (world as any).bannerIntegrationInterruptionPending = allyId;
  }
);

// ============================================================================
// INTEGRATION TEST - Rally Execution
// ============================================================================

When(
  'the banner integration rally is triggered for {string}',
  function (world: BannerWorld, allyId: string) {
    if (!world.bannerIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new RallyEffect();
    world.bannerIntegrationRallyResult = effect.execute(
      world.bannerIntegrationGameContext,
      { targetId: allyId },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Inspire Execution
// ============================================================================

When(
  'the banner integration inspire is triggered for {string}',
  function (world: BannerWorld, allyId: string) {
    if (!world.bannerIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new InspireEffect();
    world.bannerIntegrationInspireResult = effect.execute(
      world.bannerIntegrationGameContext,
      { targetId: allyId },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions: Rally Result
// ============================================================================

Then('the banner integration rally result should be successful', function (world: BannerWorld) {
  expect(world.bannerIntegrationRallyResult).toBeDefined();
  expect(world.bannerIntegrationRallyResult?.success).toBe(true);
});

// ============================================================================
// INTEGRATION TEST - Assertions: Inspire Result
// ============================================================================

Then('the banner integration inspire result should be successful', function (world: BannerWorld) {
  expect(world.bannerIntegrationInspireResult).toBeDefined();
  expect(world.bannerIntegrationInspireResult?.success).toBe(true);
});

// ============================================================================
// INTEGRATION TEST - Assertions: Ally Stacks and Guard
// ============================================================================

Then(
  'the banner integration ally {string} should have {int} windup stacks',
  function (world: BannerWorld, allyId: string, expected: number) {
    const ally = world.bannerIntegrationEntities?.get(allyId);
    if (!ally) {
      throw new Error(`Ally ${allyId} not found`);
    }
    expect(ally.getStacks('windup')).toBe(expected);
  }
);

Then(
  'the banner integration ally {string} should have {int} guard',
  function (world: BannerWorld, allyId: string, expected: number) {
    const ally = world.bannerIntegrationEntities?.get(allyId);
    if (!ally) {
      throw new Error(`Ally ${allyId} not found`);
    }
    expect(ally.guard).toBe(expected);
  }
);
