import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { OptionChoice } from '@src/types/ParameterPrompt';
import type {
  AnimationEvent,
  AttackEvent,
  DamageEvent,
  DodgeEvent,
  GuardedEvent,
  HitEvent,
} from '@src/types/AnimationEvent';
import type { BeadCounts } from '@src/types/Beads';
import type { CombatResult } from '@src/types/Combat';
import {
  buildDefensiveOptions,
  applyDefensiveReaction,
  buildAttackEvents,
} from '@src/combat/AttackResolvers';

interface DefensiveReaction {
  type: 'guard' | 'evade' | 'dodge' | 'resist' | 'pass';
  count: number;
}

interface AttackResolversWorld extends QuickPickleWorld {
  handCounts?: BeadCounts;
  defensiveOptions?: OptionChoice[];
  defensiveReaction?: DefensiveReaction;

  // Attack events context
  attackerId?: string;
  targetId?: string;
  combatResult?: CombatResult;
  targetHealth?: number;
  targetMaxHealth?: number;
  attackPower?: number;
  attackEvents?: AnimationEvent[];
  attackEvent?: AttackEvent;
  hitEvent?: HitEvent;
  damageEvent?: DamageEvent;
  dodgeEvent?: DodgeEvent;
  guardedEvent?: GuardedEvent;
}

// Background

Given('an empty attack resolver context', function (_world: AttackResolversWorld) {
  // Just initialize an empty world - no setup needed
});

// buildDefensiveOptions Tests - Given steps

Given(
  'hand counts of red {int}, green {int}, blue {int}, white {int}',
  function (world: AttackResolversWorld, red: number, green: number, blue: number, white: number) {
    world.handCounts = { red, green, blue, white };
  }
);

// buildDefensiveOptions Tests - When steps

When('I call buildDefensiveOptions with those hand counts', function (world: AttackResolversWorld) {
  expect(world.handCounts).toBeDefined();
  world.defensiveOptions = buildDefensiveOptions(world.handCounts!);
});

// buildDefensiveOptions Tests - Then steps

Then(
  'the result should contain {int} option',
  function (world: AttackResolversWorld, count: number) {
    expect(world.defensiveOptions).toBeDefined();
    expect(world.defensiveOptions!.length).toBe(count);
  }
);

Then(
  'the result should contain {int} options',
  function (world: AttackResolversWorld, count: number) {
    expect(world.defensiveOptions).toBeDefined();
    expect(world.defensiveOptions!.length).toBe(count);
  }
);

Then(
  'option {int} should have id {string}',
  function (world: AttackResolversWorld, index: number, expectedId: string) {
    expect(world.defensiveOptions).toBeDefined();
    expect(index).toBeGreaterThan(0);
    const option = world.defensiveOptions![index - 1];
    expect(option).toBeDefined();
    expect(option.id).toBe(expectedId);
  }
);

Then(
  'the last option should have id {string}',
  function (world: AttackResolversWorld, expectedId: string) {
    expect(world.defensiveOptions).toBeDefined();
    expect(world.defensiveOptions!.length).toBeGreaterThan(0);
    const lastOption = world.defensiveOptions![world.defensiveOptions!.length - 1];
    expect(lastOption.id).toBe(expectedId);
  }
);

// applyDefensiveReaction Tests - When steps

When(
  'I call applyDefensiveReaction with id {string}',
  function (world: AttackResolversWorld, reactionId: string) {
    world.defensiveReaction = applyDefensiveReaction(reactionId);
  }
);

// applyDefensiveReaction Tests - Then steps

Then(
  'the result should have type {string}',
  function (world: AttackResolversWorld, expectedType: string) {
    expect(world.defensiveReaction).toBeDefined();
    expect(world.defensiveReaction!.type).toBe(
      expectedType as 'guard' | 'evade' | 'dodge' | 'resist' | 'pass'
    );
  }
);

Then(
  'the result should have count {int}',
  function (world: AttackResolversWorld, expectedCount: number) {
    expect(world.defensiveReaction).toBeDefined();
    expect(world.defensiveReaction!.count).toBe(expectedCount);
  }
);

// buildAttackEvents Tests - Given steps

Given(
  'attackerId {string} and targetId {string}',
  function (world: AttackResolversWorld, attackerId: string, targetId: string) {
    world.attackerId = attackerId;
    world.targetId = targetId;
  }
);

Given(
  'combatResult outcome {string} with damage {int}',
  function (world: AttackResolversWorld, outcome: string, damage: number) {
    world.combatResult = {
      outcome: outcome as 'hit' | 'dodged' | 'guarded',
      damage,
      canReact: true,
    };
  }
);

Given(
  'target health {int} with max health {int}',
  function (world: AttackResolversWorld, currentHealth: number, maxHealth: number) {
    world.targetHealth = currentHealth;
    world.targetMaxHealth = maxHealth;
  }
);

Given(
  'attack power {int} with defense reducing damage to {int}',
  function (world: AttackResolversWorld, power: number, remainingDamage: number) {
    world.attackPower = power;
    // For guarded scenario, combatResult.damage is 0 but we need power to calculate blocked
    if (world.combatResult) {
      world.combatResult.damage = remainingDamage;
    }
  }
);

// buildAttackEvents Tests - When steps

When('I call buildAttackEvents', function (world: AttackResolversWorld) {
  expect(world.attackerId).toBeDefined();
  expect(world.targetId).toBeDefined();
  expect(world.combatResult).toBeDefined();
  expect(world.targetHealth).toBeDefined();
  expect(world.targetMaxHealth).toBeDefined();

  world.attackEvents = buildAttackEvents(
    world.attackerId!,
    world.targetId!,
    world.combatResult!,
    world.targetHealth!,
    world.targetMaxHealth!,
    world.attackPower
  );

  // Populate cached event variables for direct assertions
  for (const event of world.attackEvents) {
    if (event.type === 'attack' && !world.attackEvent) {
      world.attackEvent = event as AttackEvent;
    } else if (event.type === 'hit' && !world.hitEvent) {
      world.hitEvent = event as HitEvent;
    } else if (event.type === 'damage' && !world.damageEvent) {
      world.damageEvent = event as DamageEvent;
    } else if (event.type === 'dodge' && !world.dodgeEvent) {
      world.dodgeEvent = event as DodgeEvent;
    } else if (event.type === 'guarded' && !world.guardedEvent) {
      world.guardedEvent = event as GuardedEvent;
    }
  }
});

// buildAttackEvents Tests - Then steps

Then(
  'the result should contain {int} event',
  function (world: AttackResolversWorld, count: number) {
    expect(world.attackEvents).toBeDefined();
    expect(world.attackEvents!.length).toBe(count);
  }
);

Then(
  'the result should contain {int} events',
  function (world: AttackResolversWorld, count: number) {
    expect(world.attackEvents).toBeDefined();
    expect(world.attackEvents!.length).toBe(count);
  }
);

Then(
  'event {int} should have type {string}',
  function (world: AttackResolversWorld, index: number, expectedType: string) {
    expect(world.attackEvents).toBeDefined();
    expect(index).toBeGreaterThan(0);
    const event = world.attackEvents![index - 1];
    expect(event).toBeDefined();
    expect(event.type).toBe(expectedType);

    // Cache the event for detail assertions
    if (expectedType === 'attack') {
      world.attackEvent = event as AttackEvent;
    } else if (expectedType === 'hit') {
      world.hitEvent = event as HitEvent;
    } else if (expectedType === 'damage') {
      world.damageEvent = event as DamageEvent;
    } else if (expectedType === 'dodge') {
      world.dodgeEvent = event as DodgeEvent;
    } else if (expectedType === 'guarded') {
      world.guardedEvent = event as GuardedEvent;
    }
  }
);

Then(
  'the attack event should have attackerId {string}',
  function (world: AttackResolversWorld, expectedAttackerId: string) {
    expect(world.attackEvent).toBeDefined();
    expect(world.attackEvent!.attackerId).toBe(expectedAttackerId);
  }
);

Then(
  'the attack event should have targetId {string}',
  function (world: AttackResolversWorld, expectedTargetId: string) {
    expect(world.attackEvent).toBeDefined();
    expect(world.attackEvent!.targetId).toBe(expectedTargetId);
  }
);

Then(
  'the hit event should have entityId {string}',
  function (world: AttackResolversWorld, expectedEntityId: string) {
    expect(world.hitEvent).toBeDefined();
    expect(world.hitEvent!.entityId).toBe(expectedEntityId);
  }
);

Then(
  'the hit event should have attackerId {string}',
  function (world: AttackResolversWorld, expectedAttackerId: string) {
    expect(world.hitEvent).toBeDefined();
    expect(world.hitEvent!.attackerId).toBe(expectedAttackerId);
  }
);

Then(
  'the hit event should have damage {int}',
  function (world: AttackResolversWorld, expectedDamage: number) {
    expect(world.hitEvent).toBeDefined();
    expect(world.hitEvent!.damage).toBe(expectedDamage);
  }
);

Then(
  'the damage event should have entityId {string}',
  function (world: AttackResolversWorld, expectedEntityId: string) {
    expect(world.damageEvent).toBeDefined();
    expect(world.damageEvent!.entityId).toBe(expectedEntityId);
  }
);

Then(
  'the damage event should have newHealth {int}',
  function (world: AttackResolversWorld, expectedHealth: number) {
    expect(world.damageEvent).toBeDefined();
    expect(world.damageEvent!.newHealth).toBe(expectedHealth);
  }
);

Then(
  'the damage event should have maxHealth {int}',
  function (world: AttackResolversWorld, expectedMaxHealth: number) {
    expect(world.damageEvent).toBeDefined();
    expect(world.damageEvent!.maxHealth).toBe(expectedMaxHealth);
  }
);

Then(
  'the dodge event should have entityId {string}',
  function (world: AttackResolversWorld, expectedEntityId: string) {
    expect(world.dodgeEvent).toBeDefined();
    expect(world.dodgeEvent!.entityId).toBe(expectedEntityId);
  }
);

Then(
  'the dodge event should have attackerId {string}',
  function (world: AttackResolversWorld, expectedAttackerId: string) {
    expect(world.dodgeEvent).toBeDefined();
    expect(world.dodgeEvent!.attackerId).toBe(expectedAttackerId);
  }
);

Then(
  'the guarded event should have entityId {string}',
  function (world: AttackResolversWorld, expectedEntityId: string) {
    expect(world.guardedEvent).toBeDefined();
    expect(world.guardedEvent!.entityId).toBe(expectedEntityId);
  }
);

Then(
  'the guarded event should have attackerId {string}',
  function (world: AttackResolversWorld, expectedAttackerId: string) {
    expect(world.guardedEvent).toBeDefined();
    expect(world.guardedEvent!.attackerId).toBe(expectedAttackerId);
  }
);

Then(
  'the guarded event should have blockedDamage {int}',
  function (world: AttackResolversWorld, expectedBlockedDamage: number) {
    expect(world.guardedEvent).toBeDefined();
    expect(world.guardedEvent!.blockedDamage).toBe(expectedBlockedDamage);
  }
);
