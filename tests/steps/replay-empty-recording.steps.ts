import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';

// Must mock Phaser before importing ReplayScene (Phaser requires browser globals)
vi.mock('phaser', () => ({
  default: {
    Scene: class MockPhaserScene {
      constructor(_config?: any) {}
      sys = { settings: { key: 'ReplayScene' } };
    },
    GameObjects: { Text: class {} },
    Time: { TimerEvent: class {} },
  },
  __esModule: true,
}));

import { ReplayScene } from '@src/scenes/ReplayScene';
import type { BattleSnapshot } from '@src/recording/BattleSnapshot';
import type { CombatLogEntry } from '@src/recording/CombatRecorder';

interface MockText {
  text: string;
  visible: boolean;
  alpha: number;
  _interactive: boolean;
  input: { enabled: boolean };
  setText: (t: string) => MockText;
  setOrigin: (x: number, y?: number) => MockText;
  setInteractive: (opts?: any) => MockText;
  removeInteractive: () => MockText;
  setAlpha: (a: number) => MockText;
  setVisible: (v: boolean) => MockText;
  on: (event: string, callback?: any) => MockText;
}

interface ReplayWorld extends QuickPickleWorld {
  scene?: ReplayScene;
  mockTexts?: Map<string, MockText>;
  mockPhaserScene?: any;
  snapshot?: BattleSnapshot;
  entries?: CombatLogEntry[];
}

function createMockText(initialText: string = ''): MockText {
  const text: MockText = {
    text: initialText,
    visible: true,
    alpha: 1,
    _interactive: true,
    input: { enabled: true },
    setText: vi.fn((t: string) => {
      text.text = t;
      return text;
    }),
    setOrigin: vi.fn((_x: number, _y?: number) => text),
    setInteractive: vi.fn((_opts?: any) => {
      text._interactive = true;
      text.input = { enabled: true };
      return text;
    }),
    removeInteractive: vi.fn(() => {
      text._interactive = false;
      text.input = { enabled: false };
      return text;
    }),
    setAlpha: vi.fn((a: number) => {
      text.alpha = a;
      return text;
    }),
    setVisible: vi.fn((v: boolean) => {
      text.visible = v;
      return text;
    }),
    on: vi.fn((_event: string, _callback?: any) => text),
  };
  return text;
}

function createMockPhaserScene(mockTexts: Map<string, MockText>): any {
  let textIndex = 0;
  const textNames = ['progressText', 'infoPanel', 'nextButton', 'autoButton', 'menuButton'];

  return {
    add: {
      text: vi.fn((_x: number, _y: number, content: string, _style?: any) => {
        const name = textNames[textIndex] || `text_${textIndex}`;
        const mock = createMockText(content);
        mockTexts.set(name, mock);
        textIndex++;
        return mock;
      }),
    },
    cameras: {
      main: { width: 1024, height: 768 },
    },
    input: {
      keyboard: {
        on: vi.fn(),
      },
    },
    time: {
      delayedCall: vi.fn(),
    },
  };
}

function createMinimalSnapshot(): BattleSnapshot {
  const emptyBeads = { red: 0, blue: 0, green: 0, white: 0 };
  return {
    arena: { name: 'Test Arena', width: 9, height: 9 },
    characters: [
      {
        id: 'hero-0',
        name: 'Hero 0',
        position: { x: 1, y: 1 },
        maxHealth: 100,
        currentHealth: 100,
        equipment: {},
        availableActionIds: [],
        beadHand: emptyBeads,
        beadPool: emptyBeads,
        beadDiscard: emptyBeads,
      },
    ],
    monster: {
      id: 'monster',
      name: 'Boss',
      position: { x: 5, y: 4 },
      health: 200,
      maxHealth: 200,
      beadBag: emptyBeads,
      stateMachine: undefined,
    },
    wheelEntries: [],
    actionDefinitions: [],
  };
}

Given('a ReplayScene with mocked Phaser dependencies', function (world: ReplayWorld) {
  world.mockTexts = new Map();
  world.mockPhaserScene = createMockPhaserScene(world.mockTexts);
  world.snapshot = createMinimalSnapshot();
  world.entries = [];
});

When('the scene is created with an empty recording', function (world: ReplayWorld) {
  // Create ReplayScene instance
  const replayScene = new ReplayScene();

  // Inject mocked Phaser methods directly
  Object.assign(replayScene, world.mockPhaserScene);

  // Call init with empty entries
  replayScene.init({
    snapshot: world.snapshot!,
    entries: world.entries!,
  } as any);

  // Call create - this triggers the empty check logic
  replayScene.create();

  // Store the scene for assertions
  world.scene = replayScene;
});

Then('the info panel should display {string}', function (world: ReplayWorld, expectedText: string) {
  const infoPanelMock = world.mockTexts!.get('infoPanel');
  expect(infoPanelMock).toBeDefined();
  expect(infoPanelMock!.text).toBe(expectedText);
  expect(infoPanelMock!.setText).toHaveBeenCalledWith(expectedText);
});

Then(
  'the progress text should display {string}',
  function (world: ReplayWorld, expectedText: string) {
    const progressMock = world.mockTexts!.get('progressText');
    expect(progressMock).toBeDefined();
    expect(progressMock!.text).toBe(expectedText);
    expect(progressMock!.setText).toHaveBeenCalledWith(expectedText);
  }
);

Then('the Next button should have interactivity removed', function (world: ReplayWorld) {
  const nextButtonMock = world.mockTexts!.get('nextButton');
  expect(nextButtonMock).toBeDefined();
  expect(nextButtonMock!.removeInteractive).toHaveBeenCalled();
  expect(nextButtonMock!._interactive).toBe(false);
});

Then('the Auto button should have interactivity removed', function (world: ReplayWorld) {
  const autoButtonMock = world.mockTexts!.get('autoButton');
  expect(autoButtonMock).toBeDefined();
  expect(autoButtonMock!.removeInteractive).toHaveBeenCalled();
  expect(autoButtonMock!._interactive).toBe(false);
});

Then(
  'the Next button alpha should be {float}',
  function (world: ReplayWorld, expectedAlpha: number) {
    const nextButtonMock = world.mockTexts!.get('nextButton');
    expect(nextButtonMock).toBeDefined();
    expect(nextButtonMock!.alpha).toBe(expectedAlpha);
    expect(nextButtonMock!.setAlpha).toHaveBeenCalledWith(expectedAlpha);
  }
);

Then(
  'the Auto button alpha should be {float}',
  function (world: ReplayWorld, expectedAlpha: number) {
    const autoButtonMock = world.mockTexts!.get('autoButton');
    expect(autoButtonMock).toBeDefined();
    expect(autoButtonMock!.alpha).toBe(expectedAlpha);
    expect(autoButtonMock!.setAlpha).toHaveBeenCalledWith(expectedAlpha);
  }
);

Then('the Menu button should be visible', function (world: ReplayWorld) {
  const menuButtonMock = world.mockTexts!.get('menuButton');
  expect(menuButtonMock).toBeDefined();
  expect(menuButtonMock!.visible).toBe(true);
});

Then(
  'getState should return totalSteps equal to {int}',
  function (world: ReplayWorld, expectedTotalSteps: number) {
    const state = (world.scene as any).__replayState();
    expect(state).toBeDefined();
    expect(state.totalSteps).toBe(expectedTotalSteps);
  }
);

Then(
  'getState should return scene equal to {string}',
  function (world: ReplayWorld, expectedScene: string) {
    const state = (world.scene as any).__replayState();
    expect(state).toBeDefined();
    expect(state.scene).toBe(expectedScene);
  }
);
