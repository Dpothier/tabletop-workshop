import { Page, expect } from '@playwright/test';

/** Game state extracted from Phaser for E2E testing */
export interface GameState {
  scene: string;
  monster?: {
    name: string;
    currentHealth: number;
    maxHealth: number;
    hasBeadSystem: boolean;
    discards?: { red: number; blue: number; green: number; white: number };
  };
  currentActor?: string;
  wheelPositions?: Record<string, number>;
  playerBeadCount?: number;
  actionButtons?: string[];
  battleLog?: string[];
}

/**
 * Get current game state from Phaser instance
 */
export async function getGameState(page: Page): Promise<GameState> {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return { scene: 'unknown' };

    const activeScene = game.scene.scenes.find((s) => s.sys.isActive());
    if (!activeScene) return { scene: 'none' };

    const sceneName = activeScene.sys.settings.key;
    const state: GameState = { scene: sceneName };

    // Extract BattleScene specific state
    const battle = activeScene as {
      monster?: { name: string; stats: { health: number } };
      monsterToken?: {
        currentHealth: number;
        hasBeadSystem: () => boolean;
        beadBag?: {
          getDiscardedCounts: () => { red: number; blue: number; green: number; white: number };
        };
      };
      currentActorId?: string;
      actionWheel?: {
        getPosition: (id: string) => number | undefined;
        getAllEntities: () => { id: string; position: number }[];
      };
      selectedToken?: { beadHand?: { getHandTotal: () => number } };
      characterTokens?: { beadHand?: { getHandTotal: () => number } }[];
      battleLog?: { text: string }[];
      actionButtons?: { text?: string }[];
    };

    if (battle.monster && battle.monsterToken) {
      state.monster = {
        name: battle.monster.name,
        currentHealth: battle.monsterToken.currentHealth,
        maxHealth: battle.monster.stats.health,
        hasBeadSystem: battle.monsterToken.hasBeadSystem(),
        discards: battle.monsterToken.beadBag?.getDiscardedCounts(),
      };
    }

    if (battle.currentActorId) {
      state.currentActor = battle.currentActorId;
    }

    if (battle.actionWheel) {
      const entities = battle.actionWheel.getAllEntities();
      state.wheelPositions = {};
      for (const entry of entities) {
        state.wheelPositions[entry.id] = entry.position;
      }
    }

    // Get bead count from first character with a bead hand
    if (battle.characterTokens) {
      for (const token of battle.characterTokens) {
        if (token.beadHand) {
          state.playerBeadCount = token.beadHand.getHandTotal();
          break;
        }
      }
    } else if (battle.selectedToken?.beadHand) {
      state.playerBeadCount = battle.selectedToken.beadHand.getHandTotal();
    }

    return state;
  });
}

/**
 * Assert monster health matches expected value
 */
export async function expectMonsterHealth(page: Page, expected: number): Promise<void> {
  const state = await getGameState(page);
  expect(state.monster?.currentHealth, `Monster health should be ${expected}`).toBe(expected);
}

/**
 * Assert monster has bead system initialized
 */
export async function expectMonsterHasBeadSystem(page: Page): Promise<void> {
  const state = await getGameState(page);
  expect(state.monster?.hasBeadSystem, 'Monster should have bead system').toBe(true);
}

/**
 * Assert current actor matches expected
 */
export async function expectCurrentActor(page: Page, expected: string): Promise<void> {
  const state = await getGameState(page);
  expect(state.currentActor, `Current actor should be ${expected}`).toBe(expected);
}

/**
 * Assert wheel position for an entity
 */
export async function expectWheelPosition(
  page: Page,
  entityId: string,
  expected: number
): Promise<void> {
  const state = await getGameState(page);
  expect(
    state.wheelPositions?.[entityId],
    `Wheel position for ${entityId} should be ${expected}`
  ).toBe(expected);
}

/**
 * Assert player bead count
 */
export async function expectPlayerBeadCount(page: Page, expected: number): Promise<void> {
  const state = await getGameState(page);
  expect(state.playerBeadCount, `Player bead count should be ${expected}`).toBe(expected);
}

/**
 * Assert player bead count increased by amount
 */
export async function expectPlayerBeadCountIncreased(
  page: Page,
  previousCount: number,
  increase: number
): Promise<void> {
  const state = await getGameState(page);
  expect(state.playerBeadCount, `Player bead count should have increased by ${increase}`).toBe(
    previousCount + increase
  );
}

/**
 * Click on game canvas at game coordinates (accounting for scaling)
 */
export async function clickGameCoords(page: Page, gameX: number, gameY: number): Promise<void> {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();

  if (!box) {
    throw new Error('Canvas not found');
  }

  // Game dimensions from main.ts
  const gameWidth = 1024;
  const gameHeight = 768;

  const scaleX = box.width / gameWidth;
  const scaleY = box.height / gameHeight;

  await page.mouse.click(box.x + gameX * scaleX, box.y + gameY * scaleY);
}

/**
 * Wait for game to be ready by checking for Phaser canvas
 */
export async function waitForGameReady(page: Page) {
  await page.waitForSelector('canvas', { timeout: 10000 });
  // Give Phaser time to initialize
  await page.waitForTimeout(500);
}

/**
 * Get text content of an element by searching within canvas overlay
 * Since Phaser uses canvas, we can take screenshots for visual verification
 */
export async function getGameText(_page: Page): Promise<string> {
  // For Phaser games, text is drawn on canvas
  // Canvas-based games don't expose text through DOM or accessibility APIs
  // For actual text verification, use screenshot comparison or OCR
  return '';
}
