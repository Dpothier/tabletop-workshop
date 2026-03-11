import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';

// Types for character storage (will be defined in src/)
interface CharacterAttributes {
  str: number;
  dex: number;
  mnd: number;
  spr: number;
}

interface CharacterData {
  id: string;
  name: string;
  attributes: CharacterAttributes;
  weapon: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

interface CharacterStorageService {
  getAll(): CharacterData[];
  getById(id: string): CharacterData | null;
  getByName(name: string): CharacterData | null;
  save(character: Omit<CharacterData, 'id' | 'createdAt' | 'updatedAt'>): CharacterData;
  update(id: string, character: Partial<Omit<CharacterData, 'id' | 'isDefault'>>): CharacterData;
  delete(id: string): void;
  isNameUnique(name: string, excludeId?: string): boolean;
  clear(): void;
}

interface CharacterStorageWorld extends QuickPickleWorld {
  service?: CharacterStorageService;
  lastSavedCharacter?: CharacterData;
  lastRetrievedCharacter?: CharacterData | null;
  lastError?: Error;
  isUnique?: boolean;
  charactersBefore?: CharacterData[];
  createdAtBefore?: number;
  updatedAtBefore?: number;
}

// Module-level in-memory storage for testing (simulates localStorage persistence)
let inMemoryStorage: Map<string, CharacterData> | null = null;

const defaultCharacters: CharacterData[] = [
  {
    id: 'default-warrior',
    name: 'Warrior',
    attributes: { str: 5, dex: 2, mnd: 1, spr: 1 },
    weapon: 'sword',
    isDefault: true,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'default-mage',
    name: 'Mage',
    attributes: { str: 1, dex: 1, mnd: 5, spr: 2 },
    weapon: 'staff',
    isDefault: true,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'default-rogue',
    name: 'Rogue',
    attributes: { str: 2, dex: 5, mnd: 2, spr: 1 },
    weapon: 'dagger',
    isDefault: true,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'default-cleric',
    name: 'Cleric',
    attributes: { str: 2, dex: 2, mnd: 3, spr: 3 },
    weapon: 'mace',
    isDefault: true,
    createdAt: 0,
    updatedAt: 0,
  },
];

// Helper to clear storage (for test isolation)
function clearInMemoryStorage(): void {
  inMemoryStorage = null;
}

// Helper to create a mock service
function createCharacterStorageService(): CharacterStorageService {
  // Load from in-memory storage or initialize with defaults
  const loadData = (): Map<string, CharacterData> => {
    if (inMemoryStorage) {
      // Return a copy to avoid direct mutation
      return new Map(inMemoryStorage);
    }
    // Initialize with defaults
    const map = new Map<string, CharacterData>();
    for (const char of defaultCharacters) {
      map.set(char.id, { ...char });
    }
    inMemoryStorage = new Map(map);
    return map;
  };

  const saveData = (data: Map<string, CharacterData>) => {
    inMemoryStorage = new Map(data);
  };

  let characters = loadData();

  return {
    getAll(): CharacterData[] {
      return Array.from(characters.values());
    },

    getById(id: string): CharacterData | null {
      return characters.get(id) || null;
    },

    getByName(name: string): CharacterData | null {
      for (const char of characters.values()) {
        if (char.name === name) {
          return char;
        }
      }
      return null;
    },

    save(character: Omit<CharacterData, 'id' | 'createdAt' | 'updatedAt'>): CharacterData {
      const customCount = Array.from(characters.values()).filter((c) => !c.isDefault).length;
      if (customCount >= 10) {
        throw new Error('Maximum 10 custom characters allowed');
      }

      const id = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const newChar: CharacterData = {
        ...character,
        id,
        createdAt: now,
        updatedAt: now,
      };
      characters.set(id, newChar);
      saveData(characters);
      return newChar;
    },

    update(id: string, updates: Partial<Omit<CharacterData, 'id' | 'isDefault'>>): CharacterData {
      const char = characters.get(id);
      if (!char) {
        throw new Error(`Character not found: ${id}`);
      }

      const updated: CharacterData = {
        ...char,
        ...updates,
        id: char.id,
        isDefault: char.isDefault,
        createdAt: char.createdAt,
        updatedAt: Date.now(),
      };
      characters.set(id, updated);
      saveData(characters);
      return updated;
    },

    delete(id: string): void {
      const char = characters.get(id);
      if (!char) {
        throw new Error(`Character not found: ${id}`);
      }
      if (char.isDefault) {
        throw new Error('Cannot delete default character');
      }
      characters.delete(id);
      saveData(characters);
    },

    isNameUnique(name: string, excludeId?: string): boolean {
      for (const char of characters.values()) {
        if (char.name === name && char.id !== excludeId) {
          return false;
        }
      }
      return true;
    },

    clear(): void {
      characters = new Map();
      inMemoryStorage = null;
    },
  };
}

// Background: Initialize service
Given('the character storage service is initialized', function (world: CharacterStorageWorld) {
  // Clear any previous data for test isolation
  clearInMemoryStorage();
  world.service = createCharacterStorageService();
});

Given(
  'a fresh character storage service with no prior data',
  function (world: CharacterStorageWorld) {
    clearInMemoryStorage();
    world.service = createCharacterStorageService();
  }
);

Given(
  'I save a custom character named {string} with attributes str={int}, dex={int}, mnd={int}, spr={int}',
  function (
    world: CharacterStorageWorld,
    name: string,
    str: number,
    dex: number,
    mnd: number,
    spr: number
  ) {
    if (!world.service) {
      throw new Error('Service not initialized');
    }
    world.createdAtBefore = Date.now();
    world.lastSavedCharacter = world.service.save({
      name,
      attributes: { str, dex, mnd, spr },
      weapon: 'sword', // Default weapon
      isDefault: false,
    });
  }
);

Given(
  'I already have {int} custom characters',
  function (world: CharacterStorageWorld, count: number) {
    if (!world.service) {
      throw new Error('Service not initialized');
    }
    const existing = world.service.getAll().filter((c) => !c.isDefault).length;
    const needed = count - existing;
    for (let i = 0; i < needed; i++) {
      world.service.save({
        name: `CustomChar${i}`,
        attributes: { str: 1, dex: 1, mnd: 1, spr: 1 },
        weapon: 'sword',
        isDefault: false,
      });
    }
  }
);

// When steps
When('I get all characters', function (world: CharacterStorageWorld) {
  if (!world.service) {
    throw new Error('Service not initialized');
  }
  world.charactersBefore = world.service.getAll();
});

When('I get the character by name {string}', function (world: CharacterStorageWorld, name: string) {
  if (!world.service) {
    throw new Error('Service not initialized');
  }
  world.lastRetrievedCharacter = world.service.getByName(name);
});

When('I try to get character by id {string}', function (world: CharacterStorageWorld, id: string) {
  if (!world.service) {
    throw new Error('Service not initialized');
  }
  world.lastRetrievedCharacter = world.service.getById(id);
});

When(
  'I update the character {string} to have str={int}',
  function (world: CharacterStorageWorld, name: string, str: number) {
    if (!world.service) {
      throw new Error('Service not initialized');
    }
    const char = world.service.getByName(name);
    if (!char) {
      throw new Error(`Character not found: ${name}`);
    }
    world.createdAtBefore = char.createdAt;
    world.updatedAtBefore = char.updatedAt;
    world.lastSavedCharacter = world.service.update(char.id, {
      attributes: { ...char.attributes, str },
    });
  }
);

When('I delete the character {string}', function (world: CharacterStorageWorld, name: string) {
  if (!world.service) {
    throw new Error('Service not initialized');
  }
  const char = world.service.getByName(name);
  if (!char) {
    throw new Error(`Character not found: ${name}`);
  }
  world.service.delete(char.id);
});

When('I try to delete a default character', function (world: CharacterStorageWorld) {
  if (!world.service) {
    throw new Error('Service not initialized');
  }
  try {
    const defaults = world.service.getAll().filter((c) => c.isDefault);
    if (defaults.length > 0) {
      world.service.delete(defaults[0].id);
    }
  } catch (e) {
    world.lastError = e as Error;
  }
});

When('I check if {string} is a unique name', function (world: CharacterStorageWorld, name: string) {
  if (!world.service) {
    throw new Error('Service not initialized');
  }
  world.isUnique = world.service.isNameUnique(name);
});

When(
  'I check if {string} is unique excluding its own id',
  function (world: CharacterStorageWorld, name: string) {
    if (!world.service) {
      throw new Error('Service not initialized');
    }
    const char = world.service.getByName(name);
    if (!char) {
      throw new Error(`Character not found: ${name}`);
    }
    world.isUnique = world.service.isNameUnique(name, char.id);
  }
);

When(
  "I check if {string} is unique excluding the character's own id",
  function (world: CharacterStorageWorld, name: string) {
    if (!world.service) {
      throw new Error('Service not initialized');
    }
    const char = world.service.getByName(name);
    if (!char) {
      throw new Error(`Character not found: ${name}`);
    }
    world.isUnique = world.service.isNameUnique(name, char.id);
  }
);

When(
  'I can rename the character to {string} without conflict',
  function (world: CharacterStorageWorld, newName: string) {
    if (!world.service) {
      throw new Error('Service not initialized');
    }
    const char = world.service.getAll().find((c) => c.name === newName && !c.isDefault);
    if (!char) {
      throw new Error(`Character not found: ${newName}`);
    }
    // This is just verifying state, actual rename would happen via update
    expect(world.isUnique).toBe(true);
  }
);

When('I save {int} custom characters', function (world: CharacterStorageWorld, count: number) {
  if (!world.service) {
    throw new Error('Service not initialized');
  }
  for (let i = 0; i < count; i++) {
    world.service.save({
      name: `Character${i}`,
      attributes: { str: 1, dex: 1, mnd: 1, spr: 1 },
      weapon: 'sword',
      isDefault: false,
    });
  }
});

When('I try to save an 11th custom character', function (world: CharacterStorageWorld) {
  if (!world.service) {
    throw new Error('Service not initialized');
  }
  try {
    world.service.save({
      name: 'Eleventh',
      attributes: { str: 1, dex: 1, mnd: 1, spr: 1 },
      weapon: 'sword',
      isDefault: false,
    });
  } catch (e) {
    world.lastError = e as Error;
  }
});

When('I create a new service instance', function (world: CharacterStorageWorld) {
  world.service = createCharacterStorageService();
});

// Then steps - Assertions
Then(
  'the total character count should be {int}',
  function (world: CharacterStorageWorld, expected: number) {
    expect(world.service!.getAll()).toHaveLength(expected);
  }
);

Then(
  'all loaded characters should have isDefault set to true',
  function (world: CharacterStorageWorld) {
    if (!world.charactersBefore) {
      world.charactersBefore = world.service!.getAll();
    }
    for (const char of world.charactersBefore) {
      expect(char.isDefault).toBe(true);
    }
  }
);

Then(
  'each character should have: id, name, attributes, weapon, createdAt, updatedAt',
  function (world: CharacterStorageWorld) {
    if (!world.charactersBefore) {
      world.charactersBefore = world.service!.getAll();
    }
    for (const char of world.charactersBefore) {
      expect(char).toHaveProperty('id');
      expect(char).toHaveProperty('name');
      expect(char).toHaveProperty('attributes');
      expect(char).toHaveProperty('weapon');
      expect(char).toHaveProperty('createdAt');
      expect(char).toHaveProperty('updatedAt');
      expect(char.attributes).toHaveProperty('str');
      expect(char.attributes).toHaveProperty('dex');
      expect(char.attributes).toHaveProperty('mnd');
      expect(char.attributes).toHaveProperty('spr');
    }
  }
);

Then(
  'the custom character {string} should have isDefault set to false',
  function (world: CharacterStorageWorld, name: string) {
    const char = world.service!.getByName(name);
    expect(char).toBeDefined();
    expect(char!.isDefault).toBe(false);
  }
);

Then('the default characters should still be present', function (world: CharacterStorageWorld) {
  const defaults = world.service!.getAll().filter((c) => c.isDefault);
  expect(defaults).toHaveLength(4);
});

Then(
  'the retrieved character should have name {string}',
  function (world: CharacterStorageWorld, name: string) {
    expect(world.lastRetrievedCharacter).toBeDefined();
    expect(world.lastRetrievedCharacter!.name).toBe(name);
  }
);

Then(
  'the retrieved character {word} attribute should be {int}',
  function (world: CharacterStorageWorld, attr: 'mnd' | 'str' | 'dex' | 'spr', value: number) {
    expect(world.lastRetrievedCharacter).toBeDefined();
    expect(world.lastRetrievedCharacter!.attributes[attr]).toBe(value);
  }
);

Then(
  'the retrieved character should have isDefault set to false',
  function (world: CharacterStorageWorld) {
    expect(world.lastRetrievedCharacter).toBeDefined();
    expect(world.lastRetrievedCharacter!.isDefault).toBe(false);
  }
);

Then('the result should be null', function (world: CharacterStorageWorld) {
  expect(world.lastRetrievedCharacter).toBeNull();
});

Then(
  'the saved character should have an auto-generated id',
  function (world: CharacterStorageWorld) {
    expect(world.lastSavedCharacter).toBeDefined();
    expect(world.lastSavedCharacter!.id).toBeDefined();
    expect(world.lastSavedCharacter!.id.length).toBeGreaterThan(0);
    expect(world.lastSavedCharacter!.id).toMatch(/^char-/);
  }
);

Then(
  'the saved character should have createdAt timestamp',
  function (world: CharacterStorageWorld) {
    expect(world.lastSavedCharacter).toBeDefined();
    expect(world.lastSavedCharacter!.createdAt).toBeGreaterThan(0);
    expect(typeof world.lastSavedCharacter!.createdAt).toBe('number');
  }
);

Then(
  'the saved character should have updatedAt timestamp',
  function (world: CharacterStorageWorld) {
    expect(world.lastSavedCharacter).toBeDefined();
    expect(world.lastSavedCharacter!.updatedAt).toBeGreaterThan(0);
    expect(typeof world.lastSavedCharacter!.updatedAt).toBe('number');
  }
);

Then(
  'the saved character should have isDefault set to false',
  function (world: CharacterStorageWorld) {
    expect(world.lastSavedCharacter).toBeDefined();
    expect(world.lastSavedCharacter!.isDefault).toBe(false);
  }
);

Then(
  'the character {string} should now have str={int}',
  function (world: CharacterStorageWorld, name: string, str: number) {
    const char = world.service!.getByName(name);
    expect(char).toBeDefined();
    expect(char!.attributes.str).toBe(str);
  }
);

Then(
  'the character {string} should have the same id',
  function (world: CharacterStorageWorld, name: string) {
    const char = world.service!.getByName(name);
    expect(char).toBeDefined();
    expect(char!.id).toBe(world.lastSavedCharacter!.id);
  }
);

Then(
  'the character {string} createdAt should not change',
  function (world: CharacterStorageWorld, name: string) {
    const char = world.service!.getByName(name);
    expect(char).toBeDefined();
    expect(char!.createdAt).toBe(world.createdAtBefore);
  }
);

Then(
  'the character {string} updatedAt should be later than before',
  function (world: CharacterStorageWorld, name: string) {
    const char = world.service!.getByName(name);
    expect(char).toBeDefined();
    expect(char!.updatedAt).toBeGreaterThan(world.updatedAtBefore!);
  }
);

Then(
  'the character {string} should no longer exist',
  function (world: CharacterStorageWorld, name: string) {
    const char = world.service!.getByName(name);
    expect(char).toBeNull();
  }
);

Then(
  'a storage error should be thrown with message {string}',
  function (world: CharacterStorageWorld, message: string) {
    expect(world.lastError).toBeDefined();
    expect(world.lastError!.message).toBe(message);
  }
);

Then('the result should be true', function (world: CharacterStorageWorld) {
  expect(world.isUnique).toBe(true);
});

Then('the result should be false', function (world: CharacterStorageWorld) {
  expect(world.isUnique).toBe(false);
});

Then(
  'all {int} custom characters should be saved',
  function (world: CharacterStorageWorld, count: number) {
    const customs = world.service!.getAll().filter((c) => !c.isDefault);
    expect(customs).toHaveLength(count);
  }
);

Then(
  'the total character count should remain {int}',
  function (world: CharacterStorageWorld, expected: number) {
    const all = world.service!.getAll();
    expect(all).toHaveLength(expected);
  }
);

Then('the saved character should have id', function (world: CharacterStorageWorld) {
  expect(world.lastSavedCharacter).toBeDefined();
  expect(world.lastSavedCharacter!.id).toBeDefined();
});

Then(
  'the saved character should have name {string}',
  function (world: CharacterStorageWorld, name: string) {
    expect(world.lastSavedCharacter).toBeDefined();
    expect(world.lastSavedCharacter!.name).toBe(name);
  }
);

Then(
  'the saved character should have {word} attribute = {int}',
  function (world: CharacterStorageWorld, attr: 'str' | 'dex' | 'mnd' | 'spr', value: number) {
    expect(world.lastSavedCharacter).toBeDefined();
    expect(world.lastSavedCharacter!.attributes[attr]).toBe(value);
  }
);

Then('the saved character should have weapon', function (world: CharacterStorageWorld) {
  expect(world.lastSavedCharacter).toBeDefined();
  expect(world.lastSavedCharacter!.weapon).toBeDefined();
  expect(world.lastSavedCharacter!.weapon.length).toBeGreaterThan(0);
});

Then('the saved character should have isDefault = false', function (world: CharacterStorageWorld) {
  expect(world.lastSavedCharacter).toBeDefined();
  expect(world.lastSavedCharacter!.isDefault).toBe(false);
});

Then('the saved character should have createdAt', function (world: CharacterStorageWorld) {
  expect(world.lastSavedCharacter).toBeDefined();
  expect(world.lastSavedCharacter!.createdAt).toBeDefined();
  expect(world.lastSavedCharacter!.createdAt).toBeGreaterThan(0);
});

Then('the saved character should have updatedAt', function (world: CharacterStorageWorld) {
  expect(world.lastSavedCharacter).toBeDefined();
  expect(world.lastSavedCharacter!.updatedAt).toBeDefined();
  expect(world.lastSavedCharacter!.updatedAt).toBeGreaterThan(0);
});

Then(
  'the new service should load the saved {string} character',
  function (world: CharacterStorageWorld, name: string) {
    const char = world.service!.getByName(name);
    expect(char).toBeDefined();
    expect(char!.name).toBe(name);
  }
);

Then(
  'exactly {int} default characters should be loaded',
  function (world: CharacterStorageWorld, count: number) {
    const defaults = world.service!.getAll().filter((c) => c.isDefault);
    expect(defaults).toHaveLength(count);
  }
);

Then(
  'each default character should have valid attributes',
  function (world: CharacterStorageWorld) {
    const defaults = world.service!.getAll().filter((c) => c.isDefault);
    for (const char of defaults) {
      expect(char.attributes.str).toBeGreaterThanOrEqual(1);
      expect(char.attributes.dex).toBeGreaterThanOrEqual(1);
      expect(char.attributes.mnd).toBeGreaterThanOrEqual(1);
      expect(char.attributes.spr).toBeGreaterThanOrEqual(1);
    }
  }
);

Then(
  'each default character should have a weapon assigned',
  function (world: CharacterStorageWorld) {
    const defaults = world.service!.getAll().filter((c) => c.isDefault);
    for (const char of defaults) {
      expect(char.weapon).toBeDefined();
      expect(char.weapon.length).toBeGreaterThan(0);
    }
  }
);
