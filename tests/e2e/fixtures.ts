import { Page, expect } from '@playwright/test';

// =============================================================================
// UI Coordinate Constants
// =============================================================================
// These constants define the pixel positions of UI elements in the game.
// They match the layout defined in the production UI components.

/** Selected Hero Panel coordinates */
export const UI_PANEL_COORDS = {
  /** X position for action buttons (center of buttons) */
  BUTTON_X: 712,
  /** Y positions for each action button */
  MOVE_BUTTON_Y: 430,
  RUN_BUTTON_Y: 470,
  ATTACK_BUTTON_Y: 510,
  REST_BUTTON_Y: 550,
} as const;

/** Hero Selection Bar coordinates */
export const HERO_BAR_COORDS = {
  /** X position of the hero bar (left edge) */
  X: 80,
  /** Y position of the hero bar */
  Y: 480,
  /** Width of each hero card */
  CARD_WIDTH: 120,
  /** Gap between hero cards */
  CARD_GAP: 8,
  /** Offset from card top to click center */
  CARD_CLICK_Y_OFFSET: 50,
} as const;

// =============================================================================
// Type Definitions
// =============================================================================

/** Hero card state for hero selection bar */
export interface HeroCardState {
  heroId: string;
  className: string;
  currentHp: number;
  maxHp: number;
  beadCount: number;
  hasClassIcon: boolean;
  hasHpBar: boolean;
  hasBeadDisplay: boolean;
  highlighted: boolean;
  dimmed: boolean;
}

/** Hero selection bar state */
export interface HeroBarState {
  visible: boolean;
  cardCount: number;
  cards: HeroCardState[];
}

/** Selected hero panel state */
export interface SelectedHeroPanelState {
  visible: boolean;
  heroId: string | null;
  inventorySlots: number;
  actionButtons: { name: string; cost: number; affordable: boolean }[];
}

/** State captured before an action for verifying wheel position advancement */
export interface ActionState {
  /** The actor ID at the time the action was initiated */
  actorId: string;
  /** The wheel position of the actor before the action */
  wheelPosition: number;
}

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
  heroBar?: HeroBarState;
  selectedHeroPanel?: SelectedHeroPanelState;
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

    // Extract BattleScene specific state (supports both old Token and new Entity architecture)
    const battle = activeScene as {
      // Data layer
      monster?: { name: string; stats: { health: number } };

      // New architecture (Entity + Visual)
      monsterEntity?: {
        currentHealth: number;
        hasBeadBag: () => boolean;
        getDiscardedCounts: () =>
          | { red: number; blue: number; green: number; white: number }
          | undefined;
      };
      characters?: {
        id: string;
        hasBeadHand: () => boolean;
        getHandCounts: () =>
          | { red: number; blue: number; green: number; white: number }
          | undefined;
      }[];
      selectedCharacterId?: string | null;

      // Old architecture (Token-based) - for backwards compatibility
      monsterToken?: {
        currentHealth: number;
        hasBeadSystem: () => boolean;
        beadBag?: {
          getDiscardedCounts: () => { red: number; blue: number; green: number; white: number };
        };
      };
      characterTokens?: { beadHand?: { getHandTotal: () => number } }[];
      selectedToken?: { beadHand?: { getHandTotal: () => number } };

      // Common
      currentActorId?: string;
      actionWheel?: {
        getPosition: (id: string) => number | undefined;
        getAllEntities: () => { id: string; position: number }[];
      };
      logMessages?: string[];
      actionButtons?: { text?: string }[];

      // New UI components
      heroSelectionBar?: {
        getState: () => {
          visible: boolean;
          cardCount: number;
          cards: {
            heroId: string;
            className: string;
            currentHp: number;
            maxHp: number;
            beadCount: number;
            hasClassIcon: boolean;
            hasHpBar: boolean;
            hasBeadDisplay: boolean;
            highlighted: boolean;
            dimmed: boolean;
          }[];
        };
      };
      selectedHeroPanel?: {
        getState: () => {
          visible: boolean;
          heroId: string | null;
          inventorySlots: number;
          actionButtons: { name: string; cost: number; affordable: boolean }[];
        };
      };
    };

    // Monster state - prefer new architecture
    if (battle.monster && battle.monsterEntity) {
      state.monster = {
        name: battle.monster.name,
        currentHealth: battle.monsterEntity.currentHealth,
        maxHealth: battle.monster.stats.health,
        hasBeadSystem: battle.monsterEntity.hasBeadBag(),
        discards: battle.monsterEntity.getDiscardedCounts(),
      };
    } else if (battle.monster && battle.monsterToken) {
      // Fall back to old Token architecture
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

    // Get bead count and selected index - prefer new architecture
    if (battle.characters) {
      // Find selected character if any
      if (battle.selectedCharacterId) {
        const selectedIndex = battle.characters.findIndex(
          (c) => c.id === battle.selectedCharacterId
        );
        if (selectedIndex >= 0) {
          state.selectedTokenIndex = selectedIndex;
          const selected = battle.characters[selectedIndex];
          if (selected.hasBeadHand()) {
            const counts = selected.getHandCounts();
            if (counts) {
              state.playerBeadCount = counts.red + counts.blue + counts.green + counts.white;
            }
          }
        }
      }

      // Also get bead count from first character if no selected character
      if (state.playerBeadCount === undefined) {
        for (const char of battle.characters) {
          if (char.hasBeadHand()) {
            const counts = char.getHandCounts();
            if (counts) {
              state.playerBeadCount = counts.red + counts.blue + counts.green + counts.white;
              break;
            }
          }
        }
      }
    } else if (battle.characterTokens) {
      // Fall back to old Token architecture
      for (const token of battle.characterTokens) {
        if (token.beadHand) {
          state.playerBeadCount = token.beadHand.getHandTotal();
          break;
        }
      }
      if (battle.selectedToken && battle.characterTokens) {
        const selectedIndex = (battle.characterTokens as unknown[]).indexOf(battle.selectedToken);
        if (selectedIndex >= 0) {
          state.selectedTokenIndex = selectedIndex;
        }
      }
    }

    // Get battle log entries
    if (battle.logMessages) {
      state.battleLog = battle.logMessages as string[];
    }

    // Get hero selection bar state
    if (battle.heroSelectionBar) {
      state.heroBar = battle.heroSelectionBar.getState();
    }

    // Get selected hero panel state
    if (battle.selectedHeroPanel) {
      state.selectedHeroPanel = battle.selectedHeroPanel.getState();
    }

    return state;
  });
}

// =============================================================================
// Action State Capture (for wheel position verification)
// =============================================================================

/**
 * Capture the current actor's state before performing an action.
 *
 * Use this at the start of action step handlers (Move, Run, Attack, Rest)
 * to record the actor's wheel position before the action. Then use
 * `expectWheelAdvanced()` to verify the action advanced the wheel correctly.
 *
 * @example
 * ```typescript
 * let actionState: ActionState;
 *
 * When('I click the Rest button', async ({ page }) => {
 *   actionState = await captureActionState(page);
 *   await clickGameCoords(page, UI_PANEL_COORDS.BUTTON_X, UI_PANEL_COORDS.REST_BUTTON_Y);
 * });
 *
 * Then('my wheel position should advance by {int}', async ({ page }, expected) => {
 *   await expectWheelAdvanced(page, actionState, expected);
 * });
 * ```
 */
export async function captureActionState(page: Page): Promise<ActionState> {
  const state = await getGameState(page);
  const actorId = state.currentActor || '';
  const wheelPosition = state.wheelPositions?.[actorId] || 0;
  return { actorId, wheelPosition };
}

/**
 * Assert that the actor's wheel position advanced by the expected amount.
 *
 * @param page Playwright page
 * @param priorState State captured before the action via `captureActionState()`
 * @param expectedDelta Expected wheel position advancement
 */
export async function expectWheelAdvanced(
  page: Page,
  priorState: ActionState,
  expectedDelta: number
): Promise<void> {
  const state = await getGameState(page);
  const newPosition = state.wheelPositions?.[priorState.actorId] || 0;
  const actualDelta = newPosition - priorState.wheelPosition;
  expect(actualDelta, `Wheel should have advanced by ${expectedDelta}`).toBe(expectedDelta);
}

// =============================================================================
// Assertion Helpers
// =============================================================================

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
 * Get monster grid position from game state (supports both architectures)
 */
export async function getMonsterPosition(page: Page): Promise<{ x: number; y: number } | null> {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s) => s.sys.isActive());
    if (!activeScene) return null;

    const battle = activeScene as {
      // New architecture
      monsterEntity?: { getPosition: () => { x: number; y: number } | null };
      battleGrid?: { getPosition: (id: string) => { x: number; y: number } | null };
      // Old architecture
      monsterToken?: { gridX: number; gridY: number };
    };

    // Prefer new architecture
    if (battle.monsterEntity) {
      return battle.monsterEntity.getPosition();
    }
    if (battle.battleGrid) {
      return battle.battleGrid.getPosition('monster');
    }
    // Fall back to old architecture
    if (battle.monsterToken) {
      return { x: battle.monsterToken.gridX, y: battle.monsterToken.gridY };
    }

    return null;
  });
}

/**
 * Get character grid position by hero ID (e.g., 'hero-0', 'hero-1')
 */
export async function getCharacterPosition(
  page: Page,
  heroId: string
): Promise<{ x: number; y: number } | null> {
  return await page.evaluate((id) => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s) => s.sys.isActive());
    if (!activeScene) return null;

    const battle = activeScene as {
      characters?: { id: string; getPosition: () => { x: number; y: number } | null }[];
      battleGrid?: { getPosition: (id: string) => { x: number; y: number } | null };
    };

    // Try characters array first
    if (battle.characters) {
      const character = battle.characters.find((c) => c.id === id);
      if (character) {
        return character.getPosition();
      }
    }
    // Fall back to battleGrid
    if (battle.battleGrid) {
      return battle.battleGrid.getPosition(id);
    }

    return null;
  }, heroId);
}

// =============================================================================
// Teleport Helpers (Test Setup)
// =============================================================================
// These functions directly manipulate game state to set up test preconditions.
// They bypass normal game flow (no turn cost, no wheel advancement, no animations).
//
// PHILOSOPHY: Tests should focus on the behavior being tested, not on navigating
// through game mechanics to reach the test scenario. Use teleport helpers to
// instantly place characters in the required positions.
//
// WHEN TO USE:
// - "I am adjacent to the monster" → Use teleportCurrentActorAdjacentToMonster()
// - "Hero X is at position (a,b)" → Use teleportCharacterTo()
//
// WHEN NOT TO USE:
// - When testing the Move/Run actions themselves (use the actual game flow)
// - When the journey to the position IS the test

/**
 * Teleport a character directly to a grid position.
 *
 * This is a **test setup helper** that directly manipulates game state.
 * It does NOT trigger any game mechanics (no turn cost, no wheel advancement,
 * no animations, no pathfinding).
 *
 * Use this to quickly set up test preconditions without waiting for the
 * normal game flow. For example, to test the Attack action, teleport the
 * hero adjacent to the monster rather than clicking Move multiple times.
 *
 * @param page Playwright page
 * @param heroId Hero ID (e.g., 'hero-0', 'hero-1')
 * @param x Target grid X coordinate
 * @param y Target grid Y coordinate
 * @returns true if teleport succeeded, false if position was occupied or invalid
 *
 * @example
 * ```typescript
 * // Teleport hero-0 to grid position (3, 4)
 * await teleportCharacterTo(page, 'hero-0', 3, 4);
 * ```
 */
export async function teleportCharacterTo(
  page: Page,
  heroId: string,
  x: number,
  y: number
): Promise<boolean> {
  return await page.evaluate(
    ({ id, targetX, targetY }) => {
      const game = window.__PHASER_GAME__;
      if (!game) return false;

      const activeScene = game.scene.scenes.find((s) => s.sys.isActive());
      if (!activeScene) return false;

      const battle = activeScene as {
        battleGrid?: {
          moveEntity: (id: string, dest: { x: number; y: number }) => { success: boolean };
        };
        characters?: { id: string; setPosition: (x: number, y: number) => void }[];
      };

      // Move in battle grid
      if (battle.battleGrid) {
        const result = battle.battleGrid.moveEntity(id, { x: targetX, y: targetY });
        if (!result.success) return false;
      }

      // Also update character's internal position if available
      if (battle.characters) {
        const char = battle.characters.find((c) => c.id === id);
        if (char && char.setPosition) {
          char.setPosition(targetX, targetY);
        }
      }

      return true;
    },
    { id: heroId, targetX: x, targetY: y }
  );
}

/**
 * Teleport the current actor to a position adjacent to the monster.
 *
 * This is a **test setup helper** for scenarios that require melee range.
 * It finds an unoccupied tile next to the monster (checking left, right,
 * up, down) and teleports the current actor there.
 *
 * Use this to set up Attack action tests without wasting time on movement.
 * The teleport does NOT consume a turn or advance the wheel.
 *
 * @param page Playwright page
 * @returns true if teleport succeeded, false if no adjacent position available
 *          or current actor is not a hero
 *
 * @example
 * ```typescript
 * // In a Cucumber step definition:
 * Given('I am adjacent to the monster', async ({ page }) => {
 *   const success = await teleportCurrentActorAdjacentToMonster(page);
 *   expect(success).toBe(true);
 * });
 * ```
 */
export async function teleportCurrentActorAdjacentToMonster(page: Page): Promise<boolean> {
  const state = await getGameState(page);
  if (!state.currentActor?.startsWith('hero-')) return false;

  const monsterPos = await getMonsterPosition(page);
  if (!monsterPos) return false;

  // Try positions adjacent to monster (left, right, up, down)
  const adjacentPositions = [
    { x: monsterPos.x - 1, y: monsterPos.y },
    { x: monsterPos.x + 1, y: monsterPos.y },
    { x: monsterPos.x, y: monsterPos.y - 1 },
    { x: monsterPos.x, y: monsterPos.y + 1 },
  ];

  // Try each adjacent position until one works
  for (const pos of adjacentPositions) {
    const success = await teleportCharacterTo(page, state.currentActor, pos.x, pos.y);
    if (success) return true;
  }

  return false;
}

/**
 * Get current selected character grid position (supports both architectures)
 */
export async function getSelectedCharacterPosition(
  page: Page
): Promise<{ x: number; y: number } | null> {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s) => s.sys.isActive());
    if (!activeScene) return null;

    const battle = activeScene as {
      // New architecture
      selectedCharacterId?: string | null;
      characters?: { id: string; getPosition: () => { x: number; y: number } | null }[];
      battleGrid?: { getPosition: (id: string) => { x: number; y: number } | null };
      // Old architecture
      selectedToken?: { gridX: number; gridY: number };
    };

    // Prefer new architecture
    if (battle.selectedCharacterId && battle.characters) {
      const selected = battle.characters.find((c) => c.id === battle.selectedCharacterId);
      if (selected) {
        return selected.getPosition();
      }
    }
    if (battle.selectedCharacterId && battle.battleGrid) {
      return battle.battleGrid.getPosition(battle.selectedCharacterId);
    }
    // Fall back to old architecture
    if (battle.selectedToken) {
      return { x: battle.selectedToken.gridX, y: battle.selectedToken.gridY };
    }

    return null;
  });
}
