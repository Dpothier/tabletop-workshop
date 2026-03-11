import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { BeadCounts } from '@src/types/Beads';
import { SelectedHeroPanel } from '@src/ui/SelectedHeroPanel';
import { BattleGrid } from '@src/state/BattleGrid';
import { createMockScene } from '../mocks/mockScene';

interface SelectedHeroPanelRangeWorld extends QuickPickleWorld {
  mockScene?: any;
  panel?: SelectedHeroPanel;
  grid?: BattleGrid;
  actions?: ActionDefinition[];
  heroId?: string;
  onActionCallback?: (actionId: string) => void;
  entities?: Map<string, { x: number; y: number }>;
}

/**
 * Helper to create test actions including movement and attack actions
 */
function createTestActionsWithAttack(): ActionDefinition[] {
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
  ];
}

/**
 * Helper to get attack button affordability
 */
function getAttackButtonAffordability(panel: SelectedHeroPanel): boolean {
  const panelAny = panel as any;
  const buttons = panelAny.actionButtons as any[];
  const attackButton = buttons.find((btn: any) => btn.getName() === 'Attack');
  return attackButton ? attackButton.isAffordable() : false;
}

/**
 * Helper to get button affordability by name
 */
function getButtonAffordability(panel: SelectedHeroPanel, buttonName: string): boolean {
  const panelAny = panel as any;
  const buttons = panelAny.actionButtons as any[];
  const button = buttons.find((btn: any) => btn.getName() === buttonName);
  return button ? button.isAffordable() : false;
}

// Step: Create a mock scene for selected hero panel testing
Given(
  'a mock scene for selected hero panel testing',
  function (world: SelectedHeroPanelRangeWorld) {
    world.mockScene = createMockScene();
    world.entities = new Map();
  }
);

// Step: Create test actions including attack actions
Given('test actions including attack actions', function (world: SelectedHeroPanelRangeWorld) {
  world.actions = createTestActionsWithAttack();
});

// Step: Register a hero at a position
Given(
  'hero {string} is at position {int},{int} on the grid',
  function (world: SelectedHeroPanelRangeWorld, heroId: string, x: number, y: number) {
    expect(world.grid).toBeDefined();
    expect(world.entities).toBeDefined();

    world.grid!.register(heroId, x, y);
    world.entities!.set(heroId, { x, y });
    world.heroId = heroId;
  }
);

// Step: Register a monster at a position
Given(
  'monster {string} is at position {int},{int} on the grid',
  function (world: SelectedHeroPanelRangeWorld, monsterId: string, x: number, y: number) {
    expect(world.grid).toBeDefined();
    expect(world.entities).toBeDefined();

    world.grid!.register(monsterId, x, y);
    world.entities!.set(monsterId, { x, y });
  }
);

// Step: Create the selected hero panel
When(
  'I create the selected hero panel for {string}',
  function (world: SelectedHeroPanelRangeWorld, heroId: string) {
    expect(world.mockScene).toBeDefined();
    expect(world.actions).toBeDefined();

    world.panel = new SelectedHeroPanel(world.mockScene!);
    world.onActionCallback = vi.fn();

    world.panel!.create(world.actions!, world.onActionCallback!);
    world.panel!.showPanel(heroId);
    world.heroId = heroId;

    // Switch to attack tab so attack buttons are visible
    const panelAny = world.panel as any;
    panelAny.selectTab('attack');
  }
);

// Step: Update action availability with the grid
When('I update action availability with the grid', function (world: SelectedHeroPanelRangeWorld) {
  expect(world.panel).toBeDefined();
  expect(world.grid).toBeDefined();
  expect(world.heroId).toBeDefined();

  // Use high bead counts and time so affordability isn't a factor
  // We're only testing range
  const beads: BeadCounts = { red: 50, blue: 50, green: 50, white: 50 };
  const availableTime = 50;

  world.panel!.updateAffordability(beads, availableTime, world.heroId, world.grid);
});

// Step: Move an entity to a new position
When(
  'I move {string} to position {int},{int} on the grid',
  function (world: SelectedHeroPanelRangeWorld, entityId: string, x: number, y: number) {
    expect(world.grid).toBeDefined();
    expect(world.entities).toBeDefined();

    world.grid!.moveEntity(entityId, { x, y });
    world.entities!.set(entityId, { x, y });
  }
);

// Step: Assert attack button is disabled
Then(
  'the attack button should be disabled due to no target in range',
  function (world: SelectedHeroPanelRangeWorld) {
    expect(world.panel).toBeDefined();
    const isAffordable = getAttackButtonAffordability(world.panel!);
    expect(isAffordable, 'Attack button should be disabled when no target in range').toBe(false);
  }
);

// Step: Assert attack button is enabled
Then('the attack button should be enabled', function (world: SelectedHeroPanelRangeWorld) {
  expect(world.panel).toBeDefined();
  const isAffordable = getAttackButtonAffordability(world.panel!);
  expect(isAffordable, 'Attack button should be enabled when target in range').toBe(true);
});

// Step: Assert move button is enabled
Then('the move button should be enabled', function (world: SelectedHeroPanelRangeWorld) {
  expect(world.panel).toBeDefined();
  // Switch to movement tab to access movement buttons
  const panelAny = world.panel as any;
  panelAny.selectTab('movement');
  const isAffordable = getButtonAffordability(world.panel!, 'Move');
  expect(isAffordable, 'Move button should be enabled').toBe(true);
});

// Step: Assert run button is enabled
Then('the run button should be enabled', function (world: SelectedHeroPanelRangeWorld) {
  expect(world.panel).toBeDefined();
  // Switch to movement tab to access movement buttons
  const panelAny = world.panel as any;
  panelAny.selectTab('movement');
  const isAffordable = getButtonAffordability(world.panel!, 'Run');
  expect(isAffordable, 'Run button should be enabled').toBe(true);
});
