import { Page } from '@playwright/test';

/**
 * Click on game canvas at game coordinates (accounting for scaling)
 */
export async function clickGameCoords(page: Page, gameX: number, gameY: number) {
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
