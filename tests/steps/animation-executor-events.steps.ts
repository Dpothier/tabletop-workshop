import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import { vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { DamageEvent, RestEvent, BeadDrawEvent } from '@src/types/AnimationEvent';
import type { BeadCounts, BeadColor } from '@src/types/Beads';
import type { UIStateSubscriber } from '@src/types/UIStateEvents';
import { AnimationExecutor } from '@src/ui/AnimationExecutor';

/**
 * Tracks emitted events for assertion in tests
 */
interface EventTracker {
  heroHealthChanged: Array<{ heroId: string; current: number; max: number }>;
  heroBeadsChanged: Array<{ heroId: string; counts: BeadCounts }>;
  monsterHealthChanged: Array<{ current: number; max: number }>;
  monsterBeadsChanged: Array<BeadCounts | null>;
}

function createEventTracker(): EventTracker {
  return {
    heroHealthChanged: [],
    heroBeadsChanged: [],
    monsterHealthChanged: [],
    monsterBeadsChanged: [],
  };
}

/**
 * Mock BattleStateObserver for testing
 * Implements the event emitter pattern with subscription support
 */
class MockBattleStateObserver {
  private subscribers: Map<number, UIStateSubscriber> = new Map();
  private nextSubscriberId = 0;

  subscribe(subscriber: UIStateSubscriber): number {
    const id = this.nextSubscriberId++;
    this.subscribers.set(id, subscriber);
    return id;
  }

  unsubscribe(subscriberId: number): void {
    this.subscribers.delete(subscriberId);
  }

  emitActorChanged(_actorId: string | null): void {
    // Not used in these tests
  }

  emitSelectionChanged(_characterId: string | null): void {
    // Not used in these tests
  }

  emitWheelAdvanced(_entityId: string, _newPosition: number): void {
    // Not used in these tests
  }

  emitHeroHealthChanged(heroId: string, current: number, max: number): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.heroHealthChanged) {
        subscriber.heroHealthChanged(heroId, current, max);
      }
    }
  }

  emitHeroBeadsChanged(heroId: string, counts: BeadCounts): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.heroBeadsChanged) {
        subscriber.heroBeadsChanged(heroId, counts);
      }
    }
  }

  emitMonsterHealthChanged(current: number, max: number): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.monsterHealthChanged) {
        subscriber.monsterHealthChanged(current, max);
      }
    }
  }

  emitMonsterBeadsChanged(counts: BeadCounts | null): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.monsterBeadsChanged) {
        subscriber.monsterBeadsChanged(counts);
      }
    }
  }
}

interface AnimationExecutorWorld extends QuickPickleWorld {
  executor?: AnimationExecutor;
  observer?: MockBattleStateObserver;
  tracker?: EventTracker;
  subscriberId?: number;
  heroBeadCounts?: Map<string, BeadCounts>;
  monsterDiscardedCounts?: BeadCounts | null;
  characterVisualsMock?: Map<string, any>;
  monsterVisualMock?: any;
  gridSystemMock?: any;
  battleUIMock?: any;
}

// Given steps

Given(
  'an animation executor with a battle state observer',
  function (world: AnimationExecutorWorld) {
    world.observer = new MockBattleStateObserver();

    // Create mock dependencies
    world.gridSystemMock = {
      gridToWorld: (val: number) => val * 10,
    };

    world.characterVisualsMock = new Map();

    // Add mock character visuals for heroes
    for (let i = 0; i <= 3; i++) {
      world.characterVisualsMock.set(`hero-${i}`, {
        animateHealthChange: vi.fn().mockResolvedValue(undefined),
        animateDamage: vi.fn().mockResolvedValue(undefined),
        animateToPosition: vi.fn().mockResolvedValue(undefined),
        animateRest: vi.fn().mockResolvedValue(undefined),
        getClassName: vi.fn().mockReturnValue(`Hero${i}`),
      });
    }

    world.monsterVisualMock = {
      animateBeadDraw: vi.fn().mockResolvedValue(undefined),
      animateStateChange: vi.fn().mockResolvedValue(undefined),
      animateHealthChange: vi.fn().mockResolvedValue(undefined),
      animateDamage: vi.fn().mockResolvedValue(undefined),
      getMonsterName: vi.fn().mockReturnValue('Monster'),
    };

    world.battleUIMock = {
      log: vi.fn(),
    };

    // Create the executor with the observer (cast to any to avoid private property type mismatch)
    world.executor = new AnimationExecutor(
      world.gridSystemMock,
      world.characterVisualsMock,
      world.monsterVisualMock,
      world.battleUIMock,
      world.observer as any,
      {
        getHeroBeadCounts: (heroId: string) => world.heroBeadCounts?.get(heroId),
        getMonsterDiscardedCounts: () => world.monsterDiscardedCounts ?? null,
      }
    );

    world.heroBeadCounts = new Map();
    world.monsterDiscardedCounts = null;
  }
);

Given(
  'a subscriber listening to monsterHealthChanged events',
  function (world: AnimationExecutorWorld) {
    world.tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      monsterHealthChanged: (current: number, max: number) => {
        world.tracker!.monsterHealthChanged.push({ current, max });
      },
    };
    world.subscriberId = world.observer!.subscribe(subscriber);
  }
);

Given(
  'a subscriber listening to heroHealthChanged events',
  function (world: AnimationExecutorWorld) {
    world.tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      heroHealthChanged: (heroId: string, current: number, max: number) => {
        world.tracker!.heroHealthChanged.push({ heroId, current, max });
      },
    };
    world.subscriberId = world.observer!.subscribe(subscriber);
  }
);

Given(
  'a subscriber listening to heroBeadsChanged events',
  function (world: AnimationExecutorWorld) {
    world.tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      heroBeadsChanged: (heroId: string, counts: BeadCounts) => {
        world.tracker!.heroBeadsChanged.push({ heroId, counts });
      },
    };
    world.subscriberId = world.observer!.subscribe(subscriber);
  }
);

Given(
  'a subscriber listening to monsterBeadsChanged events',
  function (world: AnimationExecutorWorld) {
    world.tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      monsterBeadsChanged: (counts: BeadCounts | null) => {
        world.tracker!.monsterBeadsChanged.push(counts);
      },
    };
    world.subscriberId = world.observer!.subscribe(subscriber);
  }
);

Given(
  'a subscriber listening to monsterHealthChanged and heroHealthChanged events',
  function (world: AnimationExecutorWorld) {
    world.tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      monsterHealthChanged: (current: number, max: number) => {
        world.tracker!.monsterHealthChanged.push({ current, max });
      },
      heroHealthChanged: (heroId: string, current: number, max: number) => {
        world.tracker!.heroHealthChanged.push({ heroId, current, max });
      },
    };
    world.subscriberId = world.observer!.subscribe(subscriber);
  }
);

Given('a subscriber listening to all UI state events', function (world: AnimationExecutorWorld) {
  world.tracker = createEventTracker();
  const subscriber: UIStateSubscriber = {
    heroHealthChanged: (heroId: string, current: number, max: number) => {
      world.tracker!.heroHealthChanged.push({ heroId, current, max });
    },
    heroBeadsChanged: (heroId: string, counts: BeadCounts) => {
      world.tracker!.heroBeadsChanged.push({ heroId, counts });
    },
    monsterHealthChanged: (current: number, max: number) => {
      world.tracker!.monsterHealthChanged.push({ current, max });
    },
    monsterBeadsChanged: (counts: BeadCounts | null) => {
      world.tracker!.monsterBeadsChanged.push(counts);
    },
  };
  world.subscriberId = world.observer!.subscribe(subscriber);
});

Given(
  'a character with bead counts red={int} blue={int} green={int} white={int}',
  function (
    world: AnimationExecutorWorld,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    const counts: BeadCounts = { red, blue, green, white };
    world.heroBeadCounts!.set('hero-1', counts);
  }
);

Given(
  'hero-{int} has bead counts red={int} blue={int} green={int} white={int}',
  function (
    world: AnimationExecutorWorld,
    heroNum: number,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    const heroId = `hero-${heroNum}`;
    const counts: BeadCounts = { red, blue, green, white };
    world.heroBeadCounts!.set(heroId, counts);
  }
);

Given(
  'the monster has discarded bead counts red={int} blue={int} green={int} white={int}',
  function (
    world: AnimationExecutorWorld,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    world.monsterDiscardedCounts = { red, blue, green, white };
  }
);

// When steps

When(
  'the executor processes a damage event for monster with health {int} out of {int}',
  async function (world: AnimationExecutorWorld, newHealth: number, maxHealth: number) {
    const event: DamageEvent = {
      type: 'damage',
      entityId: 'monster',
      newHealth,
      maxHealth,
    };
    await world.executor!.execute([event]);
  }
);

When(
  'the executor processes a damage event for hero-{int} with health {int} out of {int}',
  async function (
    world: AnimationExecutorWorld,
    heroNum: number,
    newHealth: number,
    maxHealth: number
  ) {
    const event: DamageEvent = {
      type: 'damage',
      entityId: `hero-${heroNum}`,
      newHealth,
      maxHealth,
    };
    await world.executor!.execute([event]);
  }
);

When(
  'the executor processes a rest event for hero-{int} with beads drawn',
  async function (world: AnimationExecutorWorld, heroNum: number) {
    const heroId = `hero-${heroNum}`;
    const event: RestEvent = {
      type: 'rest',
      entityId: heroId,
      beadsDrawn: ['red'],
    };
    await world.executor!.execute([event]);
  }
);

When('the executor processes a beadDraw event', async function (world: AnimationExecutorWorld) {
  const event: BeadDrawEvent = {
    type: 'beadDraw',
    color: 'red' as BeadColor,
  };
  await world.executor!.execute([event]);
});

When(
  'the executor processes a move event for hero-{int}',
  async function (world: AnimationExecutorWorld, heroNum: number) {
    const heroId = `hero-${heroNum}`;
    // Don't overwrite existing mock - it already has all needed methods from setup

    const event = {
      type: 'move' as const,
      entityId: heroId,
      from: { x: 0, y: 0 },
      to: { x: 1, y: 1 },
    };
    await world.executor!.execute([event]);
  }
);

When('the executor processes an attack event', async function (world: AnimationExecutorWorld) {
  // Create a mock visual for the target
  const targetId = 'hero-1';
  if (!world.characterVisualsMock!.has(targetId)) {
    world.characterVisualsMock!.set(targetId, {
      animateDamage: vi.fn().mockResolvedValue(undefined),
      getClassName: vi.fn().mockReturnValue('Warrior'),
    });
  }

  const event = {
    type: 'attack' as const,
    attackerId: 'monster',
    targetId,
    damage: 5,
  };
  await world.executor!.execute([event]);
});

When('the executor processes a stateChange event', async function (world: AnimationExecutorWorld) {
  const event = {
    type: 'stateChange' as const,
    fromState: 'idle',
    toState: 'attacking',
  };
  await world.executor!.execute([event]);
});

// Then steps

Then(
  'the subscriber should receive a monsterHealthChanged event with health {int} and max {int}',
  function (world: AnimationExecutorWorld, expectedCurrent: number, expectedMax: number) {
    expect(world.tracker).toBeDefined();
    expect(world.tracker!.monsterHealthChanged).toContainEqual({
      current: expectedCurrent,
      max: expectedMax,
    });
  }
);

Then(
  'the subscriber should receive a heroHealthChanged event for hero-{int} with health {int} and max {int}',
  function (
    world: AnimationExecutorWorld,
    heroNum: number,
    expectedCurrent: number,
    expectedMax: number
  ) {
    expect(world.tracker).toBeDefined();
    expect(world.tracker!.heroHealthChanged).toContainEqual({
      heroId: `hero-${heroNum}`,
      current: expectedCurrent,
      max: expectedMax,
    });
  }
);

Then(
  'the subscriber should receive a heroBeadsChanged event for hero-{int} with beads red={int} blue={int} green={int} white={int}',
  function (
    world: AnimationExecutorWorld,
    heroNum: number,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    expect(world.tracker).toBeDefined();
    const expectedCounts: BeadCounts = { red, blue, green, white };
    expect(world.tracker!.heroBeadsChanged).toContainEqual({
      heroId: `hero-${heroNum}`,
      counts: expectedCounts,
    });
  }
);

Then(
  'the subscriber should receive a monsterBeadsChanged event with beads red={int} blue={int} green={int} white={int}',
  function (
    world: AnimationExecutorWorld,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    expect(world.tracker).toBeDefined();
    const expectedCounts: BeadCounts = { red, blue, green, white };
    expect(world.tracker!.monsterBeadsChanged).toContainEqual(expectedCounts);
  }
);

Then(
  'the subscriber should receive {int} monsterBeadsChanged events',
  function (world: AnimationExecutorWorld, expectedCount: number) {
    expect(world.tracker).toBeDefined();
    expect(world.tracker!.monsterBeadsChanged).toHaveLength(expectedCount);
  }
);

Then(
  'the subscriber should not receive any state change events',
  function (world: AnimationExecutorWorld) {
    expect(world.tracker).toBeDefined();
    expect(world.tracker!.heroHealthChanged).toHaveLength(0);
    expect(world.tracker!.heroBeadsChanged).toHaveLength(0);
    expect(world.tracker!.monsterHealthChanged).toHaveLength(0);
    expect(world.tracker!.monsterBeadsChanged).toHaveLength(0);
  }
);

Then(
  'the subscriber should receive exactly {int} state change events',
  function (world: AnimationExecutorWorld, expectedCount: number) {
    expect(world.tracker).toBeDefined();
    const totalEvents =
      world.tracker!.heroHealthChanged.length +
      world.tracker!.heroBeadsChanged.length +
      world.tracker!.monsterHealthChanged.length +
      world.tracker!.monsterBeadsChanged.length;
    expect(totalEvents).toBe(expectedCount);
  }
);
