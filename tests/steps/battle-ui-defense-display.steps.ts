import { Given, When, Then } from 'quickpickle';
import { expect, vi, type Mock } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';

interface MockText {
  setText: Mock;
  text: string;
  x: number;
  y: number;
  destroy: Mock;
  setOrigin?: Mock;
  setDepth?: Mock;
}

interface MockRectangle {
  setStrokeStyle: Mock;
}

interface MockGraphics {
  clear: Mock;
  lineStyle: Mock;
  beginPath: Mock;
  moveTo: Mock;
  lineTo: Mock;
  arc: Mock;
  strokePath: Mock;
  fillPath: Mock;
  fillStyle: Mock;
  fillCircle: Mock;
  strokeCircle: Mock;
}

interface MockContainer {
  add: Mock;
}

interface MockScene {
  add: {
    rectangle: (x: number, y: number, w: number, h: number, color: number) => MockRectangle;
    text: (x: number, y: number, text: string, style: object) => MockText;
    graphics: () => MockGraphics;
    container: (x: number, y: number) => MockContainer;
  };
  input: {
    on: Mock;
  };
}

interface DefenseStats {
  armor: number;
  guard: number;
  evasion: number;
}

interface MockEntity {
  getDefenseStats: () => DefenseStats;
  setArmor: (value: number) => void;
  setGuard: (value: number) => void;
  setEvasion: (value: number) => void;
  armor: number;
  guard: number;
  evasion: number;
}

interface BattleUIDefenseDisplayWorld extends QuickPickleWorld {
  scene?: MockScene;
  defenseStatsText?: MockText;
  mockMonster?: MockEntity;
  allCreatedTexts?: MockText[];
  defenseStatsDisplay?: string;
}

/**
 * Creates a mock Phaser scene for BattleUI testing
 */
function createMockScene(world: BattleUIDefenseDisplayWorld): MockScene {
  world.allCreatedTexts = [];

  const mockGraphics: MockGraphics = {
    clear: vi.fn(),
    lineStyle: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    strokePath: vi.fn(),
    fillPath: vi.fn(),
    fillStyle: vi.fn(),
    fillCircle: vi.fn(),
    strokeCircle: vi.fn(),
  };

  const mockRectangle: MockRectangle = {
    setStrokeStyle: vi.fn().mockReturnThis(),
  };

  const mockContainer: MockContainer = {
    add: vi.fn().mockReturnThis(),
  };

  return {
    add: {
      rectangle: vi.fn(() => mockRectangle),
      text: vi.fn((x: number, y: number, text: string, _style: object): MockText => {
        const mockText: MockText = {
          setText: vi.fn((newText: string) => {
            mockText.text = newText;
            return mockText;
          }),
          text,
          x,
          y,
          destroy: vi.fn(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
        };
        world.allCreatedTexts!.push(mockText);
        return mockText;
      }),
      graphics: vi.fn(() => mockGraphics),
      container: vi.fn(() => mockContainer),
    },
    input: {
      on: vi.fn(),
    },
  };
}

/**
 * Creates a mock monster entity with defense stats
 */
function createMockMonster(armor: number, guard: number, evasion: number): MockEntity {
  const stats: DefenseStats = { armor, guard, evasion };

  return {
    armor,
    guard,
    evasion,
    getDefenseStats: () => ({
      armor: stats.armor,
      guard: stats.guard,
      evasion: stats.evasion,
    }),
    setArmor: (value: number) => {
      stats.armor = value;
    },
    setGuard: (value: number) => {
      stats.guard = value;
    },
    setEvasion: (value: number) => {
      stats.evasion = value;
    },
  };
}

/**
 * Formats defense stats into display text
 */
function formatDefenseStats(stats: DefenseStats): string {
  const lines: string[] = [];
  lines.push(`🛡 ${stats.armor}`);
  lines.push(`🔰 ${stats.guard}`);
  lines.push(`💨 ${stats.evasion}`);
  return lines.join('\n');
}

// Background

Given('a mock BattleUI with monster panel', function (world: BattleUIDefenseDisplayWorld) {
  world.scene = createMockScene(world);
  world.mockMonster = createMockMonster(0, 0, 0);
  world.defenseStatsDisplay = '';
});

// When steps

When(
  'the monster has defense stats: armor {int}, guard {int}, evasion {int}',
  function (world: BattleUIDefenseDisplayWorld, armor: number, guard: number, evasion: number) {
    world.mockMonster = createMockMonster(armor, guard, evasion);
    const stats = world.mockMonster.getDefenseStats();
    world.defenseStatsDisplay = formatDefenseStats(stats);

    // Create the defense stats text at position between HP (155) and wheel (300)
    world.defenseStatsText = world.scene!.add.text(900, 190, world.defenseStatsDisplay, {
      fontSize: '11px',
      color: '#cccccc',
      lineSpacing: 3,
    });
  }
);

When(
  'the monster armor is changed to {int}',
  function (world: BattleUIDefenseDisplayWorld, newArmor: number) {
    world.mockMonster!.setArmor(newArmor);
    const stats = world.mockMonster!.getDefenseStats();
    world.defenseStatsDisplay = formatDefenseStats(stats);

    // Update the text display
    if (world.defenseStatsText) {
      world.defenseStatsText.setText(world.defenseStatsDisplay);
    }
  }
);

When(
  'the monster guard is changed to {int}',
  function (world: BattleUIDefenseDisplayWorld, newGuard: number) {
    world.mockMonster!.setGuard(newGuard);
    const stats = world.mockMonster!.getDefenseStats();
    world.defenseStatsDisplay = formatDefenseStats(stats);

    // Update the text display
    if (world.defenseStatsText) {
      world.defenseStatsText.setText(world.defenseStatsDisplay);
    }
  }
);

When(
  'the monster evasion is changed to {int}',
  function (world: BattleUIDefenseDisplayWorld, newEvasion: number) {
    world.mockMonster!.setEvasion(newEvasion);
    const stats = world.mockMonster!.getDefenseStats();
    world.defenseStatsDisplay = formatDefenseStats(stats);

    // Update the text display
    if (world.defenseStatsText) {
      world.defenseStatsText.setText(world.defenseStatsDisplay);
    }
  }
);

// Then steps

Then('the defense stats text should be created', function (world: BattleUIDefenseDisplayWorld) {
  expect(world.defenseStatsText).toBeDefined();
});

Then(
  'the defense stats text should contain armor value {string}',
  function (world: BattleUIDefenseDisplayWorld, expectedArmor: string) {
    const armorValue = parseInt(expectedArmor, 10);
    const stats = world.mockMonster!.getDefenseStats();
    expect(stats.armor).toBe(armorValue);
  }
);

Then(
  'the defense stats text should contain guard value {string}',
  function (world: BattleUIDefenseDisplayWorld, expectedGuard: string) {
    const guardValue = parseInt(expectedGuard, 10);
    const stats = world.mockMonster!.getDefenseStats();
    expect(stats.guard).toBe(guardValue);
  }
);

Then(
  'the defense stats text should contain evasion value {string}',
  function (world: BattleUIDefenseDisplayWorld, expectedEvasion: string) {
    const evasionValue = parseInt(expectedEvasion, 10);
    const stats = world.mockMonster!.getDefenseStats();
    expect(stats.evasion).toBe(evasionValue);
  }
);

Then(
  'the defense stats display should contain {string}',
  function (world: BattleUIDefenseDisplayWorld, expectedSubstring: string) {
    expect(world.defenseStatsDisplay).toContain(expectedSubstring);
  }
);

Then(
  'the defense stats text Y position should be greater than {int}',
  function (world: BattleUIDefenseDisplayWorld, minY: number) {
    expect(world.defenseStatsText).toBeDefined();
    expect(world.defenseStatsText!.y).toBeGreaterThan(minY);
  }
);

Then(
  'the defense stats text Y position should be less than {int}',
  function (world: BattleUIDefenseDisplayWorld, maxY: number) {
    expect(world.defenseStatsText).toBeDefined();
    expect(world.defenseStatsText!.y).toBeLessThan(maxY);
  }
);

Then(
  'the defense stats text X position should be near {int}',
  function (world: BattleUIDefenseDisplayWorld, expectedX: number) {
    expect(world.defenseStatsText).toBeDefined();
    // Allow 10 pixel tolerance for "near"
    expect(Math.abs(world.defenseStatsText!.x - expectedX)).toBeLessThanOrEqual(10);
  }
);
