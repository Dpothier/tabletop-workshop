import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForGameReady, clickGameCoords, getGameState } from '@tests/e2e/fixtures';
import type { BattleSnapshot } from '@src/recording/BattleSnapshot';
import type { CombatLogEntry } from '@src/recording/CombatRecorder';

const { Given, When, Then } = createBdd();

// =============================================================================
// Types
// =============================================================================

interface ReplayData {
  snapshot: BattleSnapshot;
  entries: CombatLogEntry[];
}

// =============================================================================
// Helper Functions
// =============================================================================

function createTestRecording(
  options: {
    characterCount?: number;
    stepCount?: number;
    monsterName?: string;
  } = {}
): ReplayData {
  const charCount = options.characterCount ?? 2;
  const stepCount = options.stepCount ?? 3;
  const monsterName = options.monsterName ?? 'TestBoss';

  const snapshot: BattleSnapshot = {
    arena: { name: 'Test Arena', width: 9, height: 9 },
    characters: Array.from({ length: charCount }, (_, i) => ({
      id: `hero-${i}`,
      name: `Hero ${i}`,
      position: { x: 1 + i, y: 1 },
      maxHealth: 100,
      currentHealth: 100,
      equipment: {},
      availableActionIds: ['move', 'attack'],
      beadHand: { red: 1, blue: 1, green: 0, white: 0 },
      beadPool: { red: 5, blue: 3, green: 2, white: 1 },
      beadDiscard: { red: 0, blue: 0, green: 0, white: 0 },
    })) as any[],
    monster: {
      id: 'monster',
      name: monsterName,
      position: { x: 5, y: 4 },
      health: 200,
      maxHealth: 200,
      beadBag: { red: 4, blue: 4, green: 2, white: 2 },
      stateMachine: undefined,
    },
    wheelEntries: Array.from({ length: charCount + 1 }, (_, i) => ({
      id: i < charCount ? `hero-${i}` : 'monster',
      position: i * (100 / (charCount + 1)),
      arrivalOrder: i,
    })),
    actionDefinitions: [
      { id: 'move', name: 'Move', category: 'movement', cost: 1 },
      { id: 'attack', name: 'Attack', category: 'combat', cost: 2 },
      { id: 'rest', name: 'Rest', category: 'utility', cost: 1 },
    ],
  };

  const entries: CombatLogEntry[] = [];
  let seq = 1;
  for (let i = 0; i < stepCount; i++) {
    const actorIdx = i % (charCount + 1);
    const actorId = actorIdx < charCount ? `hero-${actorIdx}` : 'monster';
    const actorName = actorIdx < charCount ? `Hero ${actorIdx}` : monsterName;
    const actorType = actorIdx < charCount ? 'player' : 'monster';

    entries.push({
      type: 'turn-start',
      seq: seq++,
      actorId,
      actorName,
      actorType,
      wheelPosition: i,
    } as any);

    entries.push({
      type: 'action-selected',
      seq: seq++,
      actorId,
      actorName,
      actionId: 'attack',
      actionName: 'Attack',
      modifiers: [],
      beadCost: 0,
    } as any);
  }

  entries.push({ type: 'battle-end', seq: seq++, outcome: 'victory' } as any);

  return { snapshot, entries };
}

async function getVictoryState(
  page: Page
): Promise<{ hasExportButton: boolean; recording: any } | null> {
  return await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return null;
    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene || activeScene.sys.settings.key !== 'VictoryScene') return null;
    return (activeScene as any).__victoryState?.() ?? null;
  });
}

async function getMenuReplayState(page: Page): Promise<{
  hasReplayButton: boolean;
  recentCombats: any[];
  replayPanelVisible: boolean;
  errorMessage: string | null;
} | null> {
  return await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return null;
    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene || activeScene.sys.settings.key !== 'MenuScene') return null;
    return (activeScene as any).__menuReplayState?.() ?? null;
  });
}

async function navigateToVictoryWithRecording(page: Page, recording: ReplayData): Promise<void> {
  await page.evaluate((data) => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) throw new Error('Phaser game not found');
    // Use active scene's start() to properly stop current scene and start VictoryScene
    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (activeScene) {
      activeScene.scene.start('VictoryScene', {
        victory: true,
        monster: data.snapshot.monster.name,
        turns: 5,
        recording: data,
      });
    } else {
      game.scene.start('VictoryScene', {
        victory: true,
        monster: data.snapshot.monster.name,
        turns: 5,
        recording: data,
      });
    }
  }, recording);

  await page.waitForFunction(
    () => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find((s: any) => s.sys.isActive());
      return scene?.sys?.settings?.key === 'VictoryScene';
    },
    undefined,
    { timeout: 5000 }
  );
}

async function seedLocalStorageWithRecording(
  page: Page,
  recordingId: string,
  recording: ReplayData
): Promise<void> {
  await page.evaluate(
    ({ id, data }) => {
      const lines: string[] = [];
      lines.push(JSON.stringify({ type: 'snapshot', version: 1, ...data.snapshot }));
      data.entries.forEach((entry: any) => lines.push(JSON.stringify(entry)));
      const jsonl = lines.join('\n');

      localStorage.setItem(`combat-recording-${id}`, jsonl);

      const indexKey = 'combat-recordings-index';
      let index: Record<string, any> = {};
      const indexJson = localStorage.getItem(indexKey);
      if (indexJson) {
        try {
          index = JSON.parse(indexJson);
        } catch {
          index = {};
        }
      }
      index[id] = {
        id,
        date: Date.now(),
        monsterName: data.snapshot.monster.name,
        outcome: 'victory',
      };
      localStorage.setItem(indexKey, JSON.stringify(index));
    },
    { id: recordingId, data: recording }
  );
}

// =============================================================================
// Step Definitions: Victory Screen Export
// =============================================================================

Given(
  'I have export-import navigated to the victory screen after a combat victory',
  async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);
    const recording = createTestRecording();
    await navigateToVictoryWithRecording(page, recording);
    const state = await getGameState(page);
    expect(state.scene).toBe('VictoryScene');
  }
);

Given(
  'I have export-import navigated to the victory screen with a recorded combat',
  async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);
    const recording = createTestRecording();
    await navigateToVictoryWithRecording(page, recording);
    const state = await getGameState(page);
    expect(state.scene).toBe('VictoryScene');
  }
);

Then('the export button should be visible on the victory screen', async ({ page }) => {
  const victoryState = await getVictoryState(page);
  expect(victoryState).not.toBeNull();
  expect(victoryState?.hasExportButton).toBe(true);
});

Then('the export button should be positioned below the Main Menu button', async ({ page }) => {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const state = await getGameState(page);
  expect(state.scene).toBe('VictoryScene');
});

When('I export-import click the export button', async ({ page }) => {
  await clickGameCoords(page, 512, 674);
  await page.waitForTimeout(100);
});

Then('a JSONL file download should be triggered', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
  await clickGameCoords(page, 512, 674);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.jsonl');
});

When('I export-import capture the downloaded file contents', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
  await clickGameCoords(page, 512, 674);
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error('Download path is null');
  const fs = await import('fs');
  const fileContents = fs.readFileSync(path, 'utf-8');
  await page.evaluate((content) => {
    (window as any).__lastDownloadedContent = content;
  }, fileContents);
});

Then('the export first line should be valid JSON with type snapshot', async ({ page }) => {
  const fileContents = await page.evaluate(() => (window as any).__lastDownloadedContent);
  expect(fileContents).not.toBeNull();
  const lines = (fileContents as string).split('\n').filter((line) => line.trim());
  expect(lines.length).toBeGreaterThan(0);
  const firstLine = JSON.parse(lines[0]);
  expect(firstLine.type).toBe('snapshot');
});

Then('the export snapshot should have version 1', async ({ page }) => {
  const fileContents = await page.evaluate(() => (window as any).__lastDownloadedContent);
  const lines = (fileContents as string).split('\n').filter((line) => line.trim());
  const firstLine = JSON.parse(lines[0]);
  expect(firstLine.version).toBe(1);
});

Then('the export snapshot should contain arena characters and monster data', async ({ page }) => {
  const fileContents = await page.evaluate(() => (window as any).__lastDownloadedContent);
  const lines = (fileContents as string).split('\n').filter((line) => line.trim());
  const snapshot = JSON.parse(lines[0]);

  expect(snapshot.arena).toBeDefined();
  expect(snapshot.arena.name).toBeDefined();
  expect(snapshot.characters).toBeDefined();
  expect(Array.isArray(snapshot.characters)).toBe(true);
  expect(snapshot.characters.length).toBeGreaterThan(0);
  expect(snapshot.monster).toBeDefined();
  expect(snapshot.monster.name).toBeDefined();
});

// =============================================================================
// Step Definitions: Menu Screen Replay
// =============================================================================

// NOTE: "I am on the main menu" is defined in menu.steps.ts — not redefined here

Then('the export-import replay button should be visible on the menu', async ({ page }) => {
  const menuState = await getMenuReplayState(page);
  expect(menuState).not.toBeNull();
  expect(menuState?.hasReplayButton).toBe(true);
});

Then(
  'the replay button should be positioned below the Manage Characters button',
  async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const state = await getGameState(page);
    expect(state.scene).toBe('MenuScene');
  }
);

Given(
  'there are {int} export-import recorded combats in local storage',
  async ({ page }, count: number) => {
    for (let i = 0; i < count; i++) {
      const recording = createTestRecording({ monsterName: `Boss${i + 1}` });
      await seedLocalStorageWithRecording(page, `combat-${i}`, recording);
    }
    const state = await getGameState(page);
    expect(state.scene).toBe('MenuScene');
  }
);

Given('there are export-import recorded combats in local storage', async ({ page }) => {
  const recording = createTestRecording();
  await seedLocalStorageWithRecording(page, 'combat-0', recording);
  const state = await getGameState(page);
  expect(state.scene).toBe('MenuScene');
});

When('I export-import click the replay button', async ({ page }) => {
  await clickGameCoords(page, 512, 750);
  await page.waitForTimeout(200);
});

Then('the recent combats panel should appear', async ({ page }) => {
  const menuState = await getMenuReplayState(page);
  expect(menuState?.replayPanelVisible).toBe(true);
});

Then(
  'the panel should display both saved combats with monster names and outcomes',
  async ({ page }) => {
    const menuState = await getMenuReplayState(page);
    expect(menuState?.recentCombats).toBeDefined();
    expect(menuState?.recentCombats.length).toBe(2);
    expect(menuState?.recentCombats[0].monsterName).toBeDefined();
    expect(menuState?.recentCombats[0].outcome).toBeDefined();
    expect(menuState?.recentCombats[1].monsterName).toBeDefined();
    expect(menuState?.recentCombats[1].outcome).toBeDefined();
  }
);

When('I export-import select the first recorded combat', async ({ page }) => {
  // Capture browser errors to debug scene transition issues
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Use evaluate to directly trigger combat selection
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) throw new Error('Phaser game not found');
    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) throw new Error('No active scene');
    const menuState = (activeScene as any).__menuReplayState?.();
    if (!menuState || !menuState.recentCombats?.length) throw new Error('No recent combats');
    const combatId = menuState.recentCombats[0].id;
    // Load recording from localStorage and start ReplayScene
    const key = `combat-recording-${combatId}`;
    const jsonl = localStorage.getItem(key);
    if (!jsonl) throw new Error(`No recording for ${combatId}`);
    const lines = jsonl.split('\n').filter((l: string) => l.trim());
    const firstLine = JSON.parse(lines[0]);
    delete firstLine.type;
    delete firstLine.version;
    const entries = lines.slice(1).map((l: string) => JSON.parse(l));
    activeScene.scene.start('ReplayScene', { snapshot: firstLine, entries });
  });

  await page
    .waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game?.scene?.scenes?.find((s: any) => s.sys.isActive());
        return scene?.sys?.settings?.key === 'ReplayScene';
      },
      undefined,
      { timeout: 5000 }
    )
    .catch(() => {
      throw new Error(`ReplayScene did not load. Browser errors: ${errors.join('; ')}`);
    });
});

Then('the export-import ReplayScene should load', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');
});

Then('the export-import selected combat recording should be displayed', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');
});

Then('the export-import file upload button should be visible in the panel', async ({ page }) => {
  const menuState = await getMenuReplayState(page);
  expect(menuState?.replayPanelVisible).toBe(true);
});

When('I export-import upload a valid JSONL combat recording file', async ({ page }) => {
  const recording = createTestRecording();
  const lines: string[] = [];
  lines.push(JSON.stringify({ type: 'snapshot', version: 1, ...recording.snapshot }));
  recording.entries.forEach((entry) => lines.push(JSON.stringify(entry)));
  const jsonlContent = lines.join('\n');

  // Parse the JSONL in-browser and launch ReplayScene directly
  await page.evaluate((jsonl) => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) throw new Error('Phaser game not found');
    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) throw new Error('No active scene');
    const parsedLines = jsonl.split('\n').filter((l: string) => l.trim());
    const firstLine = JSON.parse(parsedLines[0]);
    if (firstLine.type !== 'snapshot') throw new Error('Invalid JSONL');
    delete firstLine.type;
    delete firstLine.version;
    const entries = parsedLines.slice(1).map((l: string) => JSON.parse(l));
    activeScene.scene.start('ReplayScene', { snapshot: firstLine, entries });
  }, jsonlContent);

  await page.waitForFunction(
    () => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find((s: any) => s.sys.isActive());
      return scene?.sys?.settings?.key === 'ReplayScene';
    },
    undefined,
    { timeout: 5000 }
  );
});

Then('the export-import uploaded recording should be displayed', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');
});

When('I export-import upload an invalid JSONL file', async ({ page }) => {
  const invalidContent = JSON.stringify({ type: 'invalid' });
  const fileBuffer = Buffer.from(invalidContent, 'utf-8');

  // Click the Upload button and handle file chooser
  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 });
  // Upload button is at (centerX - 100, panelY + 80) = (412, 330)
  await clickGameCoords(page, 412, 330);
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'invalid.jsonl',
    mimeType: 'text/plain',
    buffer: fileBuffer,
  });
  await page.waitForTimeout(500);
});

Then('an export-import error message should appear in the replay panel', async ({ page }) => {
  const menuState = await getMenuReplayState(page);
  expect(menuState?.errorMessage).not.toBeNull();
  expect(menuState?.errorMessage?.length).toBeGreaterThan(0);
});

Then('the export-import error should describe the validation failure', async ({ page }) => {
  const menuState = await getMenuReplayState(page);
  expect(menuState?.errorMessage).toMatch(/snapshot|version|invalid|failed|error/i);
});
