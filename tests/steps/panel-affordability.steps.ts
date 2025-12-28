import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { ActionCost } from '@src/types/ActionCost';
import type { BeadCounts } from '@src/types/Beads';
import { canAfford, beadCountsToActionCost } from '@src/utils/affordability';

interface PanelAffordabilityWorld extends QuickPickleWorld {
  availableBeads?: BeadCounts;
  availableTime?: number;
  actionCost?: ActionCost;
  isAffordable?: boolean;
  beadCounts?: BeadCounts;
  resultActionCost?: ActionCost;
}

/**
 * Helper function to parse bead count strings like "{ red: 1, blue: 0, green: 0, white: 0 }"
 * into BeadCounts objects.
 */
function parseBeadCountsString(beadsStr: string): BeadCounts {
  const beads: BeadCounts = { red: 0, blue: 0, green: 0, white: 0 };

  // Normalize the string: remove braces and trim
  const normalized = beadsStr.replace(/[{}]/g, '').trim();

  if (!normalized) {
    return beads;
  }

  // Split by comma and parse each key:value pair
  const pairs = normalized.split(',').map((p) => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (!key || !value) continue;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) continue;

    // Use type assertion since we know the keys are valid bead colors
    const typedKey = key as keyof BeadCounts;
    beads[typedKey] = numValue;
  }

  return beads;
}

/**
 * Helper function to parse cost strings like "{ time: 2, red: 1 }" into ActionCost objects.
 */
function parseCostString(costStr: string): ActionCost {
  const cost: ActionCost = { time: 0 };

  // Normalize the string: remove braces and trim
  const normalized = costStr.replace(/[{}]/g, '').trim();

  if (!normalized) {
    return cost;
  }

  // Split by comma and parse each key:value pair
  const pairs = normalized.split(',').map((p) => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (!key || !value) continue;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) continue;

    // Use type assertion since we know the keys are valid
    const typedKey = key as keyof ActionCost;
    (cost as unknown as Record<string, number>)[typedKey] = numValue;
  }

  return cost;
}

// Step: Set available beads
Given('available beads {string}', function (world: PanelAffordabilityWorld, beadsStr: string) {
  world.availableBeads = parseBeadCountsString(beadsStr);
});

// Step: Set available time
Given('available time {string}', function (world: PanelAffordabilityWorld, timeStr: string) {
  world.availableTime = parseInt(timeStr, 10);
});

// Step: Set action cost
Given('an action with cost {string}', function (world: PanelAffordabilityWorld, costStr: string) {
  world.actionCost = parseCostString(costStr);
});

// Step: Check affordability
When('I check if the action is affordable', function (world: PanelAffordabilityWorld) {
  expect(world.availableBeads).toBeDefined();
  expect(world.availableTime).toBeDefined();
  expect(world.actionCost).toBeDefined();

  // Convert beads to ActionCost with the available time
  const available = beadCountsToActionCost(world.availableBeads!, world.availableTime!);

  // Check if affordable using the canAfford utility
  world.isAffordable = canAfford(available, world.actionCost!);
});

// Step: Assert action is affordable
Then('the action should be affordable', function (world: PanelAffordabilityWorld) {
  expect(world.isAffordable).toBe(true);
});

// Step: Assert action is NOT affordable
Then('the action should NOT be affordable', function (world: PanelAffordabilityWorld) {
  expect(world.isAffordable).toBe(false);
});

// Step: Set BeadCounts for conversion test
Given('a BeadCounts with {string}', function (world: PanelAffordabilityWorld, beadsStr: string) {
  world.beadCounts = parseBeadCountsString(beadsStr);
});

// Step: Set available time for conversion
Given('an available time {string}', function (world: PanelAffordabilityWorld, timeStr: string) {
  world.availableTime = parseInt(timeStr, 10);
});

// Step: Convert bead counts to ActionCost
When('I convert bead counts to ActionCost with time', function (world: PanelAffordabilityWorld) {
  expect(world.beadCounts).toBeDefined();
  expect(world.availableTime).toBeDefined();

  world.resultActionCost = beadCountsToActionCost(world.beadCounts!, world.availableTime!);
});

// Step: Assert resulting ActionCost has correct time
Then(
  'the resulting ActionCost should have time: {int}',
  function (world: PanelAffordabilityWorld, expectedTime: number) {
    expect(world.resultActionCost).toBeDefined();
    expect(world.resultActionCost!.time).toBe(expectedTime);
  }
);

// Step: Assert resulting ActionCost has correct red beads
Then(
  'the resulting ActionCost should have red: {int}',
  function (world: PanelAffordabilityWorld, expectedRed: number) {
    expect(world.resultActionCost).toBeDefined();
    expect(world.resultActionCost!.red).toBe(expectedRed);
  }
);

// Step: Assert resulting ActionCost has correct blue beads
Then(
  'the resulting ActionCost should have blue: {int}',
  function (world: PanelAffordabilityWorld, expectedBlue: number) {
    expect(world.resultActionCost).toBeDefined();
    expect(world.resultActionCost!.blue).toBe(expectedBlue);
  }
);

// Step: Assert resulting ActionCost has correct green beads
Then(
  'the resulting ActionCost should have green: {int}',
  function (world: PanelAffordabilityWorld, expectedGreen: number) {
    expect(world.resultActionCost).toBeDefined();
    expect(world.resultActionCost!.green).toBe(expectedGreen);
  }
);

// Step: Assert resulting ActionCost has correct white beads
Then(
  'the resulting ActionCost should have white: {int}',
  function (world: PanelAffordabilityWorld, expectedWhite: number) {
    expect(world.resultActionCost).toBeDefined();
    expect(world.resultActionCost!.white).toBe(expectedWhite);
  }
);
