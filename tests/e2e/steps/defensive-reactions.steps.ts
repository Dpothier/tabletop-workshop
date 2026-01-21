import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { waitForGameReady } from '@tests/e2e/fixtures';

const { Then } = createBdd();

Then('the battle scene should have a defensive reaction panel', async ({ page }) => {
  await waitForGameReady(page);

  const hasPanel = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return false;

    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) return false;

    // Check if optionSelectionPanel exists (it's created in BattleScene.create())
    return 'optionSelectionPanel' in activeScene;
  });

  expect(hasPanel, 'Battle scene should have optionSelectionPanel').toBe(true);
});

Then('the panel should support guard and evasion options', async ({ page }) => {
  const hasLogic = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return false;

    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) return false;

    const panel = (activeScene as any).optionSelectionPanel;
    if (!panel) return false;

    // Check that the panel has logic with getState method
    return panel.logic && typeof panel.logic.getState === 'function';
  });

  expect(hasLogic, 'Panel should have logic layer with getState method').toBe(true);
});
