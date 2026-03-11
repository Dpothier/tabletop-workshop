import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Character } from '@src/entities/Character';
import type { EquipmentDefinition, EquipmentSlot } from '@src/types/Equipment';
import type { EquipmentSource, SourcedOption } from '@src/types/ModifierSource';
import { resolveSourcedOptions } from '@src/systems/ModifierSourcing';
import type { OptionDefinition } from '@src/types/ActionDefinition';
import { EquipmentLoader } from '@src/data/EquipmentLoader';

interface EquipmentDataWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  character?: Character;
  equipmentLoader?: any; // Will be EquipmentLoader
  equipmentDefinitions?: EquipmentDefinition[];
  equipment?: Map<string, EquipmentDefinition>;
  actionOptions?: Record<string, OptionDefinition>;
  equipmentSources?: EquipmentSource[];
  sourcedOptions?: SourcedOption[];
  error?: Error;
  equipResult?: { success: boolean; message?: string };
  yamlContent?: string;
  weaponActionYaml?: string;
  weaponActions?: Array<any>;
  weaponActionCount?: number;
}

// Sample YAML data for testing
const SAMPLE_EQUIPMENT_YAML = `
equipment:
  - id: sword
    name: Sword
    category: light
    slot: main-hand
    power: 1
    agility: 1
    range: 1
    penetration: 0
    tags: [melee, light]
    inventorySlots: 1
    twoHanded: false
    grantedModifiers: [strength, quickStrike]
    grantedActions: [attack]
    passiveStats: {}
    rangeBands: []
    startsLoaded: false
  - id: shield
    name: Shield
    category: shield
    slot: off-hand
    power: 0
    agility: 0
    range: 0
    penetration: 0
    tags: [shield]
    inventorySlots: 1
    twoHanded: false
    grantedModifiers: []
    grantedActions: [guard-stance]
    passiveStats:
      guard: 1
    rangeBands: []
    startsLoaded: false
  - id: greatsword
    name: Greatsword
    category: heavy
    slot: main-hand
    power: 3
    agility: 0
    range: 1
    penetration: 1
    tags: [melee, heavy]
    inventorySlots: 2
    twoHanded: true
    grantedModifiers: [strength]
    grantedActions: [attack]
    passiveStats: {}
    rangeBands: []
    startsLoaded: false
  - id: armor
    name: Plate Armor
    category: heavy
    slot: main-hand
    power: 0
    agility: -1
    range: 0
    penetration: 0
    tags: [armor]
    inventorySlots: 1
    twoHanded: false
    grantedModifiers: []
    grantedActions: []
    passiveStats:
      armor: 2
    rangeBands: []
    startsLoaded: false
`;

// ===== Given Steps =====

Given('an EquipmentLoader with YAML equipment data', function (world: EquipmentDataWorld) {
  world.yamlContent = SAMPLE_EQUIPMENT_YAML;
  // EquipmentLoader will be imported from @src/data/EquipmentLoader
  // For now, we're just setting up the yaml content
});

// NOTE: 'a battle grid of size {int}x{int}' is defined in battle-grid.steps.ts
// NOTE: 'a character {string} with {int} health at position {int},{int}' is defined in character.steps.ts

Given(
  'the equipment test character {string} with {int} health at position {int},{int}',
  function (world: EquipmentDataWorld, id: string, health: number, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    const character = new Character(id, health, world.grid, {} as any);
    world.grid.register(id, x, y);
    world.character = character;
  }
);

Given(
  'equipment {string} with name {string} that grants action {string}',
  function (world: EquipmentDataWorld, equipmentId: string, name: string, actionId: string) {
    if (!world.equipment) {
      world.equipment = new Map();
    }

    const equipment: EquipmentDefinition = {
      id: equipmentId,
      name: name,
      category: 'light',
      slot: 'main-hand',
      power: 1,
      agility: 0,
      range: 1,
      penetration: 0,
      tags: [],
      inventorySlots: 1,
      twoHanded: false,
      grantedModifiers: [],
      grantedActions: [actionId],
      passiveStats: {},
      rangeBands: [],
      startsLoaded: false,
    };

    world.equipment.set(equipmentId, equipment);
  }
);

Given(
  'equipment {string} with name {string} that is two-handed',
  function (world: EquipmentDataWorld, equipmentId: string, name: string) {
    if (!world.equipment) {
      world.equipment = new Map();
    }

    const equipment: EquipmentDefinition = {
      id: equipmentId,
      name: name,
      category: 'heavy',
      slot: 'main-hand',
      power: 3,
      agility: 0,
      range: 1,
      penetration: 1,
      tags: ['melee', 'heavy'],
      inventorySlots: 2,
      twoHanded: true,
      grantedModifiers: [],
      grantedActions: ['attack'],
      passiveStats: {},
      rangeBands: [],
      startsLoaded: false,
    };

    world.equipment.set(equipmentId, equipment);
  }
);

Given(
  'equipment {string} with name {string} that is not two-handed',
  function (world: EquipmentDataWorld, equipmentId: string, name: string) {
    if (!world.equipment) {
      world.equipment = new Map();
    }

    const equipment: EquipmentDefinition = {
      id: equipmentId,
      name: name,
      category: 'light',
      slot: 'main-hand',
      power: 1,
      agility: 1,
      range: 1,
      penetration: 0,
      tags: ['melee', 'light'],
      inventorySlots: 1,
      twoHanded: false,
      grantedModifiers: [],
      grantedActions: ['attack'],
      passiveStats: {},
      rangeBands: [],
      startsLoaded: false,
    };

    world.equipment.set(equipmentId, equipment);
  }
);

Given(
  'equipment {string} with name {string} that has passive guard {int}',
  function (world: EquipmentDataWorld, equipmentId: string, name: string, guardValue: number) {
    if (!world.equipment) {
      world.equipment = new Map();
    }

    const equipment: EquipmentDefinition = {
      id: equipmentId,
      name: name,
      category: 'shield',
      slot: 'off-hand',
      power: 0,
      agility: 0,
      range: 0,
      penetration: 0,
      tags: ['shield'],
      inventorySlots: 1,
      twoHanded: false,
      grantedModifiers: [],
      grantedActions: [],
      passiveStats: { guard: guardValue },
      rangeBands: [],
      startsLoaded: false,
    };

    world.equipment.set(equipmentId, equipment);
  }
);

Given(
  'equipment {string} with name {string} that has passive armor {int}',
  function (world: EquipmentDataWorld, equipmentId: string, name: string, armorValue: number) {
    if (!world.equipment) {
      world.equipment = new Map();
    }

    const equipment: EquipmentDefinition = {
      id: equipmentId,
      name: name,
      category: 'heavy',
      slot: 'main-hand',
      power: 0,
      agility: -1,
      range: 0,
      penetration: 0,
      tags: ['armor'],
      inventorySlots: 1,
      twoHanded: false,
      grantedModifiers: [],
      grantedActions: [],
      passiveStats: { armor: armorValue },
      rangeBands: [],
      startsLoaded: false,
    };

    world.equipment.set(equipmentId, equipment);
  }
);

Given(
  'equipment {string} with name {string} that has tags: {string}',
  function (world: EquipmentDataWorld, equipmentId: string, name: string, tagsStr: string): void {
    if (!world.equipment) {
      world.equipment = new Map();
    }

    const tags = tagsStr.split(',').map((t) => t.trim());
    const category = tags.includes('heavy') ? 'heavy' : 'light';
    const slot = tags.includes('shield') ? 'off-hand' : 'main-hand';

    const equipment: EquipmentDefinition = {
      id: equipmentId,
      name: name,
      category: category,
      slot: slot,
      power: tags.includes('heavy') ? 3 : 1,
      agility: tags.includes('heavy') ? 0 : 1,
      range: 1,
      penetration: tags.includes('heavy') ? 1 : 0,
      tags: tags,
      inventorySlots: 1,
      twoHanded: false,
      grantedModifiers: [],
      grantedActions: ['attack'],
      passiveStats: {},
      rangeBands: [],
      startsLoaded: false,
    };

    world.equipment.set(equipmentId, equipment);
  }
);

Given(
  'an action with option {string} that requires weaponTag {string}',
  function (world: EquipmentDataWorld, optionId: string, weaponTag: string) {
    if (!world.actionOptions) {
      world.actionOptions = {};
    }

    world.actionOptions[optionId] = {
      modifies: 'attack-1',
      modifier: { damage: 2 },
      condition: { weaponTag: weaponTag },
    };
  }
);

Given(
  'the equipment grants modifier {string}',
  function (world: EquipmentDataWorld, modifierId: string) {
    // Add the modifier to the last created equipment
    if (world.equipment && world.equipment.size > 0) {
      const lastEquipment = Array.from(world.equipment.values()).pop();
      if (lastEquipment) {
        if (!lastEquipment.grantedModifiers.includes(modifierId)) {
          lastEquipment.grantedModifiers.push(modifierId);
        }
      }
    }
  }
);

// ===== When Steps =====

When('I load equipment definitions', function (world: EquipmentDataWorld) {
  try {
    if (!world.equipmentLoader) {
      world.equipmentLoader = new EquipmentLoader();
    }
    world.equipmentDefinitions = world.equipmentLoader.loadFromYAML(world.yamlContent);
  } catch (e) {
    world.error = e as Error;
  }
});

When(
  'I retrieve equipment by ID {string}',
  function (world: EquipmentDataWorld, equipmentId: string) {
    try {
      if (!world.equipmentLoader) {
        world.equipmentLoader = new EquipmentLoader();
        world.equipmentDefinitions = world.equipmentLoader.loadFromYAML(world.yamlContent);
      }
      const equipment = world.equipmentLoader.getById(equipmentId);
      if (!world.equipment) {
        world.equipment = new Map();
      }
      world.equipment.set(equipmentId, equipment);
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When(
  'I attempt to retrieve equipment by ID {string}',
  function (world: EquipmentDataWorld, equipmentId: string) {
    try {
      if (!world.equipmentLoader) {
        world.equipmentLoader = new EquipmentLoader();
        world.equipmentDefinitions = world.equipmentLoader.loadFromYAML(world.yamlContent);
      }
      const equipment = world.equipmentLoader.getById(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment ${equipmentId} not found`);
      }
    } catch (e) {
      world.error = e as Error;
    }
  }
);

When(
  'the character equips equipment {string}',
  function (world: EquipmentDataWorld, equipmentId: string) {
    const equipment = world.equipment?.get(equipmentId);
    if (!equipment) {
      throw new Error(`Equipment ${equipmentId} not found`);
    }
    world.character!.equip(equipment);
  }
);

When(
  'the character equips equipment {string} to main-hand',
  function (world: EquipmentDataWorld, equipmentId: string) {
    const equipment = world.equipment?.get(equipmentId);
    if (!equipment) {
      throw new Error(`Equipment ${equipmentId} not found`);
    }
    world.character!.equip(equipment);
  }
);

When(
  'I attempt to equip equipment {string} to off-hand',
  function (world: EquipmentDataWorld, equipmentId: string) {
    try {
      const equipment = world.equipment?.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment ${equipmentId} not found`);
      }

      // Create off-hand version and let Character.equip() enforce two-handed rules
      const offHandEquip = { ...equipment, slot: 'off-hand' as EquipmentSlot };
      world.character!.equip(offHandEquip);
    } catch (e) {
      world.equipResult = {
        success: false,
        message: (e as Error).message,
      };
    }
  }
);

When("I get the character's available action IDs", function (_world: EquipmentDataWorld) {
  // No-op: Character.getAvailableActionIds() is called in the Then assertions
});

When('I resolve sourced options for the equipment', function (world: EquipmentDataWorld) {
  if (!world.actionOptions) {
    world.actionOptions = {};
  }

  // Convert equipment to EquipmentSource format
  const equipmentSources: EquipmentSource[] = [];
  if (world.equipment) {
    for (const [, equip] of world.equipment) {
      equipmentSources.push({
        id: equip.id,
        name: equip.name,
        type: 'weapon',
        slot: equip.slot,
        grantedModifiers: equip.grantedModifiers,
        tags: equip.tags,
      });
    }
  }

  world.sourcedOptions = resolveSourcedOptions(world.actionOptions, equipmentSources);
});

// ===== Then Steps =====

Then('I should get a list of equipment definitions', function (world: EquipmentDataWorld) {
  expect(world.equipmentDefinitions).toBeDefined();
  expect(Array.isArray(world.equipmentDefinitions)).toBe(true);
  expect(world.equipmentDefinitions!.length).toBeGreaterThan(0);
});

Then(
  'I should get equipment with name {string}',
  function (world: EquipmentDataWorld, expectedName: string) {
    const equipment = Array.from(world.equipment?.values() || [])[0];
    expect(equipment).toBeDefined();
    expect(equipment.name).toBe(expectedName);
  }
);

Then(
  'the equipment should have power {int}',
  function (world: EquipmentDataWorld, expectedPower: number) {
    const equipment = Array.from(world.equipment?.values() || [])[0];
    expect(equipment.power).toBe(expectedPower);
  }
);

Then('the equipment should not be two-handed', function (world: EquipmentDataWorld) {
  const equipment = Array.from(world.equipment?.values() || [])[0];
  expect(equipment.twoHanded).toBe(false);
});

Then(
  'an error should be thrown with message containing {string}',
  function (world: EquipmentDataWorld, expectedMessage: string) {
    expect(world.error).toBeDefined();
    expect(world.error!.message).toContain(expectedMessage);
  }
);

Then(
  'the action IDs should include {string}',
  function (world: EquipmentDataWorld, actionId: string) {
    const actionIds = world.character!.getAvailableActionIds();
    expect(actionIds).toContain(actionId);
  }
);

Then(
  'the equipment should have granted modifiers: {string}',
  function (world: EquipmentDataWorld, modifiersStr: string) {
    const equipment = Array.from(world.equipment?.values() || [])[0];
    const expectedModifiers = modifiersStr.split(',').map((m) => m.trim());
    expect(equipment.grantedModifiers).toEqual(expect.arrayContaining(expectedModifiers));
  }
);

Then(
  'the equipment should have tags: {string}',
  function (world: EquipmentDataWorld, tagsStr: string) {
    const equipment = Array.from(world.equipment?.values() || [])[0];
    const expectedTags = tagsStr.split(',').map((t) => t.trim());
    expect(equipment.tags).toEqual(expect.arrayContaining(expectedTags));
  }
);

Then(
  'the equip should fail with message {string}',
  function (world: EquipmentDataWorld, expectedMessage: string) {
    expect(world.equipResult).toBeDefined();
    expect(world.equipResult!.success).toBe(false);
    expect(world.equipResult!.message).toBe(expectedMessage);
  }
);

Then(
  "the character's guard should be {int}",
  function (world: EquipmentDataWorld, expectedGuard: number) {
    expect(world.character!.guard).toBe(expectedGuard);
  }
);

Then(
  "the character's armor should be {int}",
  function (world: EquipmentDataWorld, expectedArmor: number) {
    expect(world.character!.armor).toBe(expectedArmor);
  }
);

Then(
  'the option {string} should be available',
  function (world: EquipmentDataWorld, optionId: string) {
    expect(world.sourcedOptions).toBeDefined();
    const found = world.sourcedOptions!.some((so) => so.optionId === optionId);
    expect(found).toBe(true);
  }
);

Then(
  'the option {string} should not be available',
  function (world: EquipmentDataWorld, optionId: string) {
    expect(world.sourcedOptions).toBeDefined();
    const found = world.sourcedOptions!.some((so) => so.optionId === optionId);
    expect(found).toBe(false);
  }
);

// ===== New Steps for FR4 and FR7 =====

When('the character equips the retrieved equipment', function (world: EquipmentDataWorld) {
  // Get the first equipment from the equipment map (retrieved by ID in previous step)
  const firstEquipment = Array.from(world.equipment?.values() || [])[0];
  if (!firstEquipment) {
    throw new Error('No equipment retrieved to equip');
  }
  world.character!.equip(firstEquipment);
});

Then(
  'the character should have equipment in slot {string}',
  function (world: EquipmentDataWorld, slot: EquipmentSlot) {
    const equippedItem = world.character!.getEquipment(slot);
    expect(equippedItem).toBeDefined();
    expect(equippedItem?.slot).toBe(slot);
  }
);

Given('a weapons action YAML file exists', function (world: EquipmentDataWorld) {
  try {
    const weaponsYamlPath = path.join(process.cwd(), 'public/data/actions/weapons.yaml');
    const fileContent = fs.readFileSync(weaponsYamlPath, 'utf-8');
    world.weaponActionYaml = fileContent;
  } catch (e) {
    world.error = e as Error;
  }
});

When('I load weapon actions from the YAML', function (world: EquipmentDataWorld) {
  try {
    if (!world.weaponActionYaml) {
      throw new Error('Weapon action YAML not found');
    }
    const parsed = yaml.load(world.weaponActionYaml) as { actions?: Array<any> };
    world.weaponActions = parsed.actions || [];
    world.weaponActionCount = world.weaponActions.length;
  } catch (e) {
    world.error = e as Error;
  }
});

Then('I should get at least one action definition', function (world: EquipmentDataWorld) {
  expect(world.weaponActions).toBeDefined();
  expect(Array.isArray(world.weaponActions)).toBe(true);
  expect(world.weaponActionCount).toBeGreaterThanOrEqual(1);
});

Then('the action should have an id property', function (world: EquipmentDataWorld) {
  expect(world.weaponActions).toBeDefined();
  expect(world.weaponActions!.length).toBeGreaterThan(0);
  const firstAction = world.weaponActions![0];
  expect(firstAction.id).toBeDefined();
  expect(typeof firstAction.id).toBe('string');
});
