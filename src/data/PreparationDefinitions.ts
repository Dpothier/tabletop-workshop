export type PreparationType = 'windup' | 'aim' | 'ponder' | 'channel' | 'rest';

export interface PreparationDefinition {
  type: PreparationType;
  wheelCost: number;
  maxStacks: number | null; // null = unlimited
  pairedActions: string[];
}

export const PREPARATION_DEFINITIONS: Record<PreparationType, PreparationDefinition> = {
  windup: { type: 'windup', wheelCost: 1, maxStacks: 1, pairedActions: ['attack'] },
  aim: { type: 'aim', wheelCost: 1, maxStacks: null, pairedActions: ['shoot'] },
  ponder: { type: 'ponder', wheelCost: 1, maxStacks: null, pairedActions: [] },
  channel: { type: 'channel', wheelCost: 1, maxStacks: null, pairedActions: ['cast'] },
  rest: { type: 'rest', wheelCost: 2, maxStacks: null, pairedActions: [] },
};
