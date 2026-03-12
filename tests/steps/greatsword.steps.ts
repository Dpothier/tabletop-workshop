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
import { CleaveEffect } from '@src/effects/CleaveEffect';
import { SweepEffect } from '@src/effects/SweepEffect';

interface GreatswordWorld extends QuickPickleWorld {
  // Unit test
  greatswordTestGrid?: BattleGrid;
  greatswordTestEntities?: Map<string, Entity>;
  greatswordTestBeadHands?: Map<string, PlayerBeadSystem>;
  greatswordTestGameContext?: GameContext;
  greatswordTestBearer?: Entity;
  greatswordTestBearerBeadHand?: PlayerBeadSystem;
  greatswordTestCleaveResult?: EffectResult;
  greatswordTestSweepResult?: EffectResult;
  greatswordTestCleaveCost?: { redBeads: number };
  greatswordTestSweepCost?: { greenBeads: number };
  greatswordTestEquipment?: {
    power: number;
    agility: number;
    twoHanded: boolean;
    inventorySlots: number;
    modifiers: string[];
  };
  greatswordTestAdjacentEnemies?: Map<string, Entity>;

  // Integration test
  greatswordIntegrationGrid?: BattleGrid;
  greatswordIntegrationEntities?: Map<string, Entity>;
  greatswordIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  greatswordIntegrationGameContext?: GameContext;
  greatswordIntegrationBearer?: Entity;
  greatswordIntegrationBearerBeadHand?: PlayerBeadSystem;
  greatswordIntegrationCleaveResult?: EffectResult;
  greatswordIntegrationSweepResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a greatsword test grid of {int}x{int}',
  function (world: GreatswordWorld, width: number, height: number) {
    world.greatswordTestGrid = new BattleGrid(width, height);
  }
);

Given('a greatsword test game context with the grid', function (world: GreatswordWorld) {
  if (!world.greatswordTestGrid) {
    world.greatswordTestGrid = new BattleGrid(12, 12);
  }
  if (!world.greatswordTestEntities) {
    world.greatswordTestEntities = new Map();
  }
  if (!world.greatswordTestBeadHands) {
    world.greatswordTestBeadHands = new Map();
  }

  world.greatswordTestGameContext = {
    grid: world.greatswordTestGrid,
    actorId: 'greatsword-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.greatswordTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.greatswordTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a greatsword test bearer at position {int},{int} with bead hand having {int} red',
  function (world: GreatswordWorld, x: number, y: number, red: number) {
    if (!world.greatswordTestGrid) {
      world.greatswordTestGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordTestEntities) {
      world.greatswordTestEntities = new Map();
    }
    if (!world.greatswordTestBeadHands) {
      world.greatswordTestBeadHands = new Map();
    }

    const bearerId = 'greatsword-test-bearer';
    world.greatswordTestBearer = new Entity(bearerId, 50, world.greatswordTestGrid);
    world.greatswordTestBearer.currentHealth = 50;
    world.greatswordTestEntities.set(bearerId, world.greatswordTestBearer);
    world.greatswordTestGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.greatswordTestBearerBeadHand = beadHand;
    world.greatswordTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a greatsword test bearer at position {int},{int} with bead hand having {int} green',
  function (world: GreatswordWorld, x: number, y: number, green: number) {
    if (!world.greatswordTestGrid) {
      world.greatswordTestGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordTestEntities) {
      world.greatswordTestEntities = new Map();
    }
    if (!world.greatswordTestBeadHands) {
      world.greatswordTestBeadHands = new Map();
    }

    const bearerId = 'greatsword-test-bearer';
    world.greatswordTestBearer = new Entity(bearerId, 50, world.greatswordTestGrid);
    world.greatswordTestBearer.currentHealth = 50;
    world.greatswordTestEntities.set(bearerId, world.greatswordTestBearer);
    world.greatswordTestGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green, white: 0 });
    world.greatswordTestBearerBeadHand = beadHand;
    world.greatswordTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a greatsword test bearer at position {int},{int}',
  function (world: GreatswordWorld, x: number, y: number) {
    if (!world.greatswordTestGrid) {
      world.greatswordTestGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordTestEntities) {
      world.greatswordTestEntities = new Map();
    }

    const bearerId = 'greatsword-test-bearer';
    world.greatswordTestBearer = new Entity(bearerId, 50, world.greatswordTestGrid);
    world.greatswordTestBearer.currentHealth = 50;
    world.greatswordTestEntities.set(bearerId, world.greatswordTestBearer);
    world.greatswordTestGrid.register(bearerId, x, y);
  }
);

Given(
  'a greatsword test target {string} at position {int},{int}',
  function (world: GreatswordWorld, targetName: string, x: number, y: number) {
    if (!world.greatswordTestGrid) {
      world.greatswordTestGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordTestEntities) {
      world.greatswordTestEntities = new Map();
    }

    const target = new Entity(targetName, 30, world.greatswordTestGrid);
    target.currentHealth = 30;
    world.greatswordTestEntities.set(targetName, target);
    world.greatswordTestGrid.register(targetName, x, y);
  }
);

Given(
  'a greatsword test adjacent enemy {string} at position {int},{int}',
  function (world: GreatswordWorld, enemyName: string, x: number, y: number) {
    if (!world.greatswordTestGrid) {
      world.greatswordTestGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordTestEntities) {
      world.greatswordTestEntities = new Map();
    }

    const enemy = new Entity(enemyName, 20, world.greatswordTestGrid);
    enemy.currentHealth = 20;
    world.greatswordTestEntities.set(enemyName, enemy);
    world.greatswordTestGrid.register(enemyName, x, y);
  }
);

// ============================================================================
// UNIT TEST - Cleave Effect Execution
// ============================================================================

When(
  'the greatsword test cleave is triggered for {string} with hit outcome {string} and adjacent enemies {string}',
  function (
    world: GreatswordWorld,
    targetId: string,
    hitOutcome: string,
    adjacentEnemyIdsJson: string
  ) {
    if (!world.greatswordTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const adjacentEnemyIds = JSON.parse(adjacentEnemyIdsJson) as string[];
    const effect = new CleaveEffect();
    world.greatswordTestCleaveResult = effect.execute(
      world.greatswordTestGameContext,
      { targetId, hitOutcome, adjacentEnemyIds },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Sweep Effect Execution
// ============================================================================

When(
  'the greatsword test sweep is triggered with targets {string}',
  function (world: GreatswordWorld, targetIdsJson: string) {
    if (!world.greatswordTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const targetIds = JSON.parse(targetIdsJson) as string[];

    const effect = new SweepEffect();
    world.greatswordTestSweepResult = effect.execute(
      world.greatswordTestGameContext,
      { targetIds },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Assertions: Cleave Result
// ============================================================================

Then('the greatsword test cleave result should be successful', function (world: GreatswordWorld) {
  expect(world.greatswordTestCleaveResult).toBeDefined();
  expect(world.greatswordTestCleaveResult?.success).toBe(true);
});

Then(
  'the greatsword test cleave should have damaged {int} adjacent enemies',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordTestCleaveResult).toBeDefined();
    expect(world.greatswordTestCleaveResult?.data?.adjacentsDamaged).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Assertions: Sweep Result
// ============================================================================

Then('the greatsword test sweep result should be successful', function (world: GreatswordWorld) {
  expect(world.greatswordTestSweepResult).toBeDefined();
  expect(world.greatswordTestSweepResult?.success).toBe(true);
});

Then(
  'the greatsword test sweep should have resolved against {int} targets',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordTestSweepResult).toBeDefined();
    expect(world.greatswordTestSweepResult?.data?.targetsHit).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the greatsword test equipment from YAML', function (world: GreatswordWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      power: number;
      agility: number;
      twoHanded: boolean;
      inventorySlots: number;
      grantedModifiers?: string[];
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'greatsword');

  if (!equipment) {
    throw new Error('Greatsword equipment not found in YAML');
  }

  world.greatswordTestEquipment = {
    power: equipment.power,
    agility: equipment.agility,
    twoHanded: equipment.twoHanded,
    inventorySlots: equipment.inventorySlots,
    modifiers: equipment.grantedModifiers ?? [],
  };
});

Then(
  'the greatsword test equipment power should be {int}',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordTestEquipment).toBeDefined();
    expect(world.greatswordTestEquipment?.power).toBe(expected);
  }
);

Then(
  'the greatsword test equipment agility should be {int}',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordTestEquipment).toBeDefined();
    expect(world.greatswordTestEquipment?.agility).toBe(expected);
  }
);

Then(
  'the greatsword test equipment twoHanded should be {word}',
  function (world: GreatswordWorld, expected: string) {
    expect(world.greatswordTestEquipment).toBeDefined();
    expect(world.greatswordTestEquipment?.twoHanded).toBe(expected === 'true');
  }
);

Then(
  'the greatsword test equipment inventorySlots should be {int}',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordTestEquipment).toBeDefined();
    expect(world.greatswordTestEquipment?.inventorySlots).toBe(expected);
  }
);

Then(
  'the greatsword test equipment should have modifier {string}',
  function (world: GreatswordWorld, modifierName: string) {
    expect(world.greatswordTestEquipment).toBeDefined();
    expect(world.greatswordTestEquipment?.modifiers).toContain(modifierName);
  }
);

Then(
  'the greatsword test equipment should have modifiers that are mutually exclusive for {string} and {string}',
  function (world: GreatswordWorld, modifier1: string, modifier2: string) {
    expect(world.greatswordTestEquipment).toBeDefined();
    expect(world.greatswordTestEquipment?.modifiers).toContain(modifier1);
    expect(world.greatswordTestEquipment?.modifiers).toContain(modifier2);
  }
);

// ============================================================================
// UNIT TEST - Cleave Action Cost from YAML
// ============================================================================

When('I check the greatsword test cleave action cost from YAML', function (world: GreatswordWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'cleave');

  if (!action) {
    throw new Error('cleave action not found in YAML');
  }

  world.greatswordTestCleaveCost = {
    redBeads: action.cost?.beads?.red ?? 0,
  };
});

Then(
  'the greatsword test cleave cost should have {int} red bead',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordTestCleaveCost).toBeDefined();
    expect(world.greatswordTestCleaveCost?.redBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Sweep Action Cost from YAML
// ============================================================================

When('I check the greatsword test sweep action cost from YAML', function (world: GreatswordWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{
      id: string;
      cost?: { beads?: { green?: number } };
    }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'sweep');

  if (!action) {
    throw new Error('sweep action not found in YAML');
  }

  world.greatswordTestSweepCost = {
    greenBeads: action.cost?.beads?.green ?? 0,
  };
});

Then(
  'the greatsword test sweep cost should have {int} green bead',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordTestSweepCost).toBeDefined();
    expect(world.greatswordTestSweepCost?.greenBeads).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a greatsword integration grid of {int}x{int}',
  function (world: GreatswordWorld, width: number, height: number) {
    world.greatswordIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a greatsword integration game context with the grid', function (world: GreatswordWorld) {
  if (!world.greatswordIntegrationGrid) {
    world.greatswordIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.greatswordIntegrationEntities) {
    world.greatswordIntegrationEntities = new Map();
  }
  if (!world.greatswordIntegrationBeadHands) {
    world.greatswordIntegrationBeadHands = new Map();
  }

  world.greatswordIntegrationGameContext = {
    grid: world.greatswordIntegrationGrid,
    actorId: 'greatsword-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.greatswordIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.greatswordIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a greatsword integration bearer at position {int},{int} with bead hand having {int} red',
  function (world: GreatswordWorld, x: number, y: number, red: number) {
    if (!world.greatswordIntegrationGrid) {
      world.greatswordIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordIntegrationEntities) {
      world.greatswordIntegrationEntities = new Map();
    }
    if (!world.greatswordIntegrationBeadHands) {
      world.greatswordIntegrationBeadHands = new Map();
    }

    const bearerId = 'greatsword-integration-bearer';
    world.greatswordIntegrationBearer = new Entity(bearerId, 50, world.greatswordIntegrationGrid);
    world.greatswordIntegrationBearer.currentHealth = 50;
    world.greatswordIntegrationEntities.set(bearerId, world.greatswordIntegrationBearer);
    world.greatswordIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.greatswordIntegrationBearerBeadHand = beadHand;
    world.greatswordIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a greatsword integration bearer at position {int},{int} with bead hand having {int} green',
  function (world: GreatswordWorld, x: number, y: number, green: number) {
    if (!world.greatswordIntegrationGrid) {
      world.greatswordIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordIntegrationEntities) {
      world.greatswordIntegrationEntities = new Map();
    }
    if (!world.greatswordIntegrationBeadHands) {
      world.greatswordIntegrationBeadHands = new Map();
    }

    const bearerId = 'greatsword-integration-bearer';
    world.greatswordIntegrationBearer = new Entity(bearerId, 50, world.greatswordIntegrationGrid);
    world.greatswordIntegrationBearer.currentHealth = 50;
    world.greatswordIntegrationEntities.set(bearerId, world.greatswordIntegrationBearer);
    world.greatswordIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green, white: 0 });
    world.greatswordIntegrationBearerBeadHand = beadHand;
    world.greatswordIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a greatsword integration target {string} at position {int},{int} with {int} health',
  function (world: GreatswordWorld, targetName: string, x: number, y: number, health: number) {
    if (!world.greatswordIntegrationGrid) {
      world.greatswordIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordIntegrationEntities) {
      world.greatswordIntegrationEntities = new Map();
    }

    const targetId = `greatsword-integration-${targetName}`;
    const target = new Entity(targetId, health, world.greatswordIntegrationGrid);
    target.currentHealth = health;
    world.greatswordIntegrationEntities.set(targetId, target);
    world.greatswordIntegrationGrid.register(targetId, x, y);
  }
);

Given(
  'a greatsword integration adjacent enemy {string} at position {int},{int} with {int} health',
  function (world: GreatswordWorld, enemyName: string, x: number, y: number, health: number) {
    if (!world.greatswordIntegrationGrid) {
      world.greatswordIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.greatswordIntegrationEntities) {
      world.greatswordIntegrationEntities = new Map();
    }

    const enemyId = `greatsword-integration-${enemyName}`;
    const enemy = new Entity(enemyId, health, world.greatswordIntegrationGrid);
    enemy.currentHealth = health;
    world.greatswordIntegrationEntities.set(enemyId, enemy);
    world.greatswordIntegrationGrid.register(enemyId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Cleave Effect Execution
// ============================================================================

When(
  'the greatsword integration cleave is triggered for {string} with hit outcome {string} and adjacent enemies {string}',
  function (
    world: GreatswordWorld,
    targetId: string,
    hitOutcome: string,
    adjacentEnemyIdsJson: string
  ) {
    if (!world.greatswordIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const adjacentEnemyIds = JSON.parse(adjacentEnemyIdsJson) as string[];
    const effect = new CleaveEffect();
    world.greatswordIntegrationCleaveResult = effect.execute(
      world.greatswordIntegrationGameContext,
      { targetId, hitOutcome, adjacentEnemyIds },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Sweep Effect Execution
// ============================================================================

When(
  'the greatsword integration sweep is triggered with targets {string}',
  function (world: GreatswordWorld, targetIdsJson: string) {
    if (!world.greatswordIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const targetIds = JSON.parse(targetIdsJson) as string[];

    const effect = new SweepEffect();
    world.greatswordIntegrationSweepResult = effect.execute(
      world.greatswordIntegrationGameContext,
      { targetIds },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then(
  'the greatsword integration cleave result should be successful',
  function (world: GreatswordWorld) {
    expect(world.greatswordIntegrationCleaveResult).toBeDefined();
    expect(world.greatswordIntegrationCleaveResult?.success).toBe(true);
  }
);

Then(
  'the greatsword integration cleave should have damaged {int} adjacent enemies',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordIntegrationCleaveResult).toBeDefined();
    expect(world.greatswordIntegrationCleaveResult?.data?.adjacentsDamaged).toBe(expected);
  }
);

Then(
  'the greatsword integration sweep result should be successful',
  function (world: GreatswordWorld) {
    expect(world.greatswordIntegrationSweepResult).toBeDefined();
    expect(world.greatswordIntegrationSweepResult?.success).toBe(true);
  }
);

Then(
  'the greatsword integration sweep should have resolved against {int} targets',
  function (world: GreatswordWorld, expected: number) {
    expect(world.greatswordIntegrationSweepResult).toBeDefined();
    expect(world.greatswordIntegrationSweepResult?.data?.targetsHit).toBe(expected);
  }
);
