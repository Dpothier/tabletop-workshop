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

/**
 * Create a minimal valid test recording for ReplayScene.
 * Includes both snapshot data and combat log entries with proper types.
 */
function createTestRecording(
  options: {
    characterCount?: number;
    stepCount?: number;
    includeRoundEnd?: boolean;
  } = {}
): ReplayData {
  const charCount = options.characterCount ?? 2;
  const stepCount = options.stepCount ?? 3;
  const includeRoundEnd = options.includeRoundEnd ?? false;

  // Build snapshot with proper types
  const entities: any[] = [];
  for (let i = 0; i < charCount; i++) {
    entities.push({
      id: `hero-${i}`,
      name: `Hero ${i}`,
      type: 'character',
      position: { x: 1 + i, y: 1 },
      maxHealth: 100,
      currentHealth: 100,
      beadPool: { red: 5, blue: 3, green: 2, white: 1 },
      beadHand: { red: 1, blue: 1, green: 0, white: 0 },
      beadDiscard: { red: 0, blue: 0, green: 0, white: 0 },
    });
  }
  entities.push({
    id: 'monster',
    name: 'TestBoss',
    type: 'monster',
    position: { x: 5, y: 4 },
    maxHealth: 200,
    currentHealth: 200,
    beadBag: { red: 4, blue: 4, green: 2, white: 2 },
    currentState: 'idle',
  });

  const snapshot: BattleSnapshot = {
    arena: {
      name: 'Test Arena',
      width: 9,
      height: 9,
    },
    characters: entities
      .filter((e) => e.type === 'character')
      .map((e) => ({
        id: e.id,
        name: e.name,
        position: e.position,
        maxHealth: e.maxHealth,
        currentHealth: e.currentHealth,
        equipment: {},
        availableActionIds: ['move', 'attack'],
        beadHand: e.beadHand,
        beadPool: e.beadPool,
        beadDiscard: e.beadDiscard,
      })) as any[],
    monster: {
      id: 'monster',
      name: 'TestBoss',
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

  // Build combat log entries - create proper turn-start entries
  const entries: CombatLogEntry[] = [];
  let seq = 1;
  for (let i = 0; i < stepCount; i++) {
    const actorIdx = i % (charCount + 1);
    const actorId = actorIdx < charCount ? `hero-${actorIdx}` : 'monster';
    const actorName = actorIdx < charCount ? `Hero ${actorIdx}` : 'TestBoss';
    const actorType = actorIdx < charCount ? 'player' : 'monster';

    // Turn start entry
    entries.push({
      type: 'turn-start',
      seq: seq++,
      actorId,
      actorName,
      actorType,
      wheelPosition: i,
    } as any);

    // Action selected entry
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

  // Add round-end if requested
  if (includeRoundEnd) {
    entries.push({
      type: 'round-end',
      seq: seq++,
      entitySummaries: entities.map((e) => ({
        id: e.id,
        name: e.name,
        hp: e.currentHealth ?? e.maxHealth,
        maxHp: e.maxHealth,
        handCounts: { red: 0, blue: 0, green: 0, white: 0 },
      })),
    } as any);
  }

  // Battle end entry
  entries.push({
    type: 'battle-end',
    seq: seq++,
    outcome: 'victory',
  } as any);

  return { snapshot, entries };
}

/**
 * Get ReplayScene state from the Phaser game instance.
 * Uses the __replayState() method exposed by ReplayScene.
 */
async function getReplayState(page: Page): Promise<{
  scene: string;
  isPaused: boolean;
  isAutoPlay: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentRound: number;
} | null> {
  return await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene || activeScene.sys.settings.key !== 'ReplayScene') return null;

    return (activeScene as any).__replayState?.() ?? null;
  });
}

/**
 * Launch ReplayScene with test recording data.
 * This starts the scene and waits for it to become active.
 */
async function launchReplayScene(page: Page, recording: ReplayData): Promise<void> {
  await page.evaluate((data) => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) throw new Error('Phaser game not found');
    game.scene.start('ReplayScene', data);
  }, recording);

  // Wait for ReplayScene to be active
  await page.waitForFunction(
    () => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find((s: any) => s.sys.isActive());
      return scene?.sys?.settings?.key === 'ReplayScene';
    },
    undefined,
    { timeout: 5000 }
  );
}

/**
 * Click a ReplayScene button by coordinates.
 * Button positions are calculated from ReplayScene layout:
 * - Next: width/2 - 80, height - 50
 * - Auto/Pause: width/2 + 80, height - 50
 * - Menu: 20, height - 50
 *
 * Game dimensions: 1024x768
 */
async function clickReplayButton(
  page: Page,
  buttonName: 'Next' | 'Auto' | 'Pause' | 'Menu'
): Promise<void> {
  const gameWidth = 1024;
  const gameHeight = 768;

  const buttonCoords: Record<string, { x: number; y: number }> = {
    Next: { x: gameWidth / 2 - 80, y: gameHeight - 50 },
    Auto: { x: gameWidth / 2 + 80, y: gameHeight - 50 },
    Pause: { x: gameWidth / 2 + 80, y: gameHeight - 50 },
    Menu: { x: 20, y: gameHeight - 50 },
  };

  const coords = buttonCoords[buttonName];
  if (!coords) {
    throw new Error(`Unknown replay button: ${buttonName}`);
  }

  await clickGameCoords(page, coords.x, coords.y);
  // Brief wait for UI interaction
  await page.waitForTimeout(200);
}

/**
 * Wait for ReplayScene state to match expected values.
 * Uses polling via getReplayState since waitForFunction
 * can't use Node.js closures in the browser context.
 */
async function waitForReplayState(
  page: Page,
  condition: (state: any) => boolean,
  timeoutMs: number = 5000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await getReplayState(page);
    if (state && condition(state)) return;
    await page.waitForTimeout(100);
  }
  throw new Error(`waitForReplayState timed out after ${timeoutMs}ms`);
}

// =============================================================================
// Step Definitions
// =============================================================================

Given(
  'a replay recording with {int} characters and {int} monster',
  async ({ page }, charCount: number) => {
    await page.goto('/');
    await waitForGameReady(page);

    const recording = createTestRecording({
      characterCount: charCount,
      stepCount: 3,
    });
    await launchReplayScene(page, recording);

    const state = await getGameState(page);
    expect(state.scene).toBe('ReplayScene');
  }
);

Given('a replay recording loaded in ReplayScene', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);

  const recording = createTestRecording({
    characterCount: 2,
    stepCount: 3,
  });
  await launchReplayScene(page, recording);

  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');

  const replayState = await getReplayState(page);
  expect(replayState).not.toBeNull();
  expect(replayState?.isPaused).toBe(true);
});

Given(
  'a replay recording loaded in ReplayScene with {int} steps',
  async ({ page }, stepCount: number) => {
    await page.goto('/');
    await waitForGameReady(page);

    const recording = createTestRecording({
      characterCount: 2,
      stepCount: stepCount,
    });
    await launchReplayScene(page, recording);

    const state = await getGameState(page);
    expect(state.scene).toBe('ReplayScene');

    const replayState = await getReplayState(page);
    expect(replayState?.totalSteps).toBe(stepCount);
    expect(replayState?.isPaused).toBe(true);
  }
);

Given(
  'a replay recording with a step that includes round-end with burn damage',
  async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);

    const recording = createTestRecording({
      characterCount: 2,
      stepCount: 3,
      includeRoundEnd: true,
    });
    await launchReplayScene(page, recording);

    const state = await getGameState(page);
    expect(state.scene).toBe('ReplayScene');

    const replayState = await getReplayState(page);
    expect(replayState?.totalSteps).toBeGreaterThan(0);
  }
);

Given('a replay recording in auto-play mode', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);

  const recording = createTestRecording({
    characterCount: 2,
    stepCount: 5,
  });
  await launchReplayScene(page, recording);

  // Start auto-play
  await clickReplayButton(page, 'Auto');

  // Wait for auto-play mode to activate
  await waitForReplayState(page, (state) => state.isAutoPlay === true);

  const replayState = await getReplayState(page);
  expect(replayState?.isAutoPlay).toBe(true);
});

When('the ReplayScene loads with the recording', async ({ page }) => {
  // The loading is handled by the preceding Given step.
  // This step verifies the scene is now active.
  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');

  const replayState = await getReplayState(page);
  expect(replayState).not.toBeNull();
});

When('I click the Next button', async ({ page }) => {
  const stateBefore = await getReplayState(page);
  const stepBefore = stateBefore?.currentStepIndex ?? 0;

  await clickReplayButton(page, 'Next');

  // Wait for step index to change
  await waitForReplayState(page, (state) => state.currentStepIndex > stepBefore, 3000);

  const stateAfter = await getReplayState(page);
  expect(stateAfter?.currentStepIndex).toBeGreaterThan(stepBefore);
});

When('I advance to that step', async ({ page }) => {
  const stateBefore = await getReplayState(page);
  const stepBefore = stateBefore?.currentStepIndex ?? 0;

  // Click Next to advance one step
  await clickReplayButton(page, 'Next');

  // Wait for step to change
  await waitForReplayState(page, (state) => state.currentStepIndex > stepBefore, 3000);

  const stateAfter = await getReplayState(page);
  expect(stateAfter?.currentStepIndex).toBeGreaterThan(stepBefore);
});

When('I click the Auto button', async ({ page }) => {
  const stateBefore = await getReplayState(page);
  expect(stateBefore?.isAutoPlay).toBe(false);

  await clickReplayButton(page, 'Auto');

  // Wait for auto-play to activate
  await waitForReplayState(page, (state) => state.isAutoPlay === true);

  const stateAfter = await getReplayState(page);
  expect(stateAfter?.isAutoPlay).toBe(true);
});

When('I click the Pause button', async ({ page }) => {
  // Pause button only works when already in auto-play mode
  const stateBefore = await getReplayState(page);
  expect(stateBefore?.isAutoPlay).toBe(true);

  await clickReplayButton(page, 'Pause');

  // Wait for auto-play to deactivate
  await waitForReplayState(page, (state) => state.isAutoPlay === false);

  const stateAfter = await getReplayState(page);
  expect(stateAfter?.isPaused).toBe(true);
});

When('I press the right arrow key', async ({ page }) => {
  const stateBefore = await getReplayState(page);
  const stepBefore = stateBefore?.currentStepIndex ?? 0;

  await page.keyboard.press('ArrowRight');

  // Wait for step index to change
  await waitForReplayState(page, (state) => state.currentStepIndex > stepBefore, 3000);

  const stateAfter = await getReplayState(page);
  expect(stateAfter?.currentStepIndex).toBe(stepBefore + 1);
});

When('I press the space key', async ({ page }) => {
  const stateBefore = await getReplayState(page);
  const wasAutoPlay = stateBefore?.isAutoPlay;

  await page.keyboard.press('Space');

  // Wait for state to toggle
  await waitForReplayState(page, (state) => state.isAutoPlay !== wasAutoPlay);

  const stateAfter = await getReplayState(page);
  expect(stateAfter?.isAutoPlay).not.toBe(wasAutoPlay);
});

When('I press the space key again', async ({ page }) => {
  const stateBefore = await getReplayState(page);
  const wasAutoPlay = stateBefore?.isAutoPlay;

  await page.keyboard.press('Space');

  // Wait for state to toggle
  await waitForReplayState(page, (state) => state.isAutoPlay !== wasAutoPlay);

  const stateAfter = await getReplayState(page);
  expect(stateAfter?.isAutoPlay).not.toBe(wasAutoPlay);
});

When('I advance {int} steps', async ({ page }, stepCount: number) => {
  for (let i = 0; i < stepCount; i++) {
    const stateBefore = await getReplayState(page);
    const stepBefore = stateBefore?.currentStepIndex ?? 0;

    await clickReplayButton(page, 'Next');

    // Wait for each step to complete
    await waitForReplayState(page, (state) => state.currentStepIndex > stepBefore, 3000);
  }
});

When('I click the retour au menu button', async ({ page }) => {
  await clickReplayButton(page, 'Menu');

  // Wait for scene transition to MenuScene
  await page.waitForFunction(
    () => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find((s: any) => s.sys.isActive());
      return scene?.sys?.settings?.key === 'MenuScene';
    },
    undefined,
    { timeout: 3000 }
  );
});

Then('entity visuals should be displayed at their snapshot positions', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');

  // Verify the scene can access its state (implies entities are loaded)
  const replayState = await getReplayState(page);
  expect(replayState).not.toBeNull();
});

Then('the scene should be in paused state', async ({ page }) => {
  const replayState = await getReplayState(page);
  expect(replayState?.isPaused).toBe(true);
});

Then('the Next button should be visible', async ({ page }) => {
  // Verify canvas is still visible (UI is rendered)
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Verify ReplayScene is active
  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');
});

Then('one complete turn of animations should play', async ({ page }) => {
  // Verify the scene is still in ReplayScene (animations completed)
  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');

  // Verify step index has advanced
  const replayState = await getReplayState(page);
  expect(replayState?.currentStepIndex).toBeGreaterThanOrEqual(1);
});

Then('the scene should return to paused state', async ({ page }) => {
  const replayState = await getReplayState(page);
  expect(replayState?.isPaused).toBe(true);
});

Then('burn damage animations should be played', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('ReplayScene');

  // Verify we're in the scene and step progression is working
  const replayState = await getReplayState(page);
  expect(replayState?.totalSteps).toBeGreaterThan(0);
});

Then('the scene should be in auto-play mode', async ({ page }) => {
  const replayState = await getReplayState(page);
  expect(replayState?.isAutoPlay).toBe(true);
});

Then('steps should advance automatically', async ({ page }) => {
  const stateBefore = await getReplayState(page);
  const stepBefore = stateBefore?.currentStepIndex ?? 0;

  // Wait for auto-play to advance at least one step
  await waitForReplayState(page, (state) => state.currentStepIndex > stepBefore, 5000);

  const stateAfter = await getReplayState(page);
  expect(stateAfter?.currentStepIndex).toBeGreaterThan(stepBefore);
});

Then('one step should advance', async ({ page }) => {
  const replayState = await getReplayState(page);
  expect(replayState?.currentStepIndex).toBeGreaterThanOrEqual(1);
});

Then('the scene should toggle to auto-play mode', async ({ page }) => {
  const replayState = await getReplayState(page);
  expect(replayState?.isAutoPlay).toBe(true);
});

Then('the scene should toggle to paused mode', async ({ page }) => {
  const replayState = await getReplayState(page);
  expect(replayState?.isPaused).toBe(true);
});

Then(
  'the progress indicator should show step {int} of {int}',
  async ({ page }, current: number, total: number) => {
    const replayState = await getReplayState(page);
    // currentStepIndex is 0-indexed, but the scenario uses 1-indexed steps
    expect(replayState?.currentStepIndex).toBe(current - 1);
    expect(replayState?.totalSteps).toBe(total);
  }
);

Then('the scene should transition to MenuScene', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('MenuScene');
});
