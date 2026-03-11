import { When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { EffectResult } from '@src/types/Effect';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

interface CoordinateEffectWorld extends QuickPickleWorld {
  coordinateEffectResult?: EffectResult;
  actionYaml?: Record<string, any>;
}

// Execute CoordinateEffect with targetId and prepType
When(
  'I execute CoordinateEffect with targetId {string} and prepType {string}',
  async function (world: CoordinateEffectWorld, targetId: string, prepType: string) {
    const { CoordinateEffect } = await import('@src/effects/CoordinateEffect');
    const effect = new CoordinateEffect();

    const result = effect.execute(
      (world as any).gameContext!,
      { targetId, prepType },
      {},
      new Map()
    );
    world.coordinateEffectResult = result instanceof Promise ? await result : result;
  }
);

// Result assertions
Then('the coordinate effect result should be successful', function (world: CoordinateEffectWorld) {
  expect(world.coordinateEffectResult).toBeDefined();
  expect(world.coordinateEffectResult!.success).toBe(true);
});

Then('the coordinate effect result should fail', function (world: CoordinateEffectWorld) {
  expect(world.coordinateEffectResult).toBeDefined();
  expect(world.coordinateEffectResult!.success).toBe(false);
});

Then(
  'the coordinate effect reason should be {string}',
  function (world: CoordinateEffectWorld, expectedReason: string) {
    expect(world.coordinateEffectResult).toBeDefined();
    expect(world.coordinateEffectResult!.reason).toBe(expectedReason);
  }
);

// Interruption: clear all preparation stacks on entity (uses shared entities map)
When(
  'the coordinated entity {string} preparations are interrupted by damage',
  function (world: any, entityId: string) {
    const entity = world.entities?.get(entityId);
    expect(entity).toBeDefined();
    // Clear all preparation types (standard interruption rule)
    for (const key of ['windup', 'aim', 'ponder', 'channel', 'rest']) {
      entity!.clearStacks(key);
    }
  }
);

// Load and parse actions YAML file
When(
  'I load the action {string} from actions yaml',
  function (world: CoordinateEffectWorld, actionId: string) {
    const yamlPath = path.join(process.cwd(), 'public/data/actions/core.yaml');
    const fileContent = fs.readFileSync(yamlPath, 'utf-8');
    const parsed = yaml.load(fileContent) as { actions: Array<{ id: string; [key: string]: any }> };

    const action = parsed.actions.find((a) => a.id === actionId);
    expect(action).toBeDefined();

    world.actionYaml = action!;
  }
);

// Action cost field assertion
Then(
  'the action cost should have field {string} with value {int}',
  function (world: CoordinateEffectWorld, fieldName: string, expectedValue: number) {
    expect(world.actionYaml).toBeDefined();
    const cost = world.actionYaml!.cost;
    expect(cost).toBeDefined();
    expect(cost[fieldName]).toBe(expectedValue);
  }
);

// Action parameter range assertion
Then(
  'the action parameter range should be {string}',
  function (world: CoordinateEffectWorld, expectedRange: string) {
    expect(world.actionYaml).toBeDefined();
    const parameters = world.actionYaml!.parameters;
    expect(parameters).toBeDefined();
    expect(parameters.length).toBeGreaterThan(0);

    const [, maxStr] = expectedRange.split('-');
    const max = parseInt(maxStr, 10);

    const rangeParam = parameters.find((p: any) => p.range !== undefined);
    expect(rangeParam).toBeDefined();
    expect(rangeParam!.range).toBe(max);
  }
);
