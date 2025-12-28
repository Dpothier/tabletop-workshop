import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { ActionCost } from '@src/types/ActionCost';
import type { BeadCounts } from '@src/types/Beads';
import type { OptionChoice } from '@src/types/ParameterPrompt';
import { OptionSelectionUI } from '@src/ui/OptionSelectionUI';

interface OptionSelectionUIWorld extends QuickPickleWorld {
  ui?: OptionSelectionUI;
  options?: OptionChoice[];
  multiSelect?: boolean;
  availableBeads?: BeadCounts;
  availableTime?: number;
  confirmCallback?: (selectedIds: string[]) => void;
  cancelCallback?: () => void;
  confirmCallbackFired?: boolean;
  confirmCallbackArgs?: string[];
  cancelCallbackFired?: boolean;
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
function parseCostString(costStr: string): ActionCost | undefined {
  // Empty or whitespace-only string means no cost
  const normalized = costStr.replace(/[{}]/g, '').trim();
  if (!normalized) {
    return undefined;
  }

  const cost: ActionCost = { time: 0 };

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

// Step: Create OptionSelectionUI instance
Given('an OptionSelectionUI instance', function (world: OptionSelectionUIWorld) {
  world.ui = new OptionSelectionUI();
  world.options = [];
  world.multiSelect = false;
  world.confirmCallbackFired = false;
  world.confirmCallbackArgs = [];
  world.cancelCallbackFired = false;
});

// Step: Define options from a table
Given('options with labels:', function (world: OptionSelectionUIWorld, table: any) {
  world.options = table.hashes().map((row: any) => {
    const cost = parseCostString(row.cost || '');
    return {
      id: row.id,
      label: row.label,
      cost,
    };
  });
});

// Step: Set single-select mode
Given('single-select mode', function (world: OptionSelectionUIWorld) {
  world.multiSelect = false;
});

// Step: Set multi-select mode
Given('multi-select mode', function (world: OptionSelectionUIWorld) {
  world.multiSelect = true;
});

// Step: Show UI with available beads
When(
  'I show the UI with available beads {string}',
  function (world: OptionSelectionUIWorld, beadsStr: string) {
    expect(world.ui).toBeDefined();
    expect(world.options).toBeDefined();

    world.availableBeads = parseBeadCountsString(beadsStr);
    world.availableTime = 0;

    world.confirmCallback = (selectedIds: string[]) => {
      world.confirmCallbackFired = true;
      world.confirmCallbackArgs = selectedIds;
    };

    world.cancelCallback = () => {
      world.cancelCallbackFired = true;
    };

    world.ui!.show({
      prompt: 'Select options',
      options: world.options!,
      multiSelect: world.multiSelect!,
      availableBeads: world.availableBeads,
      availableTime: world.availableTime,
      onConfirm: world.confirmCallback,
      onCancel: world.cancelCallback,
    });
  }
);

// Step: Verify all options are visible
Then(
  'all {int} options should be visible',
  function (world: OptionSelectionUIWorld, count: number) {
    expect(world.ui).toBeDefined();
    const state = world.ui!.getState();
    expect(state.options).toHaveLength(count);
  }
);

// Step: Verify option shows specific cost
Then(
  'option {string} should show cost {string}',
  function (world: OptionSelectionUIWorld, optionId: string, costStr: string) {
    expect(world.ui).toBeDefined();
    const state = world.ui!.getState();
    const option = state.options.find((o) => o.id === optionId);
    expect(option).toBeDefined();

    const expectedCost = parseCostString(costStr);
    expect(option!.cost).toEqual(expectedCost);
  }
);

// Step: Verify option is affordable
Then(
  'option {string} should be affordable',
  function (world: OptionSelectionUIWorld, optionId: string) {
    expect(world.ui).toBeDefined();
    const isAffordable = world.ui!.isOptionAffordable(optionId);
    expect(isAffordable).toBe(true);
  }
);

// Step: Verify option is NOT affordable
Then(
  'option {string} should NOT be affordable',
  function (world: OptionSelectionUIWorld, optionId: string) {
    expect(world.ui).toBeDefined();
    const isAffordable = world.ui!.isOptionAffordable(optionId);
    expect(isAffordable).toBe(false);
  }
);

// Step: Select an option
When('I select option {string}', function (world: OptionSelectionUIWorld, optionId: string) {
  expect(world.ui).toBeDefined();
  world.ui!.selectOption(optionId);
});

// Step: Attempt to select an option (without assertion)
When(
  'I attempt to select option {string}',
  function (world: OptionSelectionUIWorld, optionId: string) {
    expect(world.ui).toBeDefined();
    world.ui!.selectOption(optionId);
  }
);

// Step: Verify option is selected
Then(
  'option {string} should be selected',
  function (world: OptionSelectionUIWorld, optionId: string) {
    expect(world.ui).toBeDefined();
    const isSelected = world.ui!.isOptionSelected(optionId);
    expect(isSelected).toBe(true);
  }
);

// Step: Verify option is NOT selected
Then(
  'option {string} should NOT be selected',
  function (world: OptionSelectionUIWorld, optionId: string) {
    expect(world.ui).toBeDefined();
    const isSelected = world.ui!.isOptionSelected(optionId);
    expect(isSelected).toBe(false);
  }
);

// Step: Verify selected options match expected
Then(
  'selected options should be {string}',
  function (world: OptionSelectionUIWorld, expectedStr: string) {
    expect(world.ui).toBeDefined();
    const selectedIds = world.ui!.getSelectedOptionIds();
    const expected = expectedStr ? expectedStr.split(',') : [];
    expect(selectedIds).toEqual(expected);
  }
);

// Step: Verify selected options are empty
Then('selected options should be empty', function (world: OptionSelectionUIWorld) {
  expect(world.ui).toBeDefined();
  const selectedIds = world.ui!.getSelectedOptionIds();
  expect(selectedIds).toHaveLength(0);
});

// Step: Deselect an option
When('I deselect option {string}', function (world: OptionSelectionUIWorld, optionId: string) {
  expect(world.ui).toBeDefined();
  world.ui!.deselectOption(optionId);
});

// Step: Confirm the selection
When('I confirm the selection', function (world: OptionSelectionUIWorld) {
  expect(world.ui).toBeDefined();
  world.ui!.confirm();
});

// Step: Verify confirm callback received correct args
Then(
  'the confirm callback should receive {string}',
  function (world: OptionSelectionUIWorld, expectedStr: string) {
    expect(world.confirmCallbackFired).toBe(true);
    const expected = expectedStr ? expectedStr.split(',') : [];
    expect(world.confirmCallbackArgs).toEqual(expected);
  }
);

// Step: Cancel the selection
When('I cancel the selection', function (world: OptionSelectionUIWorld) {
  expect(world.ui).toBeDefined();
  world.ui!.cancel();
});

// Step: Verify cancel callback was called
Then('the cancel callback should have been called', function (world: OptionSelectionUIWorld) {
  expect(world.cancelCallbackFired).toBe(true);
});

// Step: Verify can select option
Then('I can select option {string}', function (world: OptionSelectionUIWorld, optionId: string) {
  expect(world.ui).toBeDefined();
  world.ui!.selectOption(optionId);
  const isSelected = world.ui!.isOptionSelected(optionId);
  expect(isSelected).toBe(true);
});

// Step: Verify total selected cost
Then(
  'the total selected cost should be {string}',
  function (world: OptionSelectionUIWorld, costStr: string) {
    expect(world.ui).toBeDefined();
    const actual = world.ui!.getSelectedOptionsCost();
    const expected = parseCostString(costStr);

    // Handle both undefined and empty cost objects
    const expectedRed = expected?.red ?? 0;
    const expectedBlue = expected?.blue ?? 0;
    const expectedGreen = expected?.green ?? 0;
    const expectedWhite = expected?.white ?? 0;

    expect(actual.red ?? 0).toBe(expectedRed);
    expect(actual.blue ?? 0).toBe(expectedBlue);
    expect(actual.green ?? 0).toBe(expectedGreen);
    expect(actual.white ?? 0).toBe(expectedWhite);
  }
);
