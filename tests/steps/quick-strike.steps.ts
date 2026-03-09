import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import type { OptionDefinition } from '@src/types/ActionDefinition';
import type { EquipmentSource, SourcedOption } from '@src/types/ModifierSource';
import { resolveSourcedOptions } from '@src/systems/ModifierSourcing';

interface QuickStrikeWorld extends QuickPickleWorld {
  attackActionDef?: any;
  quickStrikeOption?: any;
  actionOptions?: Record<string, OptionDefinition>;
  equipment?: EquipmentSource[];
  sourcedOptions?: SourcedOption[];
  effectiveTimeCost?: number;
}

// ===== Helper Functions =====

function loadAttackActionDef(): any {
  const yamlPath = '/workspace/data/actions/core.yaml';
  const fileContent = fs.readFileSync(yamlPath, 'utf-8');
  const parsed = yaml.load(fileContent) as { actions: Array<any> };
  const action = parsed.actions.find((a: any) => a.id === 'attack');
  if (!action) {
    throw new Error('Attack action not found in core.yaml');
  }
  return action;
}

// ===== YAML-based When/Then Steps =====

When('I load the attack action definition from YAML', function (world: QuickStrikeWorld) {
  world.attackActionDef = loadAttackActionDef();
  if (world.attackActionDef?.options?.quickStrike) {
    world.quickStrikeOption = world.attackActionDef.options.quickStrike;
  }
});

Then(
  'the attack quickStrike option should have a costModifier with time {int}',
  function (world: QuickStrikeWorld, expectedModifier: number) {
    expect(world.quickStrikeOption).toBeDefined();
    expect(world.quickStrikeOption.costModifier).toBeDefined();
    expect(world.quickStrikeOption.costModifier.time).toBe(expectedModifier);
  }
);

Then(
  'the attack quickStrike option should have cost green {int}',
  function (world: QuickStrikeWorld, greenCost: number) {
    expect(world.quickStrikeOption).toBeDefined();
    expect(world.quickStrikeOption.cost).toBeDefined();
    expect(world.quickStrikeOption.cost.green).toBe(greenCost);
  }
);

Then(
  'the attack quickStrike option should have alternativeCost windup {int}',
  function (world: QuickStrikeWorld, windupCost: number) {
    expect(world.quickStrikeOption).toBeDefined();
    expect(world.quickStrikeOption.alternativeCost).toBeDefined();
    expect(world.quickStrikeOption.alternativeCost.windup).toBe(windupCost);
  }
);

// ===== Condition-based Steps =====

Given(
  'a quickStrike modifier configured on effect {string} with light weapon condition',
  function (world: QuickStrikeWorld, modifiesId: string) {
    world.actionOptions = {};
    world.equipment = [];
    world.actionOptions['quickStrike'] = {
      modifies: modifiesId,
      modifier: { quickStrike: true },
      condition: { weaponTag: 'light' },
    } as any;
  }
);

Given(
  'a main-hand weapon {string} that grants modifier {string} with tags {string}',
  function (world: QuickStrikeWorld, weaponName: string, modifierId: string, tags: string) {
    if (!world.equipment) world.equipment = [];
    world.equipment.push({
      id: `weapon-${weaponName.toLowerCase().replace(/\s+/g, '-')}`,
      name: weaponName,
      type: 'weapon',
      slot: 'main-hand',
      grantedModifiers: [modifierId],
      tags: tags.split(',').map((t) => t.trim()),
    } as any);
  }
);

Given(
  'a main-hand weapon {string} that grants modifier {string} without light tag',
  function (world: QuickStrikeWorld, weaponName: string, modifierId: string) {
    if (!world.equipment) world.equipment = [];
    world.equipment.push({
      id: `weapon-${weaponName.toLowerCase().replace(/\s+/g, '-')}`,
      name: weaponName,
      type: 'weapon',
      slot: 'main-hand',
      grantedModifiers: [modifierId],
      tags: [],
    } as any);
  }
);

Given(
  'an accessory {string} that grants modifier {string} with tags {string}',
  function (world: QuickStrikeWorld, accessoryName: string, modifierId: string, tags: string) {
    if (!world.equipment) world.equipment = [];
    world.equipment.push({
      id: `accessory-${accessoryName.toLowerCase().replace(/\s+/g, '-')}`,
      name: accessoryName,
      type: 'item',
      slot: 'accessory',
      grantedModifiers: [modifierId],
      tags: tags.split(',').map((t) => t.trim()),
    } as any);
  }
);

When('I resolve sourced options with condition filtering', function (world: QuickStrikeWorld) {
  if (!world.actionOptions) world.actionOptions = {};
  if (!world.equipment) world.equipment = [];
  world.sourcedOptions = resolveSourcedOptions(world.actionOptions, world.equipment);
});

Then(
  'I should get {int} sourced quickStrike instance(s)',
  function (world: QuickStrikeWorld, count: number) {
    expect(world.sourcedOptions).toBeDefined();
    const instances = world.sourcedOptions!.filter((opt) => opt.optionId === 'quickStrike');
    expect(instances.length).toBe(count);
  }
);

Then(
  'quickStrike instance {int} should be sourced from {string}',
  function (world: QuickStrikeWorld, _index: number, sourceName: string) {
    expect(world.sourcedOptions).toBeDefined();
    const found = world.sourcedOptions!.some(
      (opt) => opt.optionId === 'quickStrike' && opt.source.sourceName === sourceName
    );
    expect(found).toBe(true);
  }
);

// ===== Time Cost Steps =====

When(
  'I apply quickStrike costModifier of {int} to base time cost {int}',
  async function (world: QuickStrikeWorld, modifier: number, baseCost: number) {
    // Dynamic import to fail at runtime (not load time) in RED phase
    const { applyTimeCostModifier } = await import('@src/systems/ActionCostModifier');
    world.effectiveTimeCost = applyTimeCostModifier(baseCost, modifier);
  }
);

Then(
  'the effective time cost should be {int}',
  function (world: QuickStrikeWorld, expected: number) {
    expect(world.effectiveTimeCost).toBe(expected);
  }
);
