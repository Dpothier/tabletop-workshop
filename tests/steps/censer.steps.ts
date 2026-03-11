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
import { BlessEffect } from '@src/effects/BlessEffect';
import { RenewEffect } from '@src/effects/RenewEffect';

interface CenserWorld extends QuickPickleWorld {
  // Unit test context
  censerTestGrid?: BattleGrid;
  censerTestEntities?: Map<string, Entity>;
  censerTestBeadHands?: Map<string, PlayerBeadSystem>;
  censerTestGameContext?: GameContext;
  censerTestCaster?: Entity;
  censerTestBlessEffect?: BlessEffect;
  censerTestRenewEffect?: RenewEffect;
  censerTestResult?: EffectResult;
  censerTestBlessCost?: { windup: number; whiteBeads: number };
  censerTestRenewCost?: { whiteBeads: number };
  censerTestBeadHand?: PlayerBeadSystem; // for gold bead unit tests
  censerTestSpendResult?: boolean;
  censerTestAffordResult?: boolean;

  // Integration test context
  censerIntegrationGrid?: BattleGrid;
  censerIntegrationEntities?: Map<string, Entity>;
  censerIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  censerIntegrationGameContext?: GameContext;
  censerIntegrationCaster?: Entity;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a censer test grid of {int}x{int}',
  function (world: CenserWorld, width: number, height: number) {
    world.censerTestGrid = new BattleGrid(width, height);
  }
);

Given('a censer test game context with the grid', function (world: CenserWorld) {
  if (!world.censerTestGrid) {
    world.censerTestGrid = new BattleGrid(12, 12);
  }
  if (!world.censerTestEntities) {
    world.censerTestEntities = new Map();
  }
  if (!world.censerTestBeadHands) {
    world.censerTestBeadHands = new Map();
  }

  world.censerTestGameContext = {
    grid: world.censerTestGrid,
    actorId: 'censer-test-caster',
    getEntity(id: string): Entity | undefined {
      return world.censerTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.censerTestBeadHands?.get(entityId);
    },
  };

  world.censerTestBlessEffect = new BlessEffect();
  world.censerTestRenewEffect = new RenewEffect();
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a censer test caster at position {int},{int}',
  function (world: CenserWorld, x: number, y: number) {
    if (!world.censerTestGrid) {
      world.censerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.censerTestEntities) {
      world.censerTestEntities = new Map();
    }

    const casterId = 'censer-test-caster';
    world.censerTestCaster = new Entity(casterId, 50, world.censerTestGrid);
    world.censerTestCaster.currentHealth = 50;
    world.censerTestEntities.set(casterId, world.censerTestCaster);
    world.censerTestGrid.register(casterId, x, y);
  }
);

Given(
  'a censer test ally {string} at position {int},{int} with bead hand',
  function (world: CenserWorld, allyName: string, x: number, y: number) {
    if (!world.censerTestGrid) {
      world.censerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.censerTestEntities) {
      world.censerTestEntities = new Map();
    }
    if (!world.censerTestBeadHands) {
      world.censerTestBeadHands = new Map();
    }

    const ally = new Entity(allyName, 30, world.censerTestGrid);
    ally.currentHealth = 30;
    world.censerTestEntities.set(allyName, ally);
    world.censerTestGrid.register(allyName, x, y);

    const beadHand = new PlayerBeadSystem();
    world.censerTestBeadHands.set(allyName, beadHand);
  }
);

Given(
  'a censer test ally {string} at position {int},{int} with bead hand containing {int} red {int} blue {int} green {int} white in bag',
  function (
    world: CenserWorld,
    allyName: string,
    x: number,
    y: number,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    if (!world.censerTestGrid) {
      world.censerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.censerTestEntities) {
      world.censerTestEntities = new Map();
    }
    if (!world.censerTestBeadHands) {
      world.censerTestBeadHands = new Map();
    }

    const ally = new Entity(allyName, 30, world.censerTestGrid);
    ally.currentHealth = 30;
    world.censerTestEntities.set(allyName, ally);
    world.censerTestGrid.register(allyName, x, y);

    const beadHand = new PlayerBeadSystem({ red, blue, green, white });
    world.censerTestBeadHands.set(allyName, beadHand);
  }
);

// ============================================================================
// UNIT TEST - Gold Bead Setup (standalone PlayerBeadSystem)
// ============================================================================

Given(
  'a censer test bead hand with {int} red and {int} gold',
  function (world: CenserWorld, red: number, gold: number) {
    world.censerTestBeadHand = new PlayerBeadSystem();
    world.censerTestBeadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    for (let i = 0; i < gold; i++) {
      world.censerTestBeadHand.addGoldBead();
    }
  }
);

Given(
  'a censer test bead hand with {int} blue and {int} gold',
  function (world: CenserWorld, blue: number, gold: number) {
    world.censerTestBeadHand = new PlayerBeadSystem();
    world.censerTestBeadHand.setHand({ red: 0, blue, green: 0, white: 0 });
    for (let i = 0; i < gold; i++) {
      world.censerTestBeadHand.addGoldBead();
    }
  }
);

Given(
  'a censer test bead hand with {int} red {int} blue and {int} gold',
  function (world: CenserWorld, red: number, blue: number, gold: number) {
    world.censerTestBeadHand = new PlayerBeadSystem();
    world.censerTestBeadHand.setHand({ red, blue, green: 0, white: 0 });
    for (let i = 0; i < gold; i++) {
      world.censerTestBeadHand.addGoldBead();
    }
  }
);

// ============================================================================
// UNIT TEST - Effect Execution
// ============================================================================

When(
  'the censer test bless effect is executed targeting {string}',
  function (world: CenserWorld, targetId: string) {
    if (!world.censerTestBlessEffect) {
      world.censerTestBlessEffect = new BlessEffect();
    }

    world.censerTestResult = world.censerTestBlessEffect.execute(
      world.censerTestGameContext!,
      { targetId },
      {},
      new Map()
    );
  }
);

When(
  'the censer test renew effect is executed targeting {string}',
  function (world: CenserWorld, targetId: string) {
    if (!world.censerTestRenewEffect) {
      world.censerTestRenewEffect = new RenewEffect();
    }

    world.censerTestResult = world.censerTestRenewEffect.execute(
      world.censerTestGameContext!,
      { targetId },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Gold Bead Spending
// ============================================================================

When('the censer test player spends gold', function (world: CenserWorld) {
  world.censerTestSpendResult = world.censerTestBeadHand!.spendGold();
});

When(
  'the censer test player checks afford for {int} red bead',
  function (world: CenserWorld, count: number) {
    world.censerTestAffordResult = world.censerTestBeadHand!.canAfford({
      red: count,
      blue: 0,
      green: 0,
      white: 0,
    });
  }
);

When(
  'the censer test player checks afford for {int} red and {int} blue',
  function (world: CenserWorld, red: number, blue: number) {
    world.censerTestAffordResult = world.censerTestBeadHand!.canAfford({
      red,
      blue,
      green: 0,
      white: 0,
    });
  }
);

// ============================================================================
// UNIT TEST - Assertions: Gold Bead Count
// ============================================================================

Then(
  'the censer test ally {string} should have {int} gold bead',
  function (world: CenserWorld, allyName: string, expectedGold: number) {
    const beadHand = world.censerTestBeadHands!.get(allyName)!;
    expect(beadHand.getGoldCount()).toBe(expectedGold);
  }
);

Then(
  'the censer test bead hand should have {int} gold beads',
  function (world: CenserWorld, expectedGold: number) {
    expect(world.censerTestBeadHand!.getGoldCount()).toBe(expectedGold);
  }
);

// ============================================================================
// UNIT TEST - Assertions: Bead Drawing
// ============================================================================

Then(
  'the censer test ally {string} should have drawn {int} bead',
  function (world: CenserWorld, allyName: string, expectedCount: number) {
    const beadHand = world.censerTestBeadHands!.get(allyName)!;
    expect(beadHand.getHandTotal()).toBe(expectedCount);
  }
);

// ============================================================================
// UNIT TEST - Assertions: Gold Bead Spending
// ============================================================================

Then('the censer test spend result should be successful', function (world: CenserWorld) {
  expect(world.censerTestSpendResult).toBe(true);
});

// ============================================================================
// UNIT TEST - Assertions: Affordability
// ============================================================================

Then('the censer test afford result should be true', function (world: CenserWorld) {
  expect(world.censerTestAffordResult).toBe(true);
});

Then('the censer test afford result should be false', function (world: CenserWorld) {
  expect(world.censerTestAffordResult).toBe(false);
});

// ============================================================================
// UNIT TEST - Assertions: Effect Result
// ============================================================================

Then('the censer test result should have failed', function (world: CenserWorld) {
  expect(world.censerTestResult).toBeDefined();
  expect(world.censerTestResult?.success).toBe(false);
});

// ============================================================================
// UNIT TEST - Cost Verification
// ============================================================================

When('I check the censer test bless action cost from YAML', function (world: CenserWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number; beads?: { white?: number } } }>;
  };
  const blessAction = data.actions?.find((a: { id: string }) => a.id === 'bless');

  if (!blessAction) {
    throw new Error('Bless action not found in YAML');
  }

  world.censerTestBlessCost = {
    windup: blessAction.cost?.time ?? 1,
    whiteBeads: blessAction.cost?.beads?.white ?? 1,
  };
});

Then(
  'the censer test bless cost should have {int} windup',
  function (world: CenserWorld, expectedWindup: number) {
    expect(world.censerTestBlessCost?.windup).toBe(expectedWindup);
  }
);

Then(
  'the censer test bless cost should have {int} white bead',
  function (world: CenserWorld, expectedBeads: number) {
    expect(world.censerTestBlessCost?.whiteBeads).toBe(expectedBeads);
  }
);

When('I check the censer test renew action cost from YAML', function (world: CenserWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number; beads?: { white?: number } } }>;
  };
  const renewAction = data.actions?.find((a: { id: string }) => a.id === 'renew');

  if (!renewAction) {
    throw new Error('Renew action not found in YAML');
  }

  world.censerTestRenewCost = {
    whiteBeads: renewAction.cost?.beads?.white ?? 1,
  };
});

Then(
  'the censer test renew cost should have {int} white bead',
  function (world: CenserWorld, expectedBeads: number) {
    expect(world.censerTestRenewCost?.whiteBeads).toBe(expectedBeads);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a censer integration grid of {int}x{int}',
  function (world: CenserWorld, width: number, height: number) {
    world.censerIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a censer integration game context with the grid', function (world: CenserWorld) {
  if (!world.censerIntegrationGrid) {
    world.censerIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.censerIntegrationEntities) {
    world.censerIntegrationEntities = new Map();
  }
  if (!world.censerIntegrationBeadHands) {
    world.censerIntegrationBeadHands = new Map();
  }

  world.censerIntegrationGameContext = {
    grid: world.censerIntegrationGrid,
    actorId: 'censer-integration-caster',
    getEntity(id: string): Entity | undefined {
      return world.censerIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.censerIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a censer integration caster at position {int},{int}',
  function (world: CenserWorld, x: number, y: number) {
    if (!world.censerIntegrationGrid) {
      world.censerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.censerIntegrationEntities) {
      world.censerIntegrationEntities = new Map();
    }

    const casterId = 'censer-integration-caster';
    world.censerIntegrationCaster = new Entity(casterId, 50, world.censerIntegrationGrid);
    world.censerIntegrationCaster.currentHealth = 50;
    world.censerIntegrationEntities.set(casterId, world.censerIntegrationCaster);
    world.censerIntegrationGrid.register(casterId, x, y);
  }
);

Given(
  'a censer integration ally {string} at position {int},{int} with bead hand having {int} red {int} blue {int} green {int} white',
  function (
    world: CenserWorld,
    allyName: string,
    x: number,
    y: number,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    if (!world.censerIntegrationGrid) {
      world.censerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.censerIntegrationEntities) {
      world.censerIntegrationEntities = new Map();
    }
    if (!world.censerIntegrationBeadHands) {
      world.censerIntegrationBeadHands = new Map();
    }

    const allyId = `censer-integration-${allyName}`;
    const ally = new Entity(allyId, 30, world.censerIntegrationGrid);
    ally.currentHealth = 30;
    world.censerIntegrationEntities.set(allyId, ally);
    world.censerIntegrationGrid.register(allyId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue, green, white });
    world.censerIntegrationBeadHands.set(allyId, beadHand);
  }
);

Given(
  'a censer integration ally {string} at position {int},{int} with bead hand containing {int} red {int} blue {int} green {int} white in bag',
  function (
    world: CenserWorld,
    allyName: string,
    x: number,
    y: number,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    if (!world.censerIntegrationGrid) {
      world.censerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.censerIntegrationEntities) {
      world.censerIntegrationEntities = new Map();
    }
    if (!world.censerIntegrationBeadHands) {
      world.censerIntegrationBeadHands = new Map();
    }

    const allyId = `censer-integration-${allyName}`;
    const ally = new Entity(allyId, 30, world.censerIntegrationGrid);
    ally.currentHealth = 30;
    world.censerIntegrationEntities.set(allyId, ally);
    world.censerIntegrationGrid.register(allyId, x, y);

    const beadHand = new PlayerBeadSystem({ red, blue, green, white });
    world.censerIntegrationBeadHands.set(allyId, beadHand);
  }
);

// ============================================================================
// INTEGRATION TEST - Spell Casting
// ============================================================================

When(
  'the censer integration bless is cast targeting {string}',
  function (world: CenserWorld, targetId: string) {
    const effect = new BlessEffect();
    world.censerTestResult = effect.execute(
      world.censerIntegrationGameContext!,
      { targetId },
      {},
      new Map()
    );
  }
);

When(
  'the censer integration renew is cast targeting {string}',
  function (world: CenserWorld, targetId: string) {
    const effect = new RenewEffect();
    world.censerTestResult = effect.execute(
      world.censerIntegrationGameContext!,
      { targetId },
      {},
      new Map()
    );
  }
);

When(
  'the censer integration ally {string} spends red',
  function (world: CenserWorld, allyId: string) {
    const beadHand = world.censerIntegrationBeadHands!.get(allyId)!;
    world.censerTestSpendResult = beadHand.spend('red');
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions: Gold Bead
// ============================================================================

Then(
  'the censer integration ally {string} should have {int} gold bead',
  function (world: CenserWorld, allyId: string, expectedGold: number) {
    const beadHand = world.censerIntegrationBeadHands!.get(allyId)!;
    expect(beadHand.getGoldCount()).toBe(expectedGold);
  }
);

Then(
  'the censer integration ally {string} should have {int} gold beads',
  function (world: CenserWorld, allyId: string, expectedGold: number) {
    const beadHand = world.censerIntegrationBeadHands!.get(allyId)!;
    expect(beadHand.getGoldCount()).toBe(expectedGold);
  }
);

Then('the censer integration spend result should be successful', function (world: CenserWorld) {
  expect(world.censerTestSpendResult).toBe(true);
});

// ============================================================================
// INTEGRATION TEST - Assertions: Affordability
// ============================================================================

Then(
  'the censer integration ally {string} can afford {int} red bead',
  function (world: CenserWorld, allyId: string, redCount: number) {
    const beadHand = world.censerIntegrationBeadHands!.get(allyId)!;
    expect(beadHand.canAfford({ red: redCount, blue: 0, green: 0, white: 0 })).toBe(true);
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions: Hand Size
// ============================================================================

Then(
  'the censer integration ally {string} should have {int} bead in hand',
  function (world: CenserWorld, allyId: string, expectedCount: number) {
    const beadHand = world.censerIntegrationBeadHands!.get(allyId)!;
    expect(beadHand.getHandTotal()).toBe(expectedCount);
  }
);
