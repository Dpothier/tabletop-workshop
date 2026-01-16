import Phaser from 'phaser';
import type { BeadCounts } from '@src/types/Beads';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { ActionCost } from '@src/types/ActionCost';
import { canAfford, beadCountsToActionCost } from '@src/utils/affordability';
import type { BattleStateObserver } from '@src/systems/BattleStateObserver';
import type { BattleState } from '@src/state/BattleState';

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

// Layout constants
const PANEL_X = 810;
const PANEL_Y = 480;
const PANEL_WIDTH = 200;
const PANEL_HEIGHT = 230;

// Action button layout
const ACTION_BUTTON_Y_OFFSET = 30;
const ACTION_BUTTON_WIDTH = 200;
const ACTION_BUTTON_HEIGHT = 36;
const ACTION_BUTTON_GAP = 4;

// Colors
const PANEL_BG_COLOR = 0x1a1a2e;
const PANEL_BORDER_COLOR = 0x4a4a6a;
const BUTTON_BG_COLOR = 0x3a3a5a;
const BUTTON_HOVER_COLOR = 0x4a4a6a;
const BUTTON_DISABLED_COLOR = 0x2a2a3a;
const TEXT_COLOR = '#ffffff';
const DISABLED_TEXT_COLOR = '#666666';
const COST_COLOR = '#ffcc00';

/**
 * SelectedHeroPanel displays action buttons for the selected hero.
 * Shows action buttons with time costs and grays out unaffordable actions.
 */
export class SelectedHeroPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private selectedHeroId: string | null = null;
  private actionButtons: ActionButton[] = [];
  private onActionCallback: ((actionId: string) => void) | null = null;
  private currentActions: ActionDefinition[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(PANEL_X, PANEL_Y);
    this.container.setVisible(false);
  }

  /**
   * Create the panel with actions and a unified callback
   */
  create(actions: ActionDefinition[], onAction: (actionId: string) => void): void {
    this.currentActions = actions;
    this.onActionCallback = onAction;

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
    const title = this.scene.add.text(PANEL_WIDTH / 2, 15, 'Actions', {
      fontSize: '14px',
      color: TEXT_COLOR,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Create action buttons
    this.createActionButtons();
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
      const callback = () => this.onActionCallback?.(action.id);

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
    this.currentActions = actions;
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
   * Update affordability based on beads in hand and available time
   */
  updateAffordability(beadCounts: BeadCounts, availableTime: number): void {
    const available = beadCountsToActionCost(beadCounts, availableTime);

    for (const button of this.actionButtons) {
      button.setAffordable(canAfford(available, button.getActionCost()));
    }
  }

  /**
   * Get state for E2E testing
   */
  getState(): SelectedHeroPanelState {
    return {
      visible: this.container.visible,
      heroId: this.selectedHeroId,
      inventorySlots: 0, // No inventory slots currently
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
    this.onActionCallback = null;
  }

  /**
   * Subscribe to state observer for reactive updates.
   */
  subscribeToState(observer: BattleStateObserver, state: BattleState): void {
    observer.subscribe({
      actorChanged: (actorId) => {
        if (actorId === 'monster') {
          this.hidePanel();
        }
      },
      selectionChanged: (characterId) => {
        if (characterId) {
          this.showPanel(characterId);
          // Update affordability for newly selected hero
          const beads = state.characters.find((c) => c.id === characterId)?.getHandCounts();
          const position = state.wheel.getPosition(characterId);
          if (beads && position !== undefined) {
            const availableTime = 8 - position;
            this.updateAffordability(beads, availableTime);
          }
        } else {
          this.hidePanel();
        }
      },
      heroBeadsChanged: (heroId, counts) => {
        if (heroId === this.selectedHeroId) {
          const position = state.wheel.getPosition(heroId);
          const availableTime = position !== undefined ? 8 - position : 0;
          this.updateAffordability(counts, availableTime);
        }
      },
    });
  }
}

/**
 * Individual action button with cost display
 */
class ActionButton {
  public readonly container: Phaser.GameObjects.Container;
  private name: string;
  private actionCost: ActionCost;
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
    cost: ActionCost,
    callback: () => void
  ) {
    this.name = name;
    this.actionCost = cost;
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

    // Action icon and name label
    const icon = this.getActionIcon(name);
    this.label = scene.add.text(-70, 0, `${icon} ${name}`, {
      fontSize: '14px',
      color: TEXT_COLOR,
    });
    this.label.setOrigin(0, 0.5);

    // Time cost with clock icon
    this.costLabel = scene.add.text(70, 0, `⏱${cost.time}`, {
      fontSize: '14px',
      color: COST_COLOR,
      fontStyle: 'bold',
    });
    this.costLabel.setOrigin(1, 0.5);

    // Add bead cost indicators
    let beadX = 30;
    const beadColors = { red: 0xff4444, blue: 0x4444ff, green: 0x44ff44 };
    const beads: { color: string; count: number }[] = [
      { color: 'red', count: cost.red || 0 },
      { color: 'blue', count: cost.blue || 0 },
      { color: 'green', count: cost.green || 0 },
    ];

    for (const bead of beads) {
      if (bead.count > 0) {
        const circle = scene.add.circle(
          beadX,
          0,
          5,
          beadColors[bead.color as keyof typeof beadColors]
        );
        circle.setStrokeStyle(1, 0x000000);
        this.container.add(circle);
        beadX += 12;
      }
    }

    this.container.add([this.background, this.label, this.costLabel]);
  }

  /**
   * Get the action icon based on action name
   */
  private getActionIcon(name: string): string {
    const ACTION_ICONS: Record<string, string> = {
      Move: '→',
      Run: '»',
      Attack: '⚔',
      Rest: '⏸',
      'Power Attack': '⚔⚔',
    };
    return ACTION_ICONS[name] || '•';
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

  getActionCost(): ActionCost {
    return this.actionCost;
  }

  getCost(): number {
    return this.actionCost.time;
  }

  isAffordable(): boolean {
    return this.affordable;
  }
}
