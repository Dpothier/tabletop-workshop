import Phaser from 'phaser';
import type { BeadCounts } from '@src/types/Beads';
import type { ActionDefinition, ActionCategory } from '@src/types/ActionDefinition';
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
// Panel fills space between action wheel (ends ~Y=410) and hero cards (Y=600)
// Stretches from after hero cards (X~600) to right edge
const PANEL_X = 600;
const PANEL_Y = 420;
const PANEL_WIDTH = 410;
const PANEL_HEIGHT = 290;

// Tab layout
const TAB_HEIGHT = 35;
const TAB_Y = 20;

// Action button layout - grid below tabs
const ACTION_BUTTON_Y_START = 70; // Below tabs
const ACTION_BUTTON_WIDTH = 180;
const ACTION_BUTTON_HEIGHT = 90;
const ACTION_BUTTON_GAP = 10;

// Tab definitions
const TABS: { id: ActionCategory; label: string }[] = [
  { id: 'movement', label: 'Movement' },
  { id: 'attack', label: 'Attacks' },
  { id: 'other', label: 'Others' },
];

// Colors
const PANEL_BG_COLOR = 0x1a1a2e;
const PANEL_BORDER_COLOR = 0x4a4a6a;
const BUTTON_BG_COLOR = 0x3a3a5a;
const BUTTON_HOVER_COLOR = 0x4a4a6a;
const BUTTON_DISABLED_COLOR = 0x2a2a3a;
const TAB_ACTIVE_COLOR = 0x4a4a6a;
const TAB_INACTIVE_COLOR = 0x2a2a3a;
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
  private activeTab: ActionCategory = 'movement';
  private tabBackgrounds: Map<ActionCategory, Phaser.GameObjects.Rectangle> = new Map();

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

    // Create category tabs
    this.createTabs();

    // Create action buttons
    this.createActionButtons();
  }

  /**
   * Create category tabs at top of panel
   */
  private createTabs(): void {
    const tabWidth = PANEL_WIDTH / TABS.length;

    TABS.forEach((tab, index) => {
      const x = tabWidth / 2 + index * tabWidth;

      // Tab background
      const tabBg = this.scene.add.rectangle(
        x,
        TAB_Y,
        tabWidth - 4,
        TAB_HEIGHT,
        tab.id === this.activeTab ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR
      );
      tabBg.setStrokeStyle(1, PANEL_BORDER_COLOR);
      tabBg.setInteractive({ useHandCursor: true });
      tabBg.on('pointerdown', () => this.selectTab(tab.id));
      tabBg.on('pointerover', () => {
        if (tab.id !== this.activeTab) {
          tabBg.setFillStyle(BUTTON_HOVER_COLOR);
        }
      });
      tabBg.on('pointerout', () => {
        tabBg.setFillStyle(tab.id === this.activeTab ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR);
      });

      this.tabBackgrounds.set(tab.id, tabBg);
      this.container.add(tabBg);

      // Tab label
      const label = this.scene.add.text(x, TAB_Y, tab.label, {
        fontSize: '12px',
        color: TEXT_COLOR,
      });
      label.setOrigin(0.5);
      this.container.add(label);
    });
  }

  /**
   * Select a tab and update display
   */
  private selectTab(category: ActionCategory): void {
    this.activeTab = category;
    this.updateTabHighlights();
    this.rebuildActionButtons();
  }

  /**
   * Update tab visual highlights
   */
  private updateTabHighlights(): void {
    for (const [category, bg] of this.tabBackgrounds) {
      bg.setFillStyle(category === this.activeTab ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR);
    }
  }

  /**
   * Create action buttons with costs
   */
  private createActionButtons(): void {
    this.rebuildActionButtons();
  }

  /**
   * Rebuild action buttons based on currentActions and active tab
   */
  private rebuildActionButtons(): void {
    // Remove existing buttons
    for (const button of this.actionButtons) {
      button.container.destroy(true);
    }
    this.actionButtons = [];

    // Filter actions by active tab category
    // Handle actions without category by showing them in 'other' tab
    const filteredActions = this.currentActions.filter((action) => {
      const category = action.category || 'other';
      return category === this.activeTab;
    });

    // Create new buttons - 2-column grid layout
    const buttonsPerRow = 2;
    const rowHeight = ACTION_BUTTON_HEIGHT + ACTION_BUTTON_GAP;

    filteredActions.forEach((action, index) => {
      const row = Math.floor(index / buttonsPerRow);
      const col = index % buttonsPerRow;

      // Calculate buttons in this row for centering
      const buttonsInThisRow = Math.min(
        buttonsPerRow,
        filteredActions.length - row * buttonsPerRow
      );
      const rowWidth =
        buttonsInThisRow * ACTION_BUTTON_WIDTH + (buttonsInThisRow - 1) * ACTION_BUTTON_GAP;
      const rowStartX = (PANEL_WIDTH - rowWidth) / 2 + ACTION_BUTTON_WIDTH / 2;

      const x = rowStartX + col * (ACTION_BUTTON_WIDTH + ACTION_BUTTON_GAP);
      const y = ACTION_BUTTON_Y_START + row * rowHeight + ACTION_BUTTON_HEIGHT / 2;

      const callback = () => this.onActionCallback?.(action.id);
      const button = new ActionButton(this.scene, x, y, action.name, action.cost, callback);
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
    // Reset to movement tab when showing panel
    this.activeTab = 'movement';
    this.updateTabHighlights();
    this.rebuildActionButtons();
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
   * Get state for E2E testing.
   * Returns all available actions (from all tabs), not just visible ones.
   */
  getState(): SelectedHeroPanelState {
    // Build affordability map from visible buttons
    const affordabilityMap = new Map<string, boolean>();
    for (const button of this.actionButtons) {
      affordabilityMap.set(button.getName(), button.isAffordable());
    }

    // Return all actions from currentActions for complete test coverage
    return {
      visible: this.container.visible,
      heroId: this.selectedHeroId,
      inventorySlots: 0, // No inventory slots currently
      actionButtons: this.currentActions.map((action) => ({
        name: action.name,
        cost: action.cost.time,
        affordable: affordabilityMap.get(action.name) ?? true,
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

    // Vertical layout: icon on top, name below, cost at bottom
    const icon = this.getActionIcon(name);

    // Large icon at top
    const iconText = scene.add.text(0, -25, icon, {
      fontSize: '24px',
      color: TEXT_COLOR,
    });
    iconText.setOrigin(0.5);

    // Action name below icon
    this.label = scene.add.text(0, 5, name, {
      fontSize: '11px',
      color: TEXT_COLOR,
    });
    this.label.setOrigin(0.5);

    // Time cost at bottom
    this.costLabel = scene.add.text(0, 25, `⏱${cost.time}`, {
      fontSize: '12px',
      color: COST_COLOR,
      fontStyle: 'bold',
    });
    this.costLabel.setOrigin(0.5);

    this.container.add([this.background, iconText, this.label, this.costLabel]);
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
