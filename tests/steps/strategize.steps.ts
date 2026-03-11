import { When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import { DrawBeadsEffect } from '@src/effects/DrawBeadsEffect';
import type { BeadColor } from '@src/types/Beads';
import type { EffectResult } from '@src/types/Effect';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

interface StrategizeWorld extends QuickPickleWorld {
  gameContext?: any;
  effectResult?: EffectResult;
  restEvent?: any;
  playerBeadSystem?: PlayerBeadSystem;
  drawnBeads?: BeadColor[];
  returnedBead?: BeadColor;
  restActionDef?: Record<string, any>;
}

// ===== Strategize-specific When Steps =====

When(
  'I execute DrawBeadsEffect to draw {int} beads for {string} with strategize modifier',
  async function (world: StrategizeWorld, count: number, entityId: string) {
    const effect = new DrawBeadsEffect();
    const result = effect.execute(
      world.gameContext!,
      { count, entityId },
      { strategize: true },
      new Map()
    );
    world.effectResult = result instanceof Promise ? await result : result;

    if (world.effectResult?.data?.beads) {
      world.drawnBeads = world.effectResult.data.beads as BeadColor[];
    }
  }
);

When('I return the first drawn bead to pool', function (world: StrategizeWorld) {
  expect(world.drawnBeads).toBeDefined();
  expect(world.drawnBeads!.length).toBeGreaterThan(0);
  expect(world.playerBeadSystem).toBeDefined();

  world.returnedBead = world.drawnBeads![0];
  world.playerBeadSystem!.returnToPool(world.returnedBead);
});

When('I load the rest action definition from YAML', function (world: StrategizeWorld) {
  const yamlPath = path.join(process.cwd(), 'public/data/actions/core.yaml');
  const fileContent = fs.readFileSync(yamlPath, 'utf-8');
  const parsed = yaml.load(fileContent) as { actions: Array<{ id: string; [key: string]: any }> };

  const action = parsed.actions.find((a) => a.id === 'rest');
  expect(action).toBeDefined();
  world.restActionDef = action!;
});

// ===== Strategize-specific Then Steps =====

Then(
  'the effect result data should include drawn beads list with {int} beads',
  function (world: StrategizeWorld, expectedCount: number) {
    expect(world.effectResult).toBeDefined();
    expect(world.effectResult!.data).toBeDefined();
    expect(world.effectResult!.data.beads).toBeDefined();
    const beads = world.effectResult!.data.beads as BeadColor[];
    expect(beads.length).toBe(expectedCount);
  }
);

Then(
  'the effect result data should indicate must return {int} bead',
  function (world: StrategizeWorld, returnCount: number) {
    expect(world.effectResult).toBeDefined();
    expect(world.effectResult!.data).toBeDefined();
    expect(world.effectResult!.data.mustReturn).toBe(returnCount);
  }
);

Then('the pool should contain the returned bead', function (world: StrategizeWorld) {
  expect(world.returnedBead).toBeDefined();
  expect(world.playerBeadSystem).toBeDefined();

  const bagCounts = world.playerBeadSystem!.getBagCounts();
  expect(bagCounts[world.returnedBead!]).toBeGreaterThan(0);
});

Then(
  'the rest action should have a strategize option with cost {int} blue bead',
  function (world: StrategizeWorld, blueCost: number) {
    expect(world.restActionDef).toBeDefined();
    expect(world.restActionDef!.options).toBeDefined();
    expect(world.restActionDef!.options.strategize).toBeDefined();
    expect(world.restActionDef!.options.strategize.cost).toBeDefined();
    expect(world.restActionDef!.options.strategize.cost.blue).toBe(blueCost);
  }
);

Then(
  'the rest action strategize option should have ponder as alternative cost',
  function (world: StrategizeWorld) {
    expect(world.restActionDef).toBeDefined();
    expect(world.restActionDef!.options).toBeDefined();
    expect(world.restActionDef!.options.strategize).toBeDefined();
    expect(world.restActionDef!.options.strategize.alternativeCost).toBeDefined();
    expect(world.restActionDef!.options.strategize.alternativeCost.ponder).toBe(1);
  }
);
