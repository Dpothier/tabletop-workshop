import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { SelectionManager, type SelectableVisual } from '@src/systems/SelectionManager';

/**
 * Mock SelectableVisual that tracks setSelected calls
 */
function createMockVisual(): SelectableVisual & { selectedState: boolean | null } {
  return {
    selectedState: null,
    setSelected(selected: boolean) {
      this.selectedState = selected;
    },
  };
}

interface SelectionManagerWorld extends QuickPickleWorld {
  selectionManager?: SelectionManager;
  visuals?: Map<string, SelectableVisual & { selectedState: boolean | null }>;
  isCurrentActorResult?: boolean;
}

Given(
  'a selection manager with visuals for {string}',
  function (world: SelectionManagerWorld, id: string) {
    const visuals = new Map<string, SelectableVisual & { selectedState: boolean | null }>();
    visuals.set(id, createMockVisual());
    world.visuals = visuals;
    world.selectionManager = new SelectionManager(visuals);
  }
);

Given(
  'a selection manager with visuals for {string} and {string}',
  function (world: SelectionManagerWorld, id1: string, id2: string) {
    const visuals = new Map<string, SelectableVisual & { selectedState: boolean | null }>();
    visuals.set(id1, createMockVisual());
    visuals.set(id2, createMockVisual());
    world.visuals = visuals;
    world.selectionManager = new SelectionManager(visuals);
  }
);

Given(
  'a selection manager with visuals for {string}, {string}, and {string}',
  function (world: SelectionManagerWorld, id1: string, id2: string, id3: string) {
    const visuals = new Map<string, SelectableVisual & { selectedState: boolean | null }>();
    visuals.set(id1, createMockVisual());
    visuals.set(id2, createMockVisual());
    visuals.set(id3, createMockVisual());
    world.visuals = visuals;
    world.selectionManager = new SelectionManager(visuals);
  }
);

When('I select character {string}', function (world: SelectionManagerWorld, characterId: string) {
  world.selectionManager!.select(characterId);
});

When('I deselect', function (world: SelectionManagerWorld) {
  world.selectionManager!.deselect();
});

When(
  'I check if {string} is the current actor with currentActorId {string}',
  function (world: SelectionManagerWorld, characterId: string, currentActorId: string) {
    world.isCurrentActorResult = world.selectionManager!.isCurrentActor(
      characterId,
      currentActorId
    );
  }
);

When(
  'I check if {string} is the current actor with currentActorId null',
  function (world: SelectionManagerWorld, characterId: string) {
    world.isCurrentActorResult = world.selectionManager!.isCurrentActor(characterId, null);
  }
);

Then(
  'the selected character should be {string}',
  function (world: SelectionManagerWorld, expectedId: string) {
    expect(world.selectionManager!.getSelected()).toBe(expectedId);
  }
);

Then('the selected character should be null', function (world: SelectionManagerWorld) {
  expect(world.selectionManager!.getSelected()).toBeNull();
});

Then(
  'getSelected should return {string}',
  function (world: SelectionManagerWorld, expectedId: string) {
    const result = world.selectionManager!.getSelected();
    expect(result).toBe(expectedId);
  }
);

Then('getSelected should return null', function (world: SelectionManagerWorld) {
  const result = world.selectionManager!.getSelected();
  expect(result).toBeNull();
});

Then(
  'visual {string} should have setSelected called with true',
  function (world: SelectionManagerWorld, visualId: string) {
    const visual = world.visuals!.get(visualId);
    expect(visual).toBeDefined();
    expect(visual!.selectedState).toBe(true);
  }
);

Then(
  'visual {string} should have setSelected called with false',
  function (world: SelectionManagerWorld, visualId: string) {
    const visual = world.visuals!.get(visualId);
    expect(visual).toBeDefined();
    expect(visual!.selectedState).toBe(false);
  }
);

Then('isCurrentActor should return true', function (world: SelectionManagerWorld) {
  expect(world.isCurrentActorResult).toBe(true);
});

Then('isCurrentActor should return false', function (world: SelectionManagerWorld) {
  expect(world.isCurrentActorResult).toBe(false);
});
