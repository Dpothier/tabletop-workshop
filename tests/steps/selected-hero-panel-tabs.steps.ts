import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { ActionDefinition, ActionCategory } from '@src/types/ActionDefinition';
import type { BeadCounts } from '@src/types/Beads';
import { SelectedHeroPanel } from '@src/ui/SelectedHeroPanel';
import { createMockScene } from '../mocks/mockScene';

interface SelectedHeroPanelTabsWorld extends QuickPickleWorld {
  mockScene?: any;
  panel?: SelectedHeroPanel;
  actions?: ActionDefinition[];
  currentHeroId?: string;
  previousHeroId?: string;
  activeTab?: ActionCategory;
  onActionCallback?: (actionId: string) => void;
}

/**
 * Helper to create test actions
 */
function createTestActions(): ActionDefinition[] {
  return [
    {
      id: 'move-1',
      name: 'Move',
      category: 'movement',
      description: 'Move your hero',
      cost: { time: 1 },
      parameters: [],
      effects: [],
    },
    {
      id: 'run-1',
      name: 'Run',
      category: 'movement',
      description: 'Move quickly',
      cost: { time: 2 },
      parameters: [],
      effects: [],
    },
    {
      id: 'attack-1',
      name: 'Attack',
      category: 'attack',
      description: 'Basic attack',
      cost: { time: 1, red: 1 },
      parameters: [],
      effects: [],
    },
    {
      id: 'power-attack-1',
      name: 'Power Attack',
      category: 'attack',
      description: 'Powerful attack',
      cost: { time: 2, red: 2 },
      parameters: [],
      effects: [],
    },
    {
      id: 'rest-1',
      name: 'Rest',
      category: 'other',
      description: 'Take a rest',
      cost: { time: 3 },
      parameters: [],
      effects: [],
    },
  ];
}

/**
 * Helper to get the active tab from the panel using reflection
 */
function getActiveTab(panel: SelectedHeroPanel): ActionCategory {
  const panelAny = panel as any;
  return panelAny.activeTab as ActionCategory;
}

/**
 * Helper to get displayed action names from the panel
 */
function getDisplayedActionNames(panel: SelectedHeroPanel): string[] {
  const panelAny = panel as any;
  const buttons = panelAny.actionButtons as any[];
  return buttons.map((btn: any) => btn.name as string);
}

// Step: Create a selected hero panel with specified actions
Given(
  'a selected hero panel with movement and attack actions',
  function (world: SelectedHeroPanelTabsWorld) {
    world.mockScene = createMockScene();
    world.panel = new SelectedHeroPanel(world.mockScene);
    world.actions = createTestActions();
    world.currentHeroId = 'hero-1';
    world.previousHeroId = 'hero-2';
    world.onActionCallback = vi.fn();

    world.panel!.create(world.actions!, world.onActionCallback);
    world.panel!.showPanel(world.currentHeroId!);
  }
);

// Step: Create a selected hero panel with all action categories
Given(
  'a selected hero panel with movement, attack and other actions',
  function (world: SelectedHeroPanelTabsWorld) {
    world.mockScene = createMockScene();
    world.panel = new SelectedHeroPanel(world.mockScene);
    world.actions = createTestActions();
    world.currentHeroId = 'hero-1';
    world.previousHeroId = 'hero-2';
    world.onActionCallback = vi.fn();

    world.panel!.create(world.actions!, world.onActionCallback);
    world.panel!.showPanel(world.currentHeroId!);
  }
);

// Step: Select a specific tab
When('I select the attack tab', function (world: SelectedHeroPanelTabsWorld) {
  expect(world.panel).toBeDefined();
  const panelAny = world.panel as any;

  // Call selectTab method through reflection
  panelAny.selectTab('attack');
  world.activeTab = getActiveTab(world.panel!);
});

// Step: Select the other tab
When('I select the other tab', function (world: SelectedHeroPanelTabsWorld) {
  expect(world.panel).toBeDefined();
  const panelAny = world.panel as any;

  panelAny.selectTab('other');
  world.activeTab = getActiveTab(world.panel!);
});

// Step: Select the movement tab
When('I select the movement tab', function (world: SelectedHeroPanelTabsWorld) {
  expect(world.panel).toBeDefined();
  const panelAny = world.panel as any;

  panelAny.selectTab('movement');
  world.activeTab = getActiveTab(world.panel!);
});

// Step: Show panel again for the same hero
When(
  'the panel is shown again for the same hero',
  function (world: SelectedHeroPanelTabsWorld) {
    expect(world.panel).toBeDefined();
    expect(world.currentHeroId).toBeDefined();

    world.panel!.showPanel(world.currentHeroId!);
    world.activeTab = getActiveTab(world.panel!);
  }
);

// Step: Show panel for a different hero
When('the panel is shown for a different hero', function (world: SelectedHeroPanelTabsWorld) {
  expect(world.panel).toBeDefined();
  expect(world.previousHeroId).toBeDefined();

  world.panel!.showPanel(world.previousHeroId!);
  world.activeTab = getActiveTab(world.panel!);
});

// Step: Update affordability for current hero
When(
  'the affordability is updated for the current hero',
  function (world: SelectedHeroPanelTabsWorld) {
    expect(world.panel).toBeDefined();

    const beads: BeadCounts = { red: 5, blue: 5, green: 5, white: 5 };
    world.panel!.updateAffordability(beads, 4);
    world.activeTab = getActiveTab(world.panel!);
  }
);

// Step: Assert attack tab is active
Then('the attack tab should still be active', function (world: SelectedHeroPanelTabsWorld) {
  const activeTab = getActiveTab(world.panel!);
  expect(activeTab, 'Attack tab should be active').toBe('attack');
});

// Step: Assert movement tab is active
Then('the movement tab should be active', function (world: SelectedHeroPanelTabsWorld) {
  const activeTab = getActiveTab(world.panel!);
  expect(activeTab, 'Movement tab should be active').toBe('movement');
});

// Step: Assert attack actions are displayed
Then('attack actions should be displayed', function (world: SelectedHeroPanelTabsWorld) {
  const displayedActions = getDisplayedActionNames(world.panel!);
  expect(displayedActions).toContain('Attack');
  expect(displayedActions).toContain('Power Attack');
  // Movement actions should not be displayed
  expect(displayedActions).not.toContain('Move');
  expect(displayedActions).not.toContain('Run');
});

// Step: Assert movement actions are displayed
Then('movement actions should be displayed', function (world: SelectedHeroPanelTabsWorld) {
  const displayedActions = getDisplayedActionNames(world.panel!);
  expect(displayedActions).toContain('Move');
  expect(displayedActions).toContain('Run');
  // Attack actions should not be displayed
  expect(displayedActions).not.toContain('Attack');
  expect(displayedActions).not.toContain('Power Attack');
});

// Step: Show panel for the first hero again
When('the panel is shown for the first hero again', function (world: SelectedHeroPanelTabsWorld) {
  expect(world.panel).toBeDefined();
  expect(world.currentHeroId).toBeDefined();

  world.panel!.showPanel(world.currentHeroId!);
  world.activeTab = getActiveTab(world.panel!);
});
