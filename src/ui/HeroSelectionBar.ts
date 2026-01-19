import Phaser from 'phaser';
import type { Character } from '@src/entities/Character';
import type { CharacterClass } from '@src/systems/DataLoader';
import type { BeadCounts } from '@src/types/Beads';
import type { BattleStateObserver } from '@src/systems/BattleStateObserver';
import { HERO_COLORS } from '@src/ui/colors';

/**
 * Hero card data for display in the selection bar
 */
export interface HeroCardData {
  heroId: string;
  className: string;
  classIcon: string;
  color: number;
  currentHp: number;
  maxHp: number;
  beadCounts: BeadCounts;
}

/**
 * Hero card state for E2E testing
 */
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

// Layout constants
const HERO_BAR_X = 80;
const HERO_BAR_Y = 600;
const HERO_BAR_WIDTH = 512;
const HERO_BAR_HEIGHT = 100;
const HERO_CARD_WIDTH = 120;
const HERO_CARD_HEIGHT = 90;
const HERO_CARD_GAP = 8;

// Colors
const CARD_BG_COLOR = 0x2a2a4a;
const CARD_HIGHLIGHT_COLOR = 0xffff00;
const CARD_DIMMED_ALPHA = 0.5;
const BEAD_COLORS: Record<string, number> = {
  red: 0xff4444,
  blue: 0x4444ff,
  green: 0x44ff44,
  white: 0xffffff,
};

/**
 * HeroSelectionBar displays hero cards below the arena grid.
 * Each card shows: class icon, HP bar, beads in hand, weapon placeholder.
 * Current actor is highlighted, others are dimmed.
 */
export class HeroSelectionBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private heroCards: Map<string, HeroCardContainer> = new Map();
  private clickCallback: ((heroId: string) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(HERO_BAR_X, HERO_BAR_Y);
  }

  /**
   * Create hero cards from Character entities and CharacterClass definitions
   */
  createFromEntities(characters: Character[], classes: CharacterClass[]): void {
    const heroCardData: HeroCardData[] = characters.map((character, index) => {
      const charClass = classes[index % classes.length];
      const beadCounts = character.getHandCounts() ?? { red: 0, blue: 0, green: 0, white: 0 };

      return {
        heroId: character.id,
        className: charClass.name,
        classIcon: charClass.icon || charClass.name[0],
        color: HERO_COLORS[index % HERO_COLORS.length],
        currentHp: character.currentHealth,
        maxHp: character.maxHealth,
        beadCounts,
      };
    });

    this.create(heroCardData);
  }

  /**
   * Create hero cards for all heroes
   */
  create(heroes: HeroCardData[]): void {
    // Background panel
    const bg = this.scene.add.rectangle(
      HERO_BAR_WIDTH / 2,
      HERO_BAR_HEIGHT / 2,
      HERO_BAR_WIDTH,
      HERO_BAR_HEIGHT,
      0x1a1a2e
    );
    bg.setStrokeStyle(2, 0x4a4a6a);
    this.container.add(bg);

    // Create cards for each hero
    heroes.forEach((hero, index) => {
      const cardX = index * (HERO_CARD_WIDTH + HERO_CARD_GAP) + HERO_CARD_WIDTH / 2;
      const cardY = HERO_BAR_HEIGHT / 2;
      const card = new HeroCardContainer(this.scene, cardX, cardY, hero);
      card.onClick(() => this.handleCardClick(hero.heroId));
      this.heroCards.set(hero.heroId, card);
      this.container.add(card.container);
    });
  }

  /**
   * Update which hero is the current actor (highlighted)
   */
  updateCurrentActor(actorId: string | null): void {
    for (const [heroId, card] of this.heroCards) {
      if (heroId === actorId) {
        card.setHighlighted(true);
        card.setDimmed(false);
      } else {
        card.setHighlighted(false);
        card.setDimmed(true);
      }
    }
  }

  /**
   * Update bead display for a specific hero
   */
  updateHeroBeads(heroId: string, beadCounts: BeadCounts): void {
    const card = this.heroCards.get(heroId);
    if (card) {
      card.updateBeads(beadCounts);
    }
  }

  /**
   * Update HP display for a specific hero
   */
  updateHeroHP(heroId: string, currentHp: number, maxHp: number): void {
    const card = this.heroCards.get(heroId);
    if (card) {
      card.updateHP(currentHp, maxHp);
    }
  }

  /**
   * Register click callback
   */
  onHeroClick(callback: (heroId: string) => void): void {
    this.clickCallback = callback;
  }

  /**
   * Handle card click
   */
  private handleCardClick(heroId: string): void {
    if (this.clickCallback) {
      this.clickCallback(heroId);
    }
  }

  /**
   * Get state for E2E testing
   */
  getState(): { visible: boolean; cardCount: number; cards: HeroCardState[] } {
    const cards: HeroCardState[] = [];
    for (const [heroId, card] of this.heroCards) {
      cards.push({
        heroId,
        className: card.getClassName(),
        currentHp: card.getCurrentHp(),
        maxHp: card.getMaxHp(),
        beadCount: card.getBeadCount(),
        hasClassIcon: true,
        hasHpBar: true,
        hasBeadDisplay: true,
        highlighted: card.isHighlighted(),
        dimmed: card.isDimmed(),
      });
    }

    return {
      visible: this.container.visible,
      cardCount: this.heroCards.size,
      cards,
    };
  }

  /**
   * Show/hide the bar
   */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    this.container.destroy(true);
    this.heroCards.clear();
  }

  /**
   * Subscribe to state observer for reactive updates.
   */
  subscribeToState(observer: BattleStateObserver): void {
    observer.subscribe({
      actorChanged: (actorId) => this.updateCurrentActor(actorId),
      heroBeadsChanged: (heroId, counts) => this.updateHeroBeads(heroId, counts),
      heroHealthChanged: (heroId, current, max) => this.updateHeroHP(heroId, current, max),
    });
  }
}

/**
 * Individual hero card within the selection bar
 */
class HeroCardContainer {
  public readonly container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private heroData: HeroCardData;
  private background: Phaser.GameObjects.Rectangle;
  private highlightBorder: Phaser.GameObjects.Rectangle;
  private hpBar: Phaser.GameObjects.Graphics;
  private beadContainer: Phaser.GameObjects.Container;
  private highlighted = false;
  private dimmed = false;
  private currentHp: number;
  private maxHp: number;
  private beadCounts: BeadCounts;

  constructor(scene: Phaser.Scene, x: number, y: number, heroData: HeroCardData) {
    this.scene = scene;
    this.heroData = heroData;
    this.currentHp = heroData.currentHp;
    this.maxHp = heroData.maxHp;
    this.beadCounts = { ...heroData.beadCounts };
    this.container = scene.add.container(x, y);

    // Background
    this.background = scene.add.rectangle(
      0,
      0,
      HERO_CARD_WIDTH - 4,
      HERO_CARD_HEIGHT - 4,
      CARD_BG_COLOR
    );
    this.background.setInteractive({ useHandCursor: true });

    // Highlight border (hidden by default)
    this.highlightBorder = scene.add.rectangle(0, 0, HERO_CARD_WIDTH, HERO_CARD_HEIGHT);
    this.highlightBorder.setStrokeStyle(3, CARD_HIGHLIGHT_COLOR);
    this.highlightBorder.setFillStyle(0, 0);
    this.highlightBorder.setVisible(false);

    // Player number and class icon
    const playerLabel = scene.add.text(-50, -35, `P${this.getPlayerIndex() + 1}`, {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000',
    });

    // Hero background circle (colored by hero color)
    const heroBackground = scene.add.circle(0, -30, 20, heroData.color);
    heroBackground.setStrokeStyle(2, 0x6a6a8a);

    const heroIcon = scene.add
      .text(0, -30, heroData.classIcon || heroData.className[0], {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // HP bar background
    const hpBg = scene.add.rectangle(0, 0, 80, 8, 0x333333);

    // HP bar
    this.hpBar = scene.add.graphics();
    this.renderHpBar();

    // Bead display
    this.beadContainer = scene.add.container(0, 20);
    this.renderBeads();

    // Weapon placeholder
    const weaponIcon = scene.add
      .text(0, 35, '\u2694', {
        fontSize: '16px',
        color: '#888888',
      })
      .setOrigin(0.5);

    this.container.add([
      this.background,
      this.highlightBorder,
      playerLabel,
      heroBackground,
      heroIcon,
      hpBg,
      this.hpBar,
      this.beadContainer,
      weaponIcon,
    ]);
  }

  /**
   * Get player index from hero ID
   */
  private getPlayerIndex(): number {
    const match = this.heroData.heroId.match(/hero-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Register click handler
   */
  onClick(callback: () => void): void {
    this.background.off('pointerdown');
    this.background.on('pointerdown', callback);
  }

  /**
   * Set highlighted state
   */
  setHighlighted(highlighted: boolean): void {
    this.highlighted = highlighted;
    this.highlightBorder.setVisible(highlighted);
  }

  /**
   * Set dimmed state
   */
  setDimmed(dimmed: boolean): void {
    this.dimmed = dimmed;
    this.container.setAlpha(dimmed ? CARD_DIMMED_ALPHA : 1);
  }

  /**
   * Update bead display
   */
  updateBeads(beadCounts: BeadCounts): void {
    this.beadCounts = { ...beadCounts };
    this.renderBeads();
  }

  /**
   * Update HP display
   */
  updateHP(currentHp: number, maxHp: number): void {
    this.currentHp = currentHp;
    this.maxHp = maxHp;
    this.renderHpBar();
  }

  /**
   * Render HP bar
   */
  private renderHpBar(): void {
    this.hpBar.clear();
    const healthPercent = this.currentHp / this.maxHp;
    const barWidth = 80 * healthPercent;
    const color = healthPercent > 0.5 ? 0x44ff44 : healthPercent > 0.25 ? 0xffff44 : 0xff4444;

    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(-40, -4, barWidth, 8);
  }

  /**
   * Render bead circles
   */
  private renderBeads(): void {
    this.beadContainer.removeAll(true);

    const beadSize = 10;
    const beadGap = 4;
    let x = -40;

    for (const [color, count] of Object.entries(this.beadCounts)) {
      for (let i = 0; i < count; i++) {
        const bead = this.scene.add.circle(x, 0, beadSize, BEAD_COLORS[color]);
        bead.setStrokeStyle(1, 0x000000);
        this.beadContainer.add(bead);
        x += beadSize * 2 + beadGap;
      }
    }
  }

  // Getters for state extraction
  getClassName(): string {
    return this.heroData.className;
  }

  getCurrentHp(): number {
    return this.currentHp;
  }

  getMaxHp(): number {
    return this.maxHp;
  }

  getBeadCount(): number {
    return Object.values(this.beadCounts).reduce((sum, count) => sum + count, 0);
  }

  isHighlighted(): boolean {
    return this.highlighted;
  }

  isDimmed(): boolean {
    return this.dimmed;
  }
}
