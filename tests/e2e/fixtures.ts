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
  selectedTokenIndex?: number;
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
      logMessages?: string[];
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

    // Get selected token index
    if (battle.selectedToken && battle.characterTokens) {
      const selectedIndex = (battle.characterTokens as unknown[]).indexOf(battle.selectedToken);
      if (selectedIndex >= 0) {
        state.selectedTokenIndex = selectedIndex;
      }
    }

    // Get battle log entries
    if (battle.logMessages) {
      state.battleLog = battle.logMessages as string[];
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

// Grid constants matching BattleScene
const GRID_SIZE = 64;
const GRID_OFFSET_X = 80;
const GRID_OFFSET_Y = 80;

/**
 * Get valid movement tiles from game state
 */
export async function getValidMovementTiles(page: Page): Promise<{ x: number; y: number }[]> {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return [];

    const activeScene = game.scene.scenes.find((s) => s.sys.isActive());
    if (!activeScene) return [];

    const battle = activeScene as { currentValidMoves?: { x: number; y: number }[] };
    return battle.currentValidMoves || [];
  });
}

/**
 * Click on a valid movement tile (first available)
 * Returns true if a tile was clicked, false if no valid tiles
 */
export async function clickValidMovementTile(page: Page): Promise<boolean> {
  const validTiles = await getValidMovementTiles(page);
  if (validTiles.length === 0) return false;

  // Pick first valid tile and convert to screen coords (center of tile)
  const tile = validTiles[0];
  const gameX = GRID_OFFSET_X + tile.x * GRID_SIZE + GRID_SIZE / 2;
  const gameY = GRID_OFFSET_Y + tile.y * GRID_SIZE + GRID_SIZE / 2;

  await clickGameCoords(page, gameX, gameY);
  return true;
}

/**
 * Click on a specific grid tile by grid coordinates
 */
export async function clickGridTile(page: Page, gridX: number, gridY: number): Promise<void> {
  const gameX = GRID_OFFSET_X + gridX * GRID_SIZE + GRID_SIZE / 2;
  const gameY = GRID_OFFSET_Y + gridY * GRID_SIZE + GRID_SIZE / 2;
  await clickGameCoords(page, gameX, gameY);
}

/**
 * Get monster grid position from game state
 */
export async function getMonsterPosition(page: Page): Promise<{ x: number; y: number } | null> {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s) => s.sys.isActive());
    if (!activeScene) return null;

    const battle = activeScene as { monsterToken?: { gridX: number; gridY: number } };
    if (!battle.monsterToken) return null;

    return { x: battle.monsterToken.gridX, y: battle.monsterToken.gridY };
  });
}

/**
 * Get current selected character grid position
 */
export async function getSelectedCharacterPosition(
  page: Page
): Promise<{ x: number; y: number } | null> {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s) => s.sys.isActive());
    if (!activeScene) return null;

    const battle = activeScene as { selectedToken?: { gridX: number; gridY: number } };
    if (!battle.selectedToken) return null;

    return { x: battle.selectedToken.gridX, y: battle.selectedToken.gridY };
  });
}
