import type { CharacterData } from '@src/types/CharacterData';

const STORAGE_KEY = 'tabletop_characters';
const MAX_CUSTOM_CHARACTERS = 10;

const DEFAULT_CHARACTERS: CharacterData[] = [
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

export class CharacterStorageService {
  private characters: Map<string, CharacterData>;

  constructor() {
    this.characters = this.loadCharacters();
  }

  private loadCharacters(): Map<string, CharacterData> {
    const stored = this.loadFromStorage();
    if (stored.size > 0) {
      return stored;
    }

    const map = new Map<string, CharacterData>();
    for (const char of DEFAULT_CHARACTERS) {
      map.set(char.id, { ...char });
    }
    this.saveToStorage(map);
    return map;
  }

  private loadFromStorage(): Map<string, CharacterData> {
    try {
      if (typeof window === 'undefined') {
        return new Map();
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return new Map();
      }

      const data = JSON.parse(stored) as CharacterData[];
      const map = new Map<string, CharacterData>();
      for (const char of data) {
        map.set(char.id, char);
      }
      return map;
    } catch {
      return new Map();
    }
  }

  private saveToStorage(characters: Map<string, CharacterData>): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      const data = Array.from(characters.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }

  getAll(): CharacterData[] {
    return Array.from(this.characters.values());
  }

  getById(id: string): CharacterData | null {
    return this.characters.get(id) ?? null;
  }

  getByName(name: string): CharacterData | null {
    for (const char of this.characters.values()) {
      if (char.name === name) {
        return char;
      }
    }
    return null;
  }

  save(character: Omit<CharacterData, 'id' | 'createdAt' | 'updatedAt'>): CharacterData {
    const customCount = Array.from(this.characters.values()).filter(
      (c: CharacterData) => !c.isDefault
    ).length;

    if (customCount >= MAX_CUSTOM_CHARACTERS) {
      throw new Error('Maximum 10 custom characters allowed');
    }

    const id = `char-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const now = Date.now();

    const newChar: CharacterData = {
      ...character,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.characters.set(id, newChar);
    this.saveToStorage(this.characters);
    return newChar;
  }

  update(
    id: string,
    updates: Partial<Omit<CharacterData, 'id' | 'isDefault' | 'createdAt'>>
  ): CharacterData {
    const char = this.characters.get(id);
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

    this.characters.set(id, updated);
    this.saveToStorage(this.characters);
    return updated;
  }

  delete(id: string): void {
    const char = this.characters.get(id);
    if (!char) {
      throw new Error(`Character not found: ${id}`);
    }

    if (char.isDefault) {
      throw new Error('Cannot delete default character');
    }

    this.characters.delete(id);
    this.saveToStorage(this.characters);
  }

  isNameUnique(name: string, excludeId?: string): boolean {
    for (const char of this.characters.values()) {
      if (char.name === name && char.id !== excludeId) {
        return false;
      }
    }
    return true;
  }
}
