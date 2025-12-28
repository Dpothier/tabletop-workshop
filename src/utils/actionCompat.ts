import type { ActionDefinition } from '@src/types/ActionDefinition';

/**
 * Derive the target type from an action's parameters.
 * Used for compatibility with old UI code that switches on targetType.
 */
export function getTargetType(action: ActionDefinition): 'tile' | 'entity' | 'none' {
  if (action.parameters.length === 0) {
    return 'none';
  }

  const firstParam = action.parameters[0];
  if (firstParam.type === 'tile') {
    return 'tile';
  }
  if (firstParam.type === 'entity') {
    return 'entity';
  }

  return 'none';
}

/**
 * Get the wheel cost (time units) from an action.
 * New actions use cost.time instead of flat cost number.
 */
export function getWheelCost(action: ActionDefinition): number {
  return action.cost.time;
}

/**
 * Get the range from the first tile or entity parameter.
 * Falls back to 1 if not specified.
 */
export function getActionRange(action: ActionDefinition): number {
  for (const param of action.parameters) {
    if (param.type === 'tile' || param.type === 'entity') {
      return param.range ?? 1;
    }
  }
  return 1;
}
