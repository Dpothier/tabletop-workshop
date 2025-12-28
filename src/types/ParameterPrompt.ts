import type { ActionCost } from '@src/types/ActionCost';

/**
 * TilePrompt prompts for selection of a tile on the battlefield.
 */
export interface TilePrompt {
  type: 'tile';
  key: string;
  prompt: string;
  range?: number;
  filter?: 'empty' | 'any';
  optional?: boolean;
}

/**
 * EntityPrompt prompts for selection of an entity (character or enemy).
 */
export interface EntityPrompt {
  type: 'entity';
  key: string;
  prompt: string;
  filter: 'enemy' | 'ally' | 'any';
  range?: number;
  optional?: boolean;
}

/**
 * OptionChoice represents a single selectable option.
 */
export interface OptionChoice {
  id: string;
  label: string;
  cost?: Partial<ActionCost>;
}

/**
 * OptionPrompt prompts for selection from a list of options.
 */
export interface OptionPrompt {
  type: 'option';
  key: string;
  prompt: string;
  optional?: boolean;
  multiSelect?: boolean;
  options: OptionChoice[];
}

/**
 * ParameterPrompt is a union type of all parameter prompt types.
 * Used by ActionResolution to guide parameter collection from the user.
 */
export type ParameterPrompt = TilePrompt | EntityPrompt | OptionPrompt;
