import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { BeadColor } from '@src/types/Beads';
import type { SpellDefinition } from '@src/types/SpellDefinition';
import type { CastInput, WardStats, CastResult } from '@src/combat/CastResolver';
import { resolveSpellCast } from '@src/combat/CastResolver';

interface CastResolverWorld extends QuickPickleWorld {
  spell?: SpellDefinition;
  channelStacks?: number;
  extraBeads?: number;
  enhancements?: string[];
  enhancementBonus?: Record<string, number>;
  ward?: WardStats;
  targetType?: 'enemy' | 'ally';
  allyAccepts?: boolean;
  castResult?: CastResult;
}

// ============================================================================
// Given: Spell Definition
// ============================================================================

Given(
  'a spell {string} with color {string}, base cost {int}, base damage {int}',
  function (
    world: CastResolverWorld,
    spellName: string,
    color: string,
    baseCost: number,
    baseDamage: number
  ) {
    world.spell = {
      id: spellName,
      name: spellName,
      color: color as BeadColor,
      baseCost,
      baseDamage,
      range: 10,
      targetType: 'enemy',
      enhancements: {},
    };
  }
);

// ============================================================================
// Given: Channel Stacks
// ============================================================================

Given('no channel stacks', function (world: CastResolverWorld) {
  world.channelStacks = 0;
});

Given('{int} channel stacks', function (world: CastResolverWorld, stacks: number) {
  world.channelStacks = stacks;
});

Given('{int} channel stack', function (world: CastResolverWorld, stacks: number) {
  world.channelStacks = stacks;
});

// ============================================================================
// Given: Extra Beads (for intensity)
// ============================================================================

Given('no extra beads', function (world: CastResolverWorld) {
  world.extraBeads = 0;
});

Given('{int} extra beads', function (world: CastResolverWorld, beads: number) {
  world.extraBeads = beads;
});

Given('{int} extra bead', function (world: CastResolverWorld, beads: number) {
  world.extraBeads = beads;
});

// ============================================================================
// Given: Spell Enhancements
// ============================================================================

Given(
  'spell enhancement {string} that adds {int} damage',
  function (
    world: CastResolverWorld,
    enhancementName: string,
    damageBonus: number
  ) {
    if (!world.enhancements) {
      world.enhancements = [];
    }
    if (!world.enhancementBonus) {
      world.enhancementBonus = {};
    }

    world.enhancements.push(enhancementName);
    world.enhancementBonus[enhancementName] = damageBonus;

    // Add enhancement to spell definition
    if (world.spell) {
      if (!world.spell.enhancements) {
        world.spell.enhancements = {};
      }
      world.spell.enhancements[enhancementName] = {
        extraDamage: damageBonus,
      };
    }
  }
);

Given(
  'spell enhancements {string} adds {int} damage and {string} adds {int} damage',
  function (
    world: CastResolverWorld,
    enhancement1: string,
    damage1: number,
    enhancement2: string,
    damage2: number
  ) {
    if (!world.enhancements) {
      world.enhancements = [];
    }
    if (!world.enhancementBonus) {
      world.enhancementBonus = {};
    }

    world.enhancements.push(enhancement1);
    world.enhancements.push(enhancement2);
    world.enhancementBonus[enhancement1] = damage1;
    world.enhancementBonus[enhancement2] = damage2;

    // Add enhancements to spell definition
    if (world.spell) {
      if (!world.spell.enhancements) {
        world.spell.enhancements = {};
      }
      world.spell.enhancements[enhancement1] = {
        extraDamage: damage1,
      };
      world.spell.enhancements[enhancement2] = {
        extraDamage: damage2,
      };
    }
  }
);

// ============================================================================
// Given: Target (Enemy or Ally)
// ============================================================================

Given(
  'an enemy target with ward {int}',
  function (world: CastResolverWorld, wardValue: number) {
    world.targetType = 'enemy';
    world.ward = { ward: wardValue };
  }
);

Given(
  'an ally target that does not accept',
  function (world: CastResolverWorld) {
    world.targetType = 'ally';
    world.allyAccepts = false;
    world.ward = { ward: 0 };
  }
);

Given(
  'an ally target that accepts',
  function (world: CastResolverWorld) {
    world.targetType = 'ally';
    world.allyAccepts = true;
    world.ward = { ward: 0 };
  }
);

Given(
  'an ally target that accepts with ward {int}',
  function (world: CastResolverWorld, wardValue: number) {
    world.targetType = 'ally';
    world.allyAccepts = true;
    world.ward = { ward: wardValue };
  }
);

// ============================================================================
// When: Resolve Cast
// ============================================================================

When('I resolve the cast', function (world: CastResolverWorld) {
  expect(world.spell).toBeDefined();
  expect(world.channelStacks).toBeDefined();
  expect(world.extraBeads).toBeDefined();
  expect(world.ward).toBeDefined();
  expect(world.targetType).toBeDefined();

  // Build cast input
  const castInput: CastInput = {
    spell: world.spell!,
    extraBeads: world.extraBeads!,
    channelStacks: world.channelStacks!,
    enhancements: world.enhancements || [],
  };

  // Resolve with ally status (if applicable)
  world.castResult = resolveSpellCast(
    castInput,
    world.ward!,
    world.targetType!,
    world.allyAccepts
  );
});

// ============================================================================
// Then: Outcome
// ============================================================================

Then(
  'the cast outcome should be {string}',
  function (world: CastResolverWorld, expectedOutcome: string) {
    expect(world.castResult).toBeDefined();
    expect(world.castResult!.outcome).toBe(expectedOutcome);
  }
);

// ============================================================================
// Then: Damage
// ============================================================================

Then('the cast damage should be {int}', function (world: CastResolverWorld, expectedDamage: number) {
  expect(world.castResult).toBeDefined();
  expect(world.castResult!.damage).toBe(expectedDamage);
});

// ============================================================================
// Then: Intensity
// ============================================================================

Then('the cast intensity should be {int}', function (world: CastResolverWorld, expectedIntensity: number) {
  expect(world.castResult).toBeDefined();
  expect(world.castResult!.intensity).toBe(expectedIntensity);
});

// ============================================================================
// Then: Effective Cost
// ============================================================================

Then('the cast effective cost should be {int}', function (world: CastResolverWorld, expectedCost: number) {
  expect(world.castResult).toBeDefined();
  expect(world.castResult!.effectiveCost).toBe(expectedCost);
});
