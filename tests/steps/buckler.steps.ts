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
import { RiposteEffect } from '@src/effects/RiposteEffect';

interface BucklerWorld extends QuickPickleWorld {
  // Unit test
  bucklerTestGrid?: BattleGrid;
  bucklerTestEntities?: Map<string, Entity>;
  bucklerTestBeadHands?: Map<string, PlayerBeadSystem>;
  bucklerTestGameContext?: GameContext;
  bucklerTestBearer?: Entity;
  bucklerTestBearerBeadHand?: PlayerBeadSystem;
  bucklerTestRiposteResult?: EffectResult;
  bucklerTestRiposteCost?: { greenBeads: number };
  bucklerTestEquipment?: {
    slot: string;
    category: string;
    passiveGuard: number;
    modifiers: string[];
    inventorySlots: number;
  };

  // Integration test
  bucklerIntegrationGrid?: BattleGrid;
  bucklerIntegrationEntities?: Map<string, Entity>;
  bucklerIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  bucklerIntegrationGameContext?: GameContext;
  bucklerIntegrationBearer?: Entity;
  bucklerIntegrationBearerBeadHand?: PlayerBeadSystem;
  bucklerIntegrationRiposteResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a buckler test grid of {int}x{int}',
  function (world: BucklerWorld, width: number, height: number) {
    world.bucklerTestGrid = new BattleGrid(width, height);
  }
);

Given('a buckler test game context with the grid', function (world: BucklerWorld) {
  if (!world.bucklerTestGrid) {
    world.bucklerTestGrid = new BattleGrid(12, 12);
  }
  if (!world.bucklerTestEntities) {
    world.bucklerTestEntities = new Map();
  }
  if (!world.bucklerTestBeadHands) {
    world.bucklerTestBeadHands = new Map();
  }

  world.bucklerTestGameContext = {
    grid: world.bucklerTestGrid,
    actorId: 'buckler-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.bucklerTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.bucklerTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a buckler test bearer at position {int},{int} with bead hand having {int} green',
  function (world: BucklerWorld, x: number, y: number, green: number) {
    if (!world.bucklerTestGrid) {
      world.bucklerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.bucklerTestEntities) {
      world.bucklerTestEntities = new Map();
    }
    if (!world.bucklerTestBeadHands) {
      world.bucklerTestBeadHands = new Map();
    }

    const bearerId = 'buckler-test-bearer';
    world.bucklerTestBearer = new Entity(bearerId, 50, world.bucklerTestGrid);
    world.bucklerTestBearer.currentHealth = 50;
    world.bucklerTestEntities.set(bearerId, world.bucklerTestBearer);
    world.bucklerTestGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green, white: 0 });
    world.bucklerTestBearerBeadHand = beadHand;
    world.bucklerTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a buckler test attacker {string} at position {int},{int} with {int} health',
  function (world: BucklerWorld, attackerName: string, x: number, y: number, health: number) {
    if (!world.bucklerTestGrid) {
      world.bucklerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.bucklerTestEntities) {
      world.bucklerTestEntities = new Map();
    }

    const attacker = new Entity(attackerName, health, world.bucklerTestGrid);
    attacker.currentHealth = health;
    world.bucklerTestEntities.set(attackerName, attacker);
    world.bucklerTestGrid.register(attackerName, x, y);
  }
);

// ============================================================================
// UNIT TEST - Riposte Effect Execution
// ============================================================================

When(
  'the buckler test riposte is triggered for {string} with guard outcome {string}',
  function (world: BucklerWorld, attackerId: string, guardOutcome: 'guarded' | 'hit' | 'dodged') {
    if (!world.bucklerTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new RiposteEffect();
    world.bucklerTestRiposteResult = effect.execute(
      world.bucklerTestGameContext,
      { targetId: attackerId, guardOutcome },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Assertions: Riposte Result
// ============================================================================

Then('the buckler test riposte result should be successful', function (world: BucklerWorld) {
  expect(world.bucklerTestRiposteResult).toBeDefined();
  expect(world.bucklerTestRiposteResult?.success).toBe(true);
});

Then('the buckler test riposte result should have failed', function (world: BucklerWorld) {
  expect(world.bucklerTestRiposteResult).toBeDefined();
  expect(world.bucklerTestRiposteResult?.success).toBe(false);
});

Then(
  'the buckler test attacker {string} should have {int} health',
  function (world: BucklerWorld, attackerId: string, expectedHealth: number) {
    const attacker = world.bucklerTestEntities?.get(attackerId);
    expect(attacker).toBeDefined();
    expect(attacker?.currentHealth).toBe(expectedHealth);
  }
);

// ============================================================================
// UNIT TEST - Cost from YAML
// ============================================================================

When('I check the buckler test riposte action cost from YAML', function (world: BucklerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { beads?: { green?: number } } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'riposte');

  if (!action) {
    throw new Error('riposte action not found in YAML');
  }

  world.bucklerTestRiposteCost = {
    greenBeads: action.cost?.beads?.green ?? 0,
  };
});

Then(
  'the buckler test riposte cost should have {int} green bead',
  function (world: BucklerWorld, expected: number) {
    expect(world.bucklerTestRiposteCost).toBeDefined();
    expect(world.bucklerTestRiposteCost?.greenBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the buckler test equipment from YAML', function (world: BucklerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      slot: string;
      category: string;
      inventorySlots: number;
      grantedModifiers?: string[];
      passiveStats?: { guard?: number };
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'buckler');

  if (!equipment) {
    throw new Error('Buckler equipment not found in YAML');
  }

  world.bucklerTestEquipment = {
    slot: equipment.slot,
    category: equipment.category,
    passiveGuard: equipment.passiveStats?.guard ?? 0,
    modifiers: equipment.grantedModifiers ?? [],
    inventorySlots: equipment.inventorySlots ?? 0,
  };
});

Then(
  'the buckler test equipment slot should be {string}',
  function (world: BucklerWorld, expected: string) {
    expect(world.bucklerTestEquipment).toBeDefined();
    expect(world.bucklerTestEquipment?.slot).toBe(expected);
  }
);

Then(
  'the buckler test equipment category should be {string}',
  function (world: BucklerWorld, expected: string) {
    expect(world.bucklerTestEquipment).toBeDefined();
    expect(world.bucklerTestEquipment?.category).toBe(expected);
  }
);

Then(
  'the buckler test equipment passiveGuard should be {int}',
  function (world: BucklerWorld, expected: number) {
    expect(world.bucklerTestEquipment).toBeDefined();
    expect(world.bucklerTestEquipment?.passiveGuard).toBe(expected);
  }
);

Then(
  'the buckler test equipment should have modifier {string}',
  function (world: BucklerWorld, modifierName: string) {
    expect(world.bucklerTestEquipment).toBeDefined();
    expect(world.bucklerTestEquipment?.modifiers).toContain(modifierName);
  }
);

Then(
  'the buckler test equipment inventorySlots should be {int}',
  function (world: BucklerWorld, expected: number) {
    expect(world.bucklerTestEquipment).toBeDefined();
    expect(world.bucklerTestEquipment?.inventorySlots).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a buckler integration grid of {int}x{int}',
  function (world: BucklerWorld, width: number, height: number) {
    world.bucklerIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a buckler integration game context with the grid', function (world: BucklerWorld) {
  if (!world.bucklerIntegrationGrid) {
    world.bucklerIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.bucklerIntegrationEntities) {
    world.bucklerIntegrationEntities = new Map();
  }
  if (!world.bucklerIntegrationBeadHands) {
    world.bucklerIntegrationBeadHands = new Map();
  }

  world.bucklerIntegrationGameContext = {
    grid: world.bucklerIntegrationGrid,
    actorId: 'buckler-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.bucklerIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.bucklerIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a buckler integration bearer at position {int},{int} with bead hand having {int} green',
  function (world: BucklerWorld, x: number, y: number, green: number) {
    if (!world.bucklerIntegrationGrid) {
      world.bucklerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.bucklerIntegrationEntities) {
      world.bucklerIntegrationEntities = new Map();
    }
    if (!world.bucklerIntegrationBeadHands) {
      world.bucklerIntegrationBeadHands = new Map();
    }

    const bearerId = 'buckler-integration-bearer';
    world.bucklerIntegrationBearer = new Entity(bearerId, 50, world.bucklerIntegrationGrid);
    world.bucklerIntegrationBearer.currentHealth = 50;
    world.bucklerIntegrationEntities.set(bearerId, world.bucklerIntegrationBearer);
    world.bucklerIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green, white: 0 });
    world.bucklerIntegrationBearerBeadHand = beadHand;
    world.bucklerIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a buckler integration attacker {string} at position {int},{int} with {int} health',
  function (world: BucklerWorld, attackerName: string, x: number, y: number, health: number) {
    if (!world.bucklerIntegrationGrid) {
      world.bucklerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.bucklerIntegrationEntities) {
      world.bucklerIntegrationEntities = new Map();
    }

    const attackerId = `buckler-integration-${attackerName}`;
    const attacker = new Entity(attackerId, health, world.bucklerIntegrationGrid);
    attacker.currentHealth = health;
    world.bucklerIntegrationEntities.set(attackerId, attacker);
    world.bucklerIntegrationGrid.register(attackerId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Block + Riposte Flow
// ============================================================================

When(
  'the buckler integration block is triggered granting {int} guard',
  function (world: BucklerWorld, guardGrant: number) {
    if (!world.bucklerIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    world.bucklerIntegrationBearer.guard += guardGrant;
  }
);

When(
  'the buckler integration riposte is triggered for {string} with guard outcome {string}',
  function (world: BucklerWorld, attackerId: string, guardOutcome: 'guarded' | 'hit' | 'dodged') {
    if (!world.bucklerIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new RiposteEffect();
    world.bucklerIntegrationRiposteResult = effect.execute(
      world.bucklerIntegrationGameContext,
      { targetId: attackerId, guardOutcome },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then('the buckler integration riposte result should be successful', function (world: BucklerWorld) {
  expect(world.bucklerIntegrationRiposteResult).toBeDefined();
  expect(world.bucklerIntegrationRiposteResult?.success).toBe(true);
});

Then(
  'the buckler integration attacker {string} should have {int} health',
  function (world: BucklerWorld, attackerId: string, expectedHealth: number) {
    const attacker = world.bucklerIntegrationEntities?.get(attackerId);
    expect(attacker).toBeDefined();
    expect(attacker?.currentHealth).toBe(expectedHealth);
  }
);
