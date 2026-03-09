import type { OptionDefinition } from '@src/types/ActionDefinition';
import type { EquipmentSource, SourcedOption, ModifierSource } from '@src/types/ModifierSource';

/**
 * Resolves sourced options by pairing action options with their equipment sources.
 *
 * Rules:
 * - Only main-hand weapons grant modifiers (off-hand does NOT)
 * - Each modifier is limited to 1 usage per source per trigger
 * - Multiple sources granting the same modifier = multiple instances available
 * - Display label format: "Strength (Long Sword)"
 *
 * @param actionOptions - Map of option definitions from the action
 * @param equipment - List of equipped items that may grant modifiers
 * @returns Array of sourced options with their equipment sources
 */
export function resolveSourcedOptions(
  actionOptions: Record<string, OptionDefinition>,
  equipment: EquipmentSource[],
): SourcedOption[] {
  const sourcedOptions: SourcedOption[] = [];

  // Filter out off-hand weapons - only main-hand grants modifiers
  const activeEquipment = equipment.filter((eq) => eq.slot !== 'off-hand');

  // For each piece of active equipment, check which modifiers it grants
  for (const eq of activeEquipment) {
    for (const modifierId of eq.grantedModifiers) {
      // Check if this modifier exists in the action's options
      const optionDef = actionOptions[modifierId];
      if (!optionDef) {
        // Option not available in this action, skip it
        continue;
      }

      // Create the modifier source info
      const source: ModifierSource = {
        sourceId: eq.id,
        sourceName: eq.name,
        sourceType: eq.type,
        slot: eq.slot,
      };

      // Capitalize the modifier ID for display (e.g., "strength" -> "Strength")
      const capitalizedName = modifierId.charAt(0).toUpperCase() + modifierId.slice(1);

      // Create the sourced option
      const sourcedOption: SourcedOption = {
        optionId: modifierId,
        option: optionDef,
        source,
        displayLabel: `${capitalizedName} (${eq.name})`,
      };

      sourcedOptions.push(sourcedOption);
    }
  }

  return sourcedOptions;
}
