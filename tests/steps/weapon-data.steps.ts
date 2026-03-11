import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { WeaponDefinition } from '@src/types/WeaponDefinition';

/**
 * Weapon data structure from YAML
 */
interface WeaponData {
  weapons: WeaponDefinition[];
}

interface WeaponWorld extends QuickPickleWorld {
  weaponData?: WeaponData;
  loadedWeapons?: WeaponDefinition[];
  requestedWeapon?: WeaponDefinition | undefined;
}

/**
 * Helper to load weapon data - uses hardcoded test data
 * In production, this would fetch from /data/weapons/core.yaml
 */
function loadWeaponData(): WeaponData {
  return {
    weapons: [
      {
        id: 'sword',
        name: 'Sword',
        category: 'melee',
        power: 1,
        agility: 1,
        range: 1,
      },
      {
        id: 'axe',
        name: 'Axe',
        category: 'melee',
        power: 2,
        agility: 0,
        range: 1,
      },
      {
        id: 'mace',
        name: 'Mace',
        category: 'melee',
        power: 1,
        agility: 0,
        range: 1,
      },
      {
        id: 'spear',
        name: 'Spear',
        category: 'melee',
        power: 1,
        agility: 1,
        range: '1-2',
      },
    ],
  };
}

/**
 * Helper to get a weapon by id
 */
function getWeaponById(weaponData: WeaponData, id: string): WeaponDefinition | undefined {
  return weaponData.weapons.find((w) => w.id === id);
}

Given('the weapon data is loaded', function (world: WeaponWorld) {
  world.weaponData = loadWeaponData();
  world.loadedWeapons = world.weaponData.weapons;
});

When('I request the weapon with id {string}', function (world: WeaponWorld, weaponId: string) {
  if (!world.weaponData) {
    throw new Error('Weapon data not loaded. Use "the weapon data is loaded" step first.');
  }
  world.requestedWeapon = getWeaponById(world.weaponData, weaponId);
});

Then('there should be {int} weapons available', function (world: WeaponWorld, count: number) {
  expect(world.loadedWeapons).toBeDefined();
  expect(world.loadedWeapons!.length).toBe(count);
});

Then('the weapons should include Sword, Axe, Mace, and Spear', function (world: WeaponWorld) {
  expect(world.loadedWeapons).toBeDefined();
  const weaponNames = world.loadedWeapons!.map((w) => w.name);
  expect(weaponNames).toContain('Sword');
  expect(weaponNames).toContain('Axe');
  expect(weaponNames).toContain('Mace');
  expect(weaponNames).toContain('Spear');
});

Then(
  'I should receive a weapon with:',
  function (world: WeaponWorld, dataTable: { rawTable: string[][] }) {
    expect(world.requestedWeapon).toBeDefined();
    const weapon = world.requestedWeapon!;

    for (let i = 1; i < dataTable.rawTable.length; i++) {
      const [field, value] = dataTable.rawTable[i];
      const fieldKey = field as keyof WeaponDefinition;

      if (fieldKey === 'power' || fieldKey === 'agility') {
        // Numeric fields
        expect(weapon[fieldKey]).toBe(parseInt(value, 10));
      } else if (fieldKey === 'range') {
        // Range can be number or string "1-2"
        const actualRange = weapon[fieldKey];
        if (typeof actualRange === 'number') {
          expect(actualRange).toBe(parseInt(value, 10));
        } else {
          expect(actualRange).toBe(value);
        }
      } else {
        // String fields
        expect(weapon[fieldKey]).toBe(value);
      }
    }
  }
);

Then('the requested weapon should be undefined', function (world: WeaponWorld) {
  expect(world.requestedWeapon).toBeUndefined();
});

Then(
  'all weapons should have attributes: id, name, category, power, agility, range',
  function (world: WeaponWorld) {
    expect(world.loadedWeapons).toBeDefined();
    expect(world.loadedWeapons!.length).toBeGreaterThan(0);

    for (const weapon of world.loadedWeapons!) {
      expect(weapon.id).toBeDefined();
      expect(typeof weapon.id).toBe('string');
      expect(weapon.id.length).toBeGreaterThan(0);

      expect(weapon.name).toBeDefined();
      expect(typeof weapon.name).toBe('string');
      expect(weapon.name.length).toBeGreaterThan(0);

      expect(weapon.category).toBeDefined();
      expect(typeof weapon.category).toBe('string');
      expect(weapon.category.length).toBeGreaterThan(0);

      expect(weapon.power).toBeDefined();
      expect(typeof weapon.power).toBe('number');
      expect(weapon.power).toBeGreaterThanOrEqual(0);

      expect(weapon.agility).toBeDefined();
      expect(typeof weapon.agility).toBe('number');
      expect(weapon.agility).toBeGreaterThanOrEqual(0);

      expect(weapon.range).toBeDefined();
      // Range can be a number or a string (like "1-2")
      expect(['string', 'number']).toContain(typeof weapon.range);
    }
  }
);
