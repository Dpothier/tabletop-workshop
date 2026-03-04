import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { MagicalInput, MagicalResult } from '@src/combat/MagicalResolver';
import { resolveMagicalEffect } from '@src/combat/MagicalResolver';

interface MagicalResolverWorld extends QuickPickleWorld {
  magicalIntensity?: number;
  magicalExtraBeads?: number;
  magicalWard?: number;
  magicalTargetType?: 'enemy' | 'ally';
  magicalAllyAccepts?: boolean;
  magicalResolveResult?: MagicalResult;
}

// ============================================================================
// Given: Magical Effect Intensity
// ============================================================================

Given(
  'a magical effect with intensity {int}',
  function (world: MagicalResolverWorld, intensity: number) {
    world.magicalIntensity = intensity;
  }
);

// ============================================================================
// Given: Extra Beads
// ============================================================================

Given(
  '{int} extra beads of the spell color',
  function (world: MagicalResolverWorld, extraBeads: number) {
    world.magicalExtraBeads = extraBeads;
  }
);

// ============================================================================
// Given: Target Ward
// ============================================================================

Given(
  'the magical target has ward {int}',
  function (world: MagicalResolverWorld, wardValue: number) {
    world.magicalWard = wardValue;
  }
);

// ============================================================================
// Given: Target Type
// ============================================================================

Given(
  'the magical target is an enemy',
  function (world: MagicalResolverWorld) {
    world.magicalTargetType = 'enemy';
    world.magicalAllyAccepts = undefined;
  }
);

Given(
  'the magical target is an ally who accepts',
  function (world: MagicalResolverWorld) {
    world.magicalTargetType = 'ally';
    world.magicalAllyAccepts = true;
  }
);

Given(
  'the magical target is an ally who resists',
  function (world: MagicalResolverWorld) {
    world.magicalTargetType = 'ally';
    world.magicalAllyAccepts = false;
  }
);

// ============================================================================
// When: Resolve Magical Effect
// ============================================================================

When('I resolve the magical effect', function (world: MagicalResolverWorld) {
  expect(world.magicalIntensity).toBeDefined();
  expect(world.magicalWard).toBeDefined();
  expect(world.magicalTargetType).toBeDefined();

  // Calculate intensity with extra beads
  const totalIntensity = world.magicalIntensity! + (world.magicalExtraBeads || 0);

  // Build magical input
  const magicalInput: MagicalInput = {
    intensity: totalIntensity,
  };

  // Resolve with target type
  world.magicalResolveResult = resolveMagicalEffect(
    magicalInput,
    world.magicalWard!,
    world.magicalTargetType!,
    world.magicalAllyAccepts
  );
});

// ============================================================================
// Then: Effect Manifests
// ============================================================================

Then(
  'the magical effect should manifest',
  function (world: MagicalResolverWorld) {
    expect(world.magicalResolveResult).toBeDefined();
    expect(world.magicalResolveResult!.manifests).toBe(true);
  }
);

// ============================================================================
// Then: Effect Does Not Manifest
// ============================================================================

Then(
  'the magical effect should not manifest',
  function (world: MagicalResolverWorld) {
    expect(world.magicalResolveResult).toBeDefined();
    expect(world.magicalResolveResult!.manifests).toBe(false);
  }
);

// ============================================================================
// Then: Intensity Verification
// ============================================================================

Then(
  'the magical intensity should be {int}',
  function (world: MagicalResolverWorld, expectedIntensity: number) {
    expect(world.magicalResolveResult).toBeDefined();
    expect(world.magicalResolveResult!.intensity).toBe(expectedIntensity);
  }
);

// ============================================================================
// Then: Ward Verification
// ============================================================================

Then(
  'the magical ward should be {int}',
  function (world: MagicalResolverWorld, expectedWard: number) {
    expect(world.magicalResolveResult).toBeDefined();
    expect(world.magicalResolveResult!.ward).toBe(expectedWard);
  }
);
