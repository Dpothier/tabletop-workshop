import { Given, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { ActionCost } from '@src/types/ActionCost';
import { canAfford } from '@src/utils/affordability';

interface AffordabilityWorld extends QuickPickleWorld {
  available?: ActionCost;
  required?: ActionCost;
  result?: boolean;
}

/**
 * Helper function to parse cost strings like "{ time: 2, red: 1 }" into ActionCost objects.
 * Handles missing properties (treat as 0 or undefined as needed).
 */
function parseCostString(costStr: string): ActionCost {
  const cost: ActionCost = { time: 0 };

  // Normalize the string: remove braces and trim
  const normalized = costStr.replace(/[{}]/g, '').trim();

  if (!normalized) {
    return cost;
  }

  // Split by comma and parse each key:value pair
  const pairs = normalized.split(',').map(p => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split(':').map(s => s.trim());
    if (!key || !value) continue;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) continue;

    // Use type assertion since we know the keys are valid bead colors
    const typedKey = key as keyof ActionCost;
    (cost as Record<string, number>)[typedKey] = numValue;
  }

  return cost;
}

Given('available resources {string}', function (world: AffordabilityWorld, costStr: string) {
  world.available = parseCostString(costStr);
});

Given('required cost {string}', function (world: AffordabilityWorld, costStr: string) {
  world.required = parseCostString(costStr);
});

Then('canAfford should return true', function (world: AffordabilityWorld) {
  expect(world.available).toBeDefined();
  expect(world.required).toBeDefined();

  world.result = canAfford(world.available!, world.required!);

  expect(world.result).toBe(true);
});

Then('canAfford should return false', function (world: AffordabilityWorld) {
  expect(world.available).toBeDefined();
  expect(world.required).toBeDefined();

  world.result = canAfford(world.available!, world.required!);

  expect(world.result).toBe(false);
});
