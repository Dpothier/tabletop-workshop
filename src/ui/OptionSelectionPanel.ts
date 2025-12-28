import Phaser from 'phaser';
import type { BeadCounts } from '@src/types/Beads';
import type { OptionChoice } from '@src/types/ParameterPrompt';
import { OptionSelectionUI } from '@src/ui/OptionSelectionUI';

// Layout constants
const PANEL_WIDTH = 320;
const BUTTON_WIDTH = 270;
const BUTTON_HEIGHT = 32;
const BUTTON_GAP = 4;
const PADDING = 20;
const ACTION_BUTTON_WIDTH = 90;
const ACTION_BUTTON_HEIGHT = 28;

// Colors (match SelectedHeroPanel)
const PANEL_BG_COLOR = 0x1a1a2e;
const PANEL_BORDER_COLOR = 0x4a4a6a;
const BUTTON_BG_COLOR = 0x3a3a5a;
const BUTTON_HOVER_COLOR = 0x4a4a6a;
const BUTTON_DISABLED_COLOR = 0x2a2a3a;
const BUTTON_SELECTED_COLOR = 0x4a6a4a;
const TEXT_COLOR = '#ffffff';
const DISABLED_TEXT_COLOR = '#666666';
const COST_COLOR = '#ffcc00';

export interface OptionSelectionPanelConfig {
  prompt: string;
  options: OptionChoice[];
  multiSelect: boolean;
  availableBeads: BeadCounts;
  availableTime: number;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

/**
 * OptionSelectionPanel is a Phaser UI wrapper for OptionSelectionUI.
 * Displays a modal dialog with selectable options and confirm/cancel buttons.
 */
export class OptionSelectionPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private logic: OptionSelectionUI;
  private optionButtons: Map<string, OptionButton> = new Map();
  private config?: OptionSelectionPanelConfig;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.logic = new OptionSelectionUI();
    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);
    this.container.setDepth(100); // Above other UI
  }

  show(config: OptionSelectionPanelConfig): void {
    this.config = config;

    // Initialize logic
    this.logic.show({
      ...config,
      onConfirm: (ids) => {
        this.hide();
        config.onConfirm(ids);
      },
      onCancel: () => {
        this.hide();
        config.onCancel();
      },
    });

    // Build UI
    this.buildUI();
    this.container.setVisible(true);

    // Center on screen
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    this.container.setPosition(centerX, centerY);
  }

  hide(): void {
    this.container.setVisible(false);
    this.logic.hide();
    this.clearUI();
  }

  private buildUI(): void {
    this.clearUI();

    if (!this.config) return;

    // Calculate panel height based on options
    const optionCount = this.config.options.length;
    const panelHeight =
      PADDING * 2 + 30 + optionCount * (BUTTON_HEIGHT + BUTTON_GAP) + ACTION_BUTTON_HEIGHT + 30;

    // Background
    const bg = this.scene.add.rectangle(0, 0, PANEL_WIDTH, panelHeight, PANEL_BG_COLOR);
    bg.setStrokeStyle(2, PANEL_BORDER_COLOR);
    this.container.add(bg);

    // Prompt text
    const promptText = this.scene.add.text(0, -panelHeight / 2 + PADDING, this.config.prompt, {
      fontSize: '14px',
      color: TEXT_COLOR,
      fontStyle: 'bold',
    });
    promptText.setOrigin(0.5, 0);
    this.container.add(promptText);

    // Option buttons
    let y = -panelHeight / 2 + PADDING + 30;
    for (const option of this.config.options) {
      const button = new OptionButton(
        this.scene,
        0,
        y,
        option,
        this.logic.isOptionAffordable(option.id),
        this.logic.isOptionSelected(option.id),
        () => this.onOptionClicked(option.id)
      );
      this.optionButtons.set(option.id, button);
      this.container.add(button.container);
      y += BUTTON_HEIGHT + BUTTON_GAP;
    }

    // Confirm/Cancel buttons
    y += 10;

    const confirmBtn = this.createActionButton('Confirm', -50, y, () => this.logic.confirm());
    this.container.add(confirmBtn);

    const cancelBtn = this.createActionButton('Cancel', 50, y, () => this.logic.cancel());
    this.container.add(cancelBtn);
  }

  private onOptionClicked(optionId: string): void {
    if (this.logic.isOptionSelected(optionId)) {
      this.logic.deselectOption(optionId);
    } else {
      this.logic.selectOption(optionId);
    }
    this.updateButtonStates();
  }

  private updateButtonStates(): void {
    for (const [id, button] of this.optionButtons) {
      button.setAffordable(this.logic.isOptionAffordable(id));
      button.setSelected(this.logic.isOptionSelected(id));
    }
  }

  private createActionButton(
    label: string,
    x: number,
    y: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(
      0,
      0,
      ACTION_BUTTON_WIDTH,
      ACTION_BUTTON_HEIGHT,
      BUTTON_BG_COLOR
    );
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(BUTTON_HOVER_COLOR));
    bg.on('pointerout', () => bg.setFillStyle(BUTTON_BG_COLOR));
    bg.on('pointerdown', onClick);

    const text = this.scene.add.text(0, 0, label, { fontSize: '12px', color: TEXT_COLOR });
    text.setOrigin(0.5);

    container.add([bg, text]);
    return container;
  }

  private clearUI(): void {
    this.container.removeAll(true);
    this.optionButtons.clear();
  }

  destroy(): void {
    this.container.destroy(true);
    this.optionButtons.clear();
  }
}

/**
 * OptionButton - Individual option button with cost display and state management
 */
class OptionButton {
  public readonly container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private costLabel: Phaser.GameObjects.Text;
  private affordable: boolean;
  private selected: boolean;
  private onClick: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    option: OptionChoice,
    affordable: boolean,
    selected: boolean,
    onClick: () => void
  ) {
    this.affordable = affordable;
    this.selected = selected;
    this.onClick = onClick;
    this.container = scene.add.container(x, y);

    // Background
    this.background = scene.add.rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_BG_COLOR);
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerover', () => this.onHover(true));
    this.background.on('pointerout', () => this.onHover(false));
    this.background.on('pointerdown', () => this.handleClick());

    // Label
    this.label = scene.add.text(-BUTTON_WIDTH / 2 + 10, 0, option.label, {
      fontSize: '13px',
      color: TEXT_COLOR,
    });
    this.label.setOrigin(0, 0.5);

    // Cost display
    const costText = this.formatCost(option.cost);
    this.costLabel = scene.add.text(BUTTON_WIDTH / 2 - 10, 0, costText, {
      fontSize: '12px',
      color: COST_COLOR,
    });
    this.costLabel.setOrigin(1, 0.5);

    this.container.add([this.background, this.label, this.costLabel]);
    this.updateVisuals();
  }

  private formatCost(
    cost?: Partial<{ red: number; blue: number; green: number; white: number; time: number }>
  ): string {
    if (!cost) return 'Free';
    const parts: string[] = [];
    if (cost.red) parts.push(`${cost.red}R`);
    if (cost.blue) parts.push(`${cost.blue}B`);
    if (cost.green) parts.push(`${cost.green}G`);
    if (cost.white) parts.push(`${cost.white}W`);
    if (cost.time) parts.push(`${cost.time}T`);
    return parts.length > 0 ? parts.join(' ') : 'Free';
  }

  private onHover(hovering: boolean): void {
    if (!this.affordable) return;
    if (hovering && !this.selected) {
      this.background.setFillStyle(BUTTON_HOVER_COLOR);
    } else {
      this.updateVisuals();
    }
  }

  private handleClick(): void {
    if (!this.affordable && !this.selected) return;
    this.onClick();
  }

  setAffordable(affordable: boolean): void {
    this.affordable = affordable;
    this.updateVisuals();
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.updateVisuals();
  }

  private updateVisuals(): void {
    if (this.selected) {
      this.background.setFillStyle(BUTTON_SELECTED_COLOR);
      this.background.setInteractive({ useHandCursor: true });
      this.label.setColor(TEXT_COLOR);
      this.costLabel.setColor(COST_COLOR);
    } else if (this.affordable) {
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
}
