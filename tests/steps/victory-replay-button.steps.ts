import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';

// Must mock Phaser before importing VictoryScene (Phaser requires browser globals)
vi.mock('phaser', () => ({
  default: {
    Scene: class MockPhaserScene {
      constructor(_config?: any) {}
      sys = { settings: { key: 'VictoryScene' } };
    },
  },
  __esModule: true,
}));

import { VictoryScene } from '@src/scenes/VictoryScene';
import type { BattleSnapshot } from '@src/recording/BattleSnapshot';
import type { CombatLogEntry } from '@src/recording/CombatRecorder';

interface MockRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: number;
  _interactive: boolean;
  listeners: Map<string, (...args: any[]) => void>;
  setInteractive: (opts?: any) => MockRectangle;
  setFillStyle: (color: number) => MockRectangle;
  on: (event: string, callback?: any) => MockRectangle;
}

interface MockText {
  x: number;
  y: number;
  text: string;
  setOrigin: (x: number, y?: number) => MockText;
  on: (event: string, callback?: any) => MockText;
}

interface VictoryWorld extends QuickPickleWorld {
  scene?: VictoryScene;
  mockRectangles?: MockRectangle[];
  mockTexts?: MockText[];
  mockPhaserScene?: any;
  recordingData?: { snapshot: BattleSnapshot; entries: CombatLogEntry[] };
}

function createMockRectangle(
  x: number,
  y: number,
  w: number,
  h: number,
  color: number
): MockRectangle {
  const rect: MockRectangle = {
    x,
    y,
    width: w,
    height: h,
    fillColor: color,
    _interactive: false,
    listeners: new Map(),
    setInteractive: vi.fn((_opts?: any) => {
      rect._interactive = true;
      return rect;
    }),
    setFillStyle: vi.fn((_color: number) => rect),
    on: vi.fn((event: string, callback?: any) => {
      if (callback) rect.listeners.set(event, callback);
      return rect;
    }),
  };
  return rect;
}

function createMockText(x: number, y: number, content: string): MockText {
  const text: MockText = {
    x,
    y,
    text: content,
    setOrigin: vi.fn(() => text),
    on: vi.fn(() => text),
  };
  return text;
}

function createMockPhaserScene(mockRectangles: MockRectangle[], mockTexts: MockText[]): any {
  return {
    add: {
      rectangle: vi.fn((x: number, y: number, w: number, h: number, color: number) => {
        const rect = createMockRectangle(x, y, w, h, color);
        mockRectangles.push(rect);
        return rect;
      }),
      text: vi.fn((x: number, y: number, content: string, _style?: any) => {
        const text = createMockText(x, y, content);
        mockTexts.push(text);
        return text;
      }),
    },
    cameras: { main: { width: 1024, height: 768 } },
    data: {
      _store: new Map<string, any>(),
      set: vi.fn(function (this: any, key: string, value: any) {
        this._store.set(key, value);
      }),
      get: vi.fn(function (this: any, key: string) {
        return this._store.get(key);
      }),
    },
    scene: { start: vi.fn(), stop: vi.fn() },
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

/** Helper: find the mock rectangle whose associated text label is "Replay" */
function findReplayRect(world: VictoryWorld): MockRectangle | undefined {
  const replayText = world.mockTexts!.find((t) => t.text === 'Replay');
  if (!replayText) return undefined;
  // The rectangle shares the same (x, y) as the text label
  return world.mockRectangles!.find((r) => r.x === replayText.x && r.y === replayText.y);
}

/** Helper: find the mock rectangle whose associated text label is "Play Again" */
function findPlayAgainRect(world: VictoryWorld): MockRectangle | undefined {
  const playAgainText = world.mockTexts!.find((t) => t.text === 'Play Again');
  if (!playAgainText) return undefined;
  // The rectangle shares the same (x, y) as the text label
  return world.mockRectangles!.find((r) => r.x === playAgainText.x && r.y === playAgainText.y);
}

// ── Given ───────────────────────────────────────────────────────

Given('a VictoryScene with mocked Phaser dependencies', function (world: VictoryWorld) {
  world.mockRectangles = [];
  world.mockTexts = [];
  world.mockPhaserScene = createMockPhaserScene(world.mockRectangles, world.mockTexts);
});

// ── When ────────────────────────────────────────────────────────

When(
  'the VictoryScene is created with a recording containing {int} entries',
  function (world: VictoryWorld, entryCount: number) {
    const entries: CombatLogEntry[] = Array.from(
      { length: entryCount },
      (_, i) =>
        ({
          type: 'action' as const,
          timestamp: i,
          actorId: 'test',
          actionName: `action-${i}`,
          result: 'success' as const,
        }) as any
    );

    world.recordingData = { snapshot: createMinimalSnapshot(), entries };

    const scene = new VictoryScene();
    Object.assign(scene, world.mockPhaserScene);
    scene.init({
      victory: true,
      monster: 'TestMonster',
      turns: 5,
      recording: world.recordingData,
    } as any);
    scene.create();
    world.scene = scene;
  }
);

When('the VictoryScene is created without a recording', function (world: VictoryWorld) {
  const scene = new VictoryScene();
  Object.assign(scene, world.mockPhaserScene);
  scene.init({
    victory: true,
    monster: 'TestMonster',
    turns: 5,
  } as any);
  scene.create();
  world.scene = scene;
});

When('the Replay button is clicked', function (world: VictoryWorld) {
  const rect = findReplayRect(world);
  expect(rect).toBeDefined();
  const cb = rect!.listeners.get('pointerdown');
  expect(cb).toBeDefined();
  cb!();
});

When('the Play Again button is clicked', function (world: VictoryWorld) {
  const rect = findPlayAgainRect(world);
  expect(rect).toBeDefined();
  const cb = rect!.listeners.get('pointerdown');
  expect(cb).toBeDefined();
  cb!();
});

// ── Then ────────────────────────────────────────────────────────

Then('an interactive Replay button should exist', function (world: VictoryWorld) {
  const rect = findReplayRect(world);
  expect(rect).toBeDefined();
  expect(rect!._interactive).toBe(true);
});

Then(
  'the Replay button text should read {string}',
  function (world: VictoryWorld, expected: string) {
    const replayText = world.mockTexts!.find((t) => t.text === expected);
    expect(replayText).toBeDefined();
  }
);

Then('no Replay button should exist', function (world: VictoryWorld) {
  const replayText = world.mockTexts!.find((t) => t.text === 'Replay');
  expect(replayText).toBeUndefined();
});

Then(
  'the scene should transition to ReplayScene with the recording data',
  function (world: VictoryWorld) {
    const startFn = world.mockPhaserScene!.scene.start;
    expect(startFn).toHaveBeenCalledWith('ReplayScene', world.recordingData);
  }
);

Then('the scene should call stop before starting ReplayScene', function (world: VictoryWorld) {
  const stopFn = world.mockPhaserScene!.scene.stop;
  const startFn = world.mockPhaserScene!.scene.start;
  expect(stopFn).toHaveBeenCalled();
  expect(startFn).toHaveBeenCalledWith('ReplayScene', world.recordingData);
});

Then('the scene should transition to MenuScene', function (world: VictoryWorld) {
  const startFn = world.mockPhaserScene!.scene.start;
  expect(startFn).toHaveBeenCalledWith('MenuScene');
});
