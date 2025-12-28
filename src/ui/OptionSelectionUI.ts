import type { ActionCost } from '@src/types/ActionCost';
import type { BeadCounts } from '@src/types/Beads';
import type { OptionChoice } from '@src/types/ParameterPrompt';
import { canAfford, beadCountsToActionCost } from '@src/utils/affordability';

export interface OptionSelectionConfig {
  prompt: string;
  options: OptionChoice[];
  multiSelect: boolean;
  availableBeads: BeadCounts;
  availableTime: number;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export interface OptionSelectionState {
  options: OptionChoice[];
  multiSelect: boolean;
  selectedIds: string[];
  availableBeads: BeadCounts;
  availableTime: number;
}

/**
 * OptionSelectionUI - Logic-only component for option selection management.
 * Does not depend on Phaser UI rendering.
 */
export class OptionSelectionUI {
  private options: OptionChoice[] = [];
  private multiSelect: boolean = false;
  private selectedIds: Set<string> = new Set();
  private availableBeads: BeadCounts = { red: 0, blue: 0, green: 0, white: 0 };
  private availableTime: number = 0;
  private onConfirmCallback: ((selectedIds: string[]) => void) | null = null;
  private onCancelCallback: (() => void) | null = null;

  show(config: {
    prompt: string;
    options: OptionChoice[];
    multiSelect: boolean;
    availableBeads: BeadCounts;
    availableTime: number;
    onConfirm: (selectedIds: string[]) => void;
    onCancel: () => void;
  }): void {
    this.options = config.options;
    this.multiSelect = config.multiSelect;
    this.availableBeads = config.availableBeads;
    this.availableTime = config.availableTime;
    this.onConfirmCallback = config.onConfirm;
    this.onCancelCallback = config.onCancel;
    this.selectedIds.clear();
  }

  hide(): void {
    this.selectedIds.clear();
  }

  selectOption(optionId: string): void {
    const option = this.options.find((o) => o.id === optionId);
    if (!option) return;

    if (!this.isOptionAffordable(optionId)) {
      return;
    }

    if (!this.multiSelect) {
      this.selectedIds.clear();
    }

    this.selectedIds.add(optionId);
  }

  deselectOption(optionId: string): void {
    this.selectedIds.delete(optionId);
  }

  isOptionSelected(optionId: string): boolean {
    return this.selectedIds.has(optionId);
  }

  getSelectedOptionsCost(): Partial<ActionCost> {
    const cost: Partial<ActionCost> = {};

    for (const optionId of this.selectedIds) {
      const option = this.options.find((o) => o.id === optionId);
      if (option?.cost) {
        if (option.cost.red) cost.red = (cost.red ?? 0) + option.cost.red;
        if (option.cost.blue) cost.blue = (cost.blue ?? 0) + option.cost.blue;
        if (option.cost.green) cost.green = (cost.green ?? 0) + option.cost.green;
        if (option.cost.white) cost.white = (cost.white ?? 0) + option.cost.white;
        if (option.cost.time) cost.time = (cost.time ?? 0) + option.cost.time;
      }
    }

    return cost;
  }

  getRemainingBeads(): BeadCounts {
    const selectedCost = this.getSelectedOptionsCost();
    return {
      red: this.availableBeads.red - (selectedCost.red ?? 0),
      blue: this.availableBeads.blue - (selectedCost.blue ?? 0),
      green: this.availableBeads.green - (selectedCost.green ?? 0),
      white: this.availableBeads.white - (selectedCost.white ?? 0),
    };
  }

  isOptionAffordable(optionId: string): boolean {
    const option = this.options.find((o) => o.id === optionId);
    if (!option) return false;

    // Zero-cost options are always affordable
    if (!option.cost || Object.keys(option.cost).length === 0) {
      return true;
    }

    // Use remaining beads (after selected options' costs)
    const remainingBeads = this.getRemainingBeads();
    const available = beadCountsToActionCost(remainingBeads, this.availableTime);
    return canAfford(available, option.cost as ActionCost);
  }

  getSelectedOptionIds(): string[] {
    return Array.from(this.selectedIds);
  }

  confirm(): void {
    if (this.onConfirmCallback) {
      this.onConfirmCallback(this.getSelectedOptionIds());
    }
  }

  cancel(): void {
    this.selectedIds.clear();
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }
  }

  getState(): {
    options: OptionChoice[];
    multiSelect: boolean;
    selectedIds: string[];
    availableBeads: BeadCounts;
    availableTime: number;
  } {
    return {
      options: this.options,
      multiSelect: this.multiSelect,
      selectedIds: this.getSelectedOptionIds(),
      availableBeads: this.availableBeads,
      availableTime: this.availableTime,
    };
  }
}
