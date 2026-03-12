import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import type { AttackModifier, CombatResult, DefenseStats } from '@src/types/Combat';
import { resolveAttack } from '@src/combat/CombatResolver';
import { buildDefensiveOptions } from '@src/combat/AttackResolvers';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { Character } from '@src/entities/Character';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { GameContext } from '@src/types/Effect';

interface RondelDaggerWorld extends QuickPickleWorld {
  // Unit test setup
  rondelDaggerTestGrid?: BattleGrid;
  rondelDaggerTestEntities?: Map<string, Entity>;
  rondelDaggerTestBeadHands?: Map<string, PlayerBeadSystem>;
  rondelDaggerTestGameContext?: GameContext;

  // Unit test - Equipment from YAML
  rondelDaggerTestEquipment?: {
    power: number;
    agility: number;
    twoHanded: boolean;
    grantedModifiers: string[];
  };

  // Unit test - Combat resolution
  rondelDaggerTestCombatResult?: CombatResult;

  // Unit test - Action properties from YAML
  rondelDaggerTestPercerCost?: { green: number };
  rondelDaggerTestPercerCondition?: { weaponTag: string };
  rondelDaggerTestParadeCost?: { red: number };
  rondelDaggerTestParadeModifier?: { guard: number };

  // Unit test - Defensive options
  rondelDaggerTestDefensiveOptions?: Array<{ id: string; label: string }>;

  // Integration test setup
  rondelDaggerIntegrationGrid?: BattleGrid;
  rondelDaggerIntegrationEntities?: Map<string, Entity>;
  rondelDaggerIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  rondelDaggerIntegrationGameContext?: GameContext;
  rondelDaggerIntegrationAttacker?: Entity;
  rondelDaggerIntegrationTarget?: Entity;
  rondelDaggerIntegrationCombatResult?: CombatResult;
  rondelDaggerIntegrationDefenderModifiers?: string[];
  rondelDaggerIntegrationDefenderBeadCounts?: {
    red: number;
    blue: number;
    green: number;
    white: number;
  };
  rondelDaggerIntegrationDefensiveOptions?: Array<{ id: string; label: string }>;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a rondel-dagger test grid of {int}x{int}',
  function (world: RondelDaggerWorld, width: number, height: number) {
    world.rondelDaggerTestGrid = new BattleGrid(width, height);
  }
);

Given('a rondel-dagger test game context with the grid', function (world: RondelDaggerWorld) {
  if (!world.rondelDaggerTestGrid) {
    world.rondelDaggerTestGrid = new BattleGrid(12, 12);
  }
  if (!world.rondelDaggerTestEntities) {
    world.rondelDaggerTestEntities = new Map();
  }
  if (!world.rondelDaggerTestBeadHands) {
    world.rondelDaggerTestBeadHands = new Map();
  }

  world.rondelDaggerTestGameContext = {
    grid: world.rondelDaggerTestGrid,
    actorId: 'rondel-dagger-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.rondelDaggerTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.rondelDaggerTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Equipment Properties from YAML
// ============================================================================

When('I check the rondel-dagger test equipment from YAML', function (world: RondelDaggerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      power: number;
      agility: number;
      twoHanded: boolean;
      grantedModifiers?: string[];
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'rondel-dagger');

  if (!equipment) {
    throw new Error('Rondel Dagger equipment not found in YAML');
  }

  world.rondelDaggerTestEquipment = {
    power: equipment.power,
    agility: equipment.agility,
    twoHanded: equipment.twoHanded,
    grantedModifiers: equipment.grantedModifiers ?? [],
  };
});

Then(
  'the rondel-dagger test equipment power should be {int}',
  function (world: RondelDaggerWorld, expected: number) {
    expect(world.rondelDaggerTestEquipment).toBeDefined();
    expect(world.rondelDaggerTestEquipment?.power).toBe(expected);
  }
);

Then(
  'the rondel-dagger test equipment agility should be {int}',
  function (world: RondelDaggerWorld, expected: number) {
    expect(world.rondelDaggerTestEquipment).toBeDefined();
    expect(world.rondelDaggerTestEquipment?.agility).toBe(expected);
  }
);

Then(
  'the rondel-dagger test equipment twoHanded should be {word}',
  function (world: RondelDaggerWorld, expected: string) {
    expect(world.rondelDaggerTestEquipment).toBeDefined();
    expect(world.rondelDaggerTestEquipment?.twoHanded).toBe(expected === 'true');
  }
);

Then(
  'the rondel-dagger test equipment should have granted modifier {string}',
  function (world: RondelDaggerWorld, modifierName: string) {
    expect(world.rondelDaggerTestEquipment).toBeDefined();
    expect(world.rondelDaggerTestEquipment?.grantedModifiers).toContain(modifierName);
  }
);

// ============================================================================
// UNIT TEST - Combat Resolution with Percer Modifier
// ============================================================================

When(
  'the rondel-dagger test combat resolves with percer against guard {int}, evasion {int}, armor {int}',
  function (world: RondelDaggerWorld, guard: number, evasion: number, armor: number) {
    const attack = { power: 1, agility: 1 }; // Rondel Dagger stats
    const defense: DefenseStats = { guard, evasion, armor };
    const modifiers: AttackModifier[] = ['percer'];

    world.rondelDaggerTestCombatResult = resolveAttack(attack, defense, modifiers);
  }
);

Then(
  'the rondel-dagger test combat outcome should be {string}',
  function (world: RondelDaggerWorld, expectedOutcome: string) {
    expect(world.rondelDaggerTestCombatResult).toBeDefined();
    expect(world.rondelDaggerTestCombatResult?.outcome).toBe(expectedOutcome);
  }
);

Then(
  'the rondel-dagger test combat damage should be {int}',
  function (world: RondelDaggerWorld, expectedDamage: number) {
    expect(world.rondelDaggerTestCombatResult).toBeDefined();
    expect(world.rondelDaggerTestCombatResult?.damage).toBe(expectedDamage);
  }
);

// ============================================================================
// UNIT TEST - Percer Action Properties from YAML
// ============================================================================

When(
  'I check the rondel-dagger test percer action cost from YAML',
  function (world: RondelDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { beads?: { green?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'percer');

    if (!action) {
      throw new Error('percer action not found in YAML');
    }

    world.rondelDaggerTestPercerCost = {
      green: action.cost?.beads?.green ?? 0,
    };
  }
);

Then(
  'the rondel-dagger test percer cost should have {int} green bead',
  function (world: RondelDaggerWorld, expected: number) {
    expect(world.rondelDaggerTestPercerCost).toBeDefined();
    expect(world.rondelDaggerTestPercerCost?.green).toBe(expected);
  }
);

When('I check the rondel-dagger test percer action from YAML', function (world: RondelDaggerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; condition?: { weaponTag?: string } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'percer');

  if (!action) {
    throw new Error('percer action not found in YAML');
  }

  world.rondelDaggerTestPercerCondition = {
    weaponTag: action.condition?.weaponTag ?? '',
  };
});

Then(
  'the rondel-dagger test percer condition should require weaponTag {string}',
  function (world: RondelDaggerWorld, expectedTag: string) {
    expect(world.rondelDaggerTestPercerCondition).toBeDefined();
    expect(world.rondelDaggerTestPercerCondition?.weaponTag).toBe(expectedTag);
  }
);

// ============================================================================
// UNIT TEST - Parade Defensive Options from AttackResolvers
// ============================================================================

When(
  'the rondel-dagger test defensive options are built with {int} red bead and modifier {string}',
  function (world: RondelDaggerWorld, redBeads: number, modifier: string) {
    const handCounts = { red: redBeads, blue: 0, green: 0, white: 0 };
    world.rondelDaggerTestDefensiveOptions = buildDefensiveOptions(handCounts, 'melee', [modifier]);
  }
);

When(
  'the rondel-dagger test defensive options are built with {int} red bead and no equipment modifiers',
  function (world: RondelDaggerWorld, redBeads: number) {
    const handCounts = { red: redBeads, blue: 0, green: 0, white: 0 };
    world.rondelDaggerTestDefensiveOptions = buildDefensiveOptions(handCounts, 'melee');
  }
);

When(
  'the rondel-dagger test defensive options are built with {int} red beads and modifier {string}',
  function (world: RondelDaggerWorld, redBeads: number, modifier: string) {
    const handCounts = { red: redBeads, blue: 0, green: 0, white: 0 };
    world.rondelDaggerTestDefensiveOptions = buildDefensiveOptions(handCounts, 'melee', [modifier]);
  }
);

Then(
  'the rondel-dagger test defensive options should include {string}',
  function (world: RondelDaggerWorld, optionId: string) {
    expect(world.rondelDaggerTestDefensiveOptions).toBeDefined();
    const hasOption = world.rondelDaggerTestDefensiveOptions?.some((opt) => opt.id === optionId);
    expect(hasOption).toBe(true);
  }
);

Then(
  'the rondel-dagger test defensive options should not include {string}',
  function (world: RondelDaggerWorld, optionId: string) {
    expect(world.rondelDaggerTestDefensiveOptions).toBeDefined();
    const hasOption = world.rondelDaggerTestDefensiveOptions?.some((opt) => opt.id === optionId);
    expect(hasOption).toBe(false);
  }
);

// ============================================================================
// UNIT TEST - Parade Action Properties from YAML
// ============================================================================

When(
  'I check the rondel-dagger test parade action cost from YAML',
  function (world: RondelDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'parade');

    if (!action) {
      throw new Error('parade action not found in YAML');
    }

    world.rondelDaggerTestParadeCost = {
      red: action.cost?.beads?.red ?? 0,
    };
  }
);

Then(
  'the rondel-dagger test parade cost should have {int} red bead',
  function (world: RondelDaggerWorld, expected: number) {
    expect(world.rondelDaggerTestParadeCost).toBeDefined();
    expect(world.rondelDaggerTestParadeCost?.red).toBe(expected);
  }
);

When(
  'I check the rondel-dagger test parade modifier from YAML',
  function (world: RondelDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; modifier?: { guard?: number } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'parade');

    if (!action) {
      throw new Error('parade action not found in YAML');
    }

    world.rondelDaggerTestParadeModifier = {
      guard: action.modifier?.guard ?? 0,
    };
  }
);

Then(
  'the rondel-dagger test parade guard modifier should be {int}',
  function (world: RondelDaggerWorld, expected: number) {
    expect(world.rondelDaggerTestParadeModifier).toBeDefined();
    expect(world.rondelDaggerTestParadeModifier?.guard).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST - Setup
// ============================================================================

Given(
  'a rondel-dagger integration grid of {int}x{int}',
  function (world: RondelDaggerWorld, width: number, height: number) {
    world.rondelDaggerIntegrationGrid = new BattleGrid(width, height);
  }
);

Given(
  'a rondel-dagger integration game context with the grid',
  function (world: RondelDaggerWorld) {
    if (!world.rondelDaggerIntegrationGrid) {
      world.rondelDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.rondelDaggerIntegrationEntities) {
      world.rondelDaggerIntegrationEntities = new Map();
    }
    if (!world.rondelDaggerIntegrationBeadHands) {
      world.rondelDaggerIntegrationBeadHands = new Map();
    }

    world.rondelDaggerIntegrationGameContext = {
      grid: world.rondelDaggerIntegrationGrid,
      actorId: 'rondel-dagger-integration-attacker',
      getEntity(id: string): Entity | undefined {
        return world.rondelDaggerIntegrationEntities?.get(id);
      },
      getBeadHand(entityId: string) {
        return world.rondelDaggerIntegrationBeadHands?.get(entityId);
      },
    };
  }
);

Given(
  'a rondel-dagger integration attacker at position {int},{int}',
  function (world: RondelDaggerWorld, x: number, y: number) {
    if (!world.rondelDaggerIntegrationGrid) {
      world.rondelDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.rondelDaggerIntegrationEntities) {
      world.rondelDaggerIntegrationEntities = new Map();
    }

    const attackerId = 'rondel-dagger-integration-attacker';
    world.rondelDaggerIntegrationAttacker = new Character(
      attackerId,
      50,
      world.rondelDaggerIntegrationGrid,
      {
        getEntity: () => undefined,
      } as any
    );
    world.rondelDaggerIntegrationAttacker.currentHealth = 50;
    world.rondelDaggerIntegrationEntities.set(attackerId, world.rondelDaggerIntegrationAttacker);
    world.rondelDaggerIntegrationGrid.register(attackerId, x, y);
  }
);

Given(
  'a rondel-dagger integration target {string} at position {int},{int} with {int} health',
  function (world: RondelDaggerWorld, targetName: string, x: number, y: number, health: number) {
    if (!world.rondelDaggerIntegrationGrid) {
      world.rondelDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.rondelDaggerIntegrationEntities) {
      world.rondelDaggerIntegrationEntities = new Map();
    }

    const target = new Character(targetName, health, world.rondelDaggerIntegrationGrid, {
      getEntity: () => undefined,
    } as any);
    target.currentHealth = health;
    world.rondelDaggerIntegrationTarget = target;
    world.rondelDaggerIntegrationEntities.set(targetName, target);
    world.rondelDaggerIntegrationGrid.register(targetName, x, y);
  }
);

Given(
  'the rondel-dagger integration target has defense stats guard {int}, evasion {int}, armor {int}',
  function (world: RondelDaggerWorld, guard: number, evasion: number, armor: number) {
    if (!world.rondelDaggerIntegrationTarget) {
      throw new Error('Target not initialized');
    }
    world.rondelDaggerIntegrationTarget.setGuard(guard);
    world.rondelDaggerIntegrationTarget.setEvasion(evasion);
    world.rondelDaggerIntegrationTarget.setArmor(armor);
  }
);

Given(
  'the rondel-dagger integration defender has equipment modifiers {string}',
  function (world: RondelDaggerWorld, modifiers: string) {
    world.rondelDaggerIntegrationDefenderModifiers = modifiers ? [modifiers] : [];
  }
);

Given(
  'the rondel-dagger integration defender has {int} red beads',
  function (world: RondelDaggerWorld, redBeads: number) {
    world.rondelDaggerIntegrationDefenderBeadCounts = {
      red: redBeads,
      blue: 0,
      green: 0,
      white: 0,
    };
  }
);

// ============================================================================
// INTEGRATION TEST - Combat Resolution with Percer
// ============================================================================

When(
  'the rondel-dagger integration attack resolves with percer modifier',
  function (world: RondelDaggerWorld) {
    if (!world.rondelDaggerIntegrationTarget) {
      throw new Error('Target not initialized');
    }

    const attack = { power: 1, agility: 1 }; // Rondel Dagger stats
    const defense = world.rondelDaggerIntegrationTarget.getDefenseStats();
    const modifiers: AttackModifier[] = ['percer'];

    world.rondelDaggerIntegrationCombatResult = resolveAttack(attack, defense, modifiers);

    // Apply damage on hit
    if (world.rondelDaggerIntegrationCombatResult.outcome === 'hit') {
      const damage = Math.min(
        world.rondelDaggerIntegrationCombatResult.damage,
        world.rondelDaggerIntegrationTarget.currentHealth
      );
      world.rondelDaggerIntegrationTarget.receiveDamage(damage);
    }
  }
);

Then(
  'the rondel-dagger integration combat outcome should be {string}',
  function (world: RondelDaggerWorld, expectedOutcome: string) {
    expect(world.rondelDaggerIntegrationCombatResult).toBeDefined();
    expect(world.rondelDaggerIntegrationCombatResult?.outcome).toBe(expectedOutcome);
  }
);

Then(
  'the rondel-dagger integration combat damage should be {int}',
  function (world: RondelDaggerWorld, expectedDamage: number) {
    expect(world.rondelDaggerIntegrationCombatResult).toBeDefined();
    expect(world.rondelDaggerIntegrationCombatResult?.damage).toBe(expectedDamage);
  }
);

Then(
  'the rondel-dagger integration target health should be {int}',
  function (world: RondelDaggerWorld, expectedHealth: number) {
    expect(world.rondelDaggerIntegrationTarget).toBeDefined();
    expect(world.rondelDaggerIntegrationTarget?.currentHealth).toBe(expectedHealth);
  }
);

// ============================================================================
// INTEGRATION TEST - Parade Defensive Options from Equipment
// ============================================================================

When(
  'the rondel-dagger integration defensive options are checked for melee attack',
  function (world: RondelDaggerWorld) {
    const handCounts = world.rondelDaggerIntegrationDefenderBeadCounts || {
      red: 0,
      blue: 0,
      green: 0,
      white: 0,
    };
    world.rondelDaggerIntegrationDefensiveOptions = buildDefensiveOptions(
      handCounts,
      'melee',
      world.rondelDaggerIntegrationDefenderModifiers
    );
  }
);

Then(
  'the rondel-dagger integration parade option should be available',
  function (world: RondelDaggerWorld) {
    expect(world.rondelDaggerIntegrationDefensiveOptions).toBeDefined();
    const hasParade = world.rondelDaggerIntegrationDefensiveOptions?.some(
      (opt) => opt.id === 'parade-1'
    );
    expect(hasParade).toBe(true);
  }
);

Then(
  'the rondel-dagger integration parade option should NOT be available',
  function (world: RondelDaggerWorld) {
    expect(world.rondelDaggerIntegrationDefensiveOptions).toBeDefined();
    const hasParade = world.rondelDaggerIntegrationDefensiveOptions?.some(
      (opt) => opt.id === 'parade-1'
    );
    expect(hasParade).toBe(false);
  }
);
