import Phaser from 'phaser';
import type { BeadCounts } from '@src/types/Beads';
import type { ActionDefinition } from '@src/types/Action';

/**
 * Action button configuration
 */
export interface ActionButtonConfig {
  name: string;
  cost: number;
  callback: () => void;
}

/**
 * Action button state for E2E testing
 */
export interface ActionButtonState {
  name: string;
  cost: number;
  affordable: boolean;
}

/**
 * Panel state for E2E testing
 */
export interface SelectedHeroPanelState {
  visible: boolean;
  heroId: string | null;
  inventorySlots: number;
  actionButtons: ActionButtonState[];
}

// Layout constants from plan
const PANEL_X = 600;
const PANEL_Y = 280;
const PANEL_WIDTH = 224;
const PANEL_HEIGHT = 280;

// Inventory layout
const INVENTORY_SLOTS = 4;
const SLOT_SIZE = 40;
const SLOT_GAP = 8;
const INVENTORY_Y_OFFSET = 40;

// Action button layout
const ACTION_BUTTON_Y_OFFSET = 150;
const ACTION_BUTTON_WIDTH = 180;
const ACTION_BUTTON_HEIGHT = 36;
const ACTION_BUTTON_GAP = 4;

// Colors
const PANEL_BG_COLOR = 0x1a1a2e;
const PANEL_BORDER_COLOR = 0x4a4a6a;
const SLOT_BG_COLOR = 0x2a2a4a;
const SLOT_BORDER_COLOR = 0x5a5a7a;
const BUTTON_BG_COLOR = 0x3a3a5a;
const BUTTON_HOVER_COLOR = 0x4a4a6a;
const BUTTON_DISABLED_COLOR = 0x2a2a3a;
const TEXT_COLOR = '#ffffff';
const DISABLED_TEXT_COLOR = '#666666';
const COST_COLOR = '#ffcc00';

/**
 * Default action configurations (fallback when no actions provided)
 */
const DEFAULT_ACTIONS: Omit<ActionButtonConfig, 'callback'>[] = [
  { name: 'Move', cost: 1 },
  { name: 'Run', cost: 2 },
  { name: 'Attack', cost: 2 },
  { name: 'Rest', cost: 2 },
];

/**
 * Convert ActionDefinition to button config
 */
function actionToButtonConfig(action: ActionDefinition): Omit<ActionButtonConfig, 'callback'> {
  return {
    name: action.name,
    cost: action.cost,
  };
}

/**
 * SelectedHeroPanel displays the selected hero's inventory and action menu.
 * Shows 4 inventory slots (empty placeholders) and action buttons with costs.
 * Grays out unaffordable actions based on beads in hand.
 */
export class SelectedHeroPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private selectedHeroId: string | null = null;
  private actionButtons: ActionButton[] = [];
  private actionCallbacks: Map<string, () => void> = new Map();
  private currentActions: Omit<ActionButtonConfig, 'callback'>[] = DEFAULT_ACTIONS;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(PANEL_X, PANEL_Y);
    this.container.setVisible(false);
  }

  /**
   * Create the panel with action callbacks
   */
  create(callbacks: Record<string, () => void>): void {
    // Store callbacks
    for (const [name, callback] of Object.entries(callbacks)) {
      this.actionCallbacks.set(name, callback);
    }

    // Background panel
    const bg = this.scene.add.rectangle(
      PANEL_WIDTH / 2,
      PANEL_HEIGHT / 2,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      PANEL_BG_COLOR
    );
    bg.setStrokeStyle(2, PANEL_BORDER_COLOR);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(PANEL_WIDTH / 2, 15, 'Selected Hero', {
      fontSize: '14px',
      color: TEXT_COLOR,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Create inventory slots
    this.createInventorySlots();

    // Create action buttons
    this.createActionButtons();
  }

  /**
   * Create 4 empty inventory slots
   */
  private createInventorySlots(): void {
    const startX =
      (PANEL_WIDTH - (INVENTORY_SLOTS * SLOT_SIZE + (INVENTORY_SLOTS - 1) * SLOT_GAP)) / 2;

    for (let i = 0; i < INVENTORY_SLOTS; i++) {
      const x = startX + i * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const y = INVENTORY_Y_OFFSET + SLOT_SIZE / 2;

      const slot = this.scene.add.rectangle(x, y, SLOT_SIZE, SLOT_SIZE, SLOT_BG_COLOR);
      slot.setStrokeStyle(1, SLOT_BORDER_COLOR);
      this.container.add(slot);
    }
  }

  /**
   * Create action buttons with costs
   */
  private createActionButtons(): void {
    this.rebuildActionButtons();
  }

  /**
   * Rebuild action buttons based on currentActions
   */
  private rebuildActionButtons(): void {
    // Remove existing buttons
    for (const button of this.actionButtons) {
      button.container.destroy(true);
    }
    this.actionButtons = [];

    // Create new buttons
    const startX = PANEL_WIDTH / 2;
    this.currentActions.forEach((action, index) => {
      const y = ACTION_BUTTON_Y_OFFSET + index * (ACTION_BUTTON_HEIGHT + ACTION_BUTTON_GAP);
      const callback = this.actionCallbacks.get(action.name) || (() => {});

      const button = new ActionButton(this.scene, startX, y, action.name, action.cost, callback);
      this.actionButtons.push(button);
      this.container.add(button.container);
    });
  }

  /**
   * Set actions from ActionDefinition array.
   * Call this when the selected character changes.
   */
  setActions(actions: ActionDefinition[]): void {
    this.currentActions = actions.map(actionToButtonConfig);
    this.rebuildActionButtons();
  }

  /**
   * Show panel for a specific hero
   */
  showPanel(heroId: string): void {
    this.selectedHeroId = heroId;
    this.container.setVisible(true);
  }

  /**
   * Hide the panel
   */
  hidePanel(): void {
    this.selectedHeroId = null;
    this.container.setVisible(false);
  }

  /**
   * Update affordability based on beads in hand
   */
  updateAffordability(beadCounts: BeadCounts): void {
    const totalBeads = Object.values(beadCounts).reduce((sum, count) => sum + count, 0);

    for (const button of this.actionButtons) {
      button.setAffordable(totalBeads >= button.getCost());
    }
  }

  /**
   * Get state for E2E testing
   */
  getState(): SelectedHeroPanelState {
    return {
      visible: this.container.visible,
      heroId: this.selectedHeroId,
      inventorySlots: INVENTORY_SLOTS,
      actionButtons: this.actionButtons.map((button) => ({
        name: button.getName(),
        cost: button.getCost(),
        affordable: button.isAffordable(),
      })),
    };
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    this.container.destroy(true);
    this.actionButtons = [];
    this.actionCallbacks.clear();
  }
}

/**
 * Individual action button with cost display
 */
class ActionButton {
  public readonly container: Phaser.GameObjects.Container;
  private name: string;
  private cost: number;
  private callback: () => void;
  private background: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private costLabel: Phaser.GameObjects.Text;
  private affordable = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    cost: number,
    callback: () => void
  ) {
    this.name = name;
    this.cost = cost;
    this.callback = callback;
    this.container = scene.add.container(x, y);

    // Background
    this.background = scene.add.rectangle(
      0,
      0,
      ACTION_BUTTON_WIDTH,
      ACTION_BUTTON_HEIGHT,
      BUTTON_BG_COLOR
    );
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerover', () => this.onHover(true));
    this.background.on('pointerout', () => this.onHover(false));
    this.background.on('pointerdown', () => this.onClick());

    // Action name label
    this.label = scene.add.text(-70, 0, name, {
      fontSize: '14px',
      color: TEXT_COLOR,
    });
    this.label.setOrigin(0, 0.5);

    // Cost label
    this.costLabel = scene.add.text(70, 0, `${cost}`, {
      fontSize: '14px',
      color: COST_COLOR,
      fontStyle: 'bold',
    });
    this.costLabel.setOrigin(1, 0.5);

    // Bead icon before cost
    const beadIcon = scene.add.circle(50, 0, 6, 0xffffff);
    beadIcon.setStrokeStyle(1, 0x000000);

    this.container.add([this.background, this.label, beadIcon, this.costLabel]);
  }

  /**
   * Handle hover state
   */
  private onHover(hovering: boolean): void {
    if (!this.affordable) return;
    this.background.setFillStyle(hovering ? BUTTON_HOVER_COLOR : BUTTON_BG_COLOR);
  }

  /**
   * Handle click
   */
  private onClick(): void {
    if (!this.affordable) return;
    this.callback();
  }

  /**
   * Set affordability state
   */
  setAffordable(affordable: boolean): void {
    this.affordable = affordable;

    if (affordable) {
      this.background.setFillStyle(BUTTON_BG_COLOR);
      this.background.setInteractive({ useHandCursor: true });
      this.label.setColor(TEXT_COLOR);
      this.costLabel.setColor(COST_COLOR);
    } else {
      this.background.setFillStyle(BUTTON_DISABLED_COLOR);
      this.background.disableInteractive();
      this.label.setColor(DISABLED_TEXT_COLOR);
      this.costLabel.setColor(DISABLED_TEXT_COLOR);
    }
  }

  // Getters
  getName(): string {
    return this.name;
  }

  getCost(): number {
    return this.cost;
  }

  isAffordable(): boolean {
    return this.affordable;
  }
}
