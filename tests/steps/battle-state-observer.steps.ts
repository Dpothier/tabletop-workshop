import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { BeadCounts } from '@src/types/Beads';
import type { UIStateSubscriber } from '@src/types/UIStateEvents';

/**
 * Tracks emitted events for assertion in tests
 */
interface EventTracker {
  actorChanged: Array<string | null>;
  selectionChanged: Array<string | null>;
  wheelAdvanced: Array<{ entityId: string; newPosition: number }>;
  heroHealthChanged: Array<{ heroId: string; current: number; max: number }>;
  heroBeadsChanged: Array<{ heroId: string; counts: BeadCounts }>;
  monsterHealthChanged: Array<{ current: number; max: number }>;
  monsterBeadsChanged: Array<BeadCounts | null>;
}

function createEventTracker(): EventTracker {
  return {
    actorChanged: [],
    selectionChanged: [],
    wheelAdvanced: [],
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

  /**
   * Subscribe to state changes
   */
  subscribe(subscriber: UIStateSubscriber): number {
    const id = this.nextSubscriberId++;
    this.subscribers.set(id, subscriber);
    return id;
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(subscriberId: number): void {
    this.subscribers.delete(subscriberId);
  }

  /**
   * Emit actorChanged event to all subscribers
   */
  emitActorChanged(actorId: string | null): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.actorChanged) {
        subscriber.actorChanged(actorId);
      }
    }
  }

  /**
   * Emit selectionChanged event to all subscribers
   */
  emitSelectionChanged(characterId: string | null): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.selectionChanged) {
        subscriber.selectionChanged(characterId);
      }
    }
  }

  /**
   * Emit wheelAdvanced event to all subscribers
   */
  emitWheelAdvanced(entityId: string, newPosition: number): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.wheelAdvanced) {
        subscriber.wheelAdvanced(entityId, newPosition);
      }
    }
  }

  /**
   * Emit heroHealthChanged event to all subscribers
   */
  emitHeroHealthChanged(heroId: string, current: number, max: number): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.heroHealthChanged) {
        subscriber.heroHealthChanged(heroId, current, max);
      }
    }
  }

  /**
   * Emit heroBeadsChanged event to all subscribers
   */
  emitHeroBeadsChanged(heroId: string, counts: BeadCounts): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.heroBeadsChanged) {
        subscriber.heroBeadsChanged(heroId, counts);
      }
    }
  }

  /**
   * Emit monsterHealthChanged event to all subscribers
   */
  emitMonsterHealthChanged(current: number, max: number): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.monsterHealthChanged) {
        subscriber.monsterHealthChanged(current, max);
      }
    }
  }

  /**
   * Emit monsterBeadsChanged event to all subscribers
   */
  emitMonsterBeadsChanged(counts: BeadCounts | null): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.monsterBeadsChanged) {
        subscriber.monsterBeadsChanged(counts);
      }
    }
  }
}

interface BattleStateObserverWorld extends QuickPickleWorld {
  observer?: MockBattleStateObserver;
  subscribers?: Map<number | string, { tracker: EventTracker; id: number }>;
  currentSubscriber?: number | string;
}

// Given steps

Given('a battle state observer', function (world: BattleStateObserverWorld) {
  world.observer = new MockBattleStateObserver();
  world.subscribers = new Map();
});

Given('I have subscribed to actorChanged events', function (world: BattleStateObserverWorld) {
  const tracker = createEventTracker();
  const subscriber: UIStateSubscriber = {
    actorChanged: (actorId: string | null) => {
      tracker.actorChanged.push(actorId);
    },
  };
  const subscriberId = world.observer!.subscribe(subscriber);
  world.subscribers!.set('default', { tracker, id: subscriberId });
  world.currentSubscriber = 'default';
});

Given(
  'I have subscribed to actorChanged events as subscriber {int}',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      actorChanged: (actorId: string | null) => {
        tracker.actorChanged.push(actorId);
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set(`subscriber${subscriberNum}`, { tracker, id: subscriberId });
  }
);

Given('I have subscribed to selectionChanged events', function (world: BattleStateObserverWorld) {
  const tracker = createEventTracker();
  const subscriber: UIStateSubscriber = {
    selectionChanged: (characterId: string | null) => {
      tracker.selectionChanged.push(characterId);
    },
  };
  const subscriberId = world.observer!.subscribe(subscriber);
  world.subscribers!.set('default', { tracker, id: subscriberId });
  world.currentSubscriber = 'default';
});

Given(
  'I have subscribed to selectionChanged events as subscriber {int}',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      selectionChanged: (characterId: string | null) => {
        tracker.selectionChanged.push(characterId);
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set(`subscriber${subscriberNum}`, { tracker, id: subscriberId });
  }
);

Given('I have subscribed to wheelAdvanced events', function (world: BattleStateObserverWorld) {
  const tracker = createEventTracker();
  const subscriber: UIStateSubscriber = {
    wheelAdvanced: (entityId: string, newPosition: number) => {
      tracker.wheelAdvanced.push({ entityId, newPosition });
    },
  };
  const subscriberId = world.observer!.subscribe(subscriber);
  world.subscribers!.set('default', { tracker, id: subscriberId });
  world.currentSubscriber = 'default';
});

Given(
  'I have subscribed to wheelAdvanced events as subscriber {int}',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      wheelAdvanced: (entityId: string, newPosition: number) => {
        tracker.wheelAdvanced.push({ entityId, newPosition });
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set(`subscriber${subscriberNum}`, { tracker, id: subscriberId });
  }
);

Given('I have subscribed to heroHealthChanged events', function (world: BattleStateObserverWorld) {
  const tracker = createEventTracker();
  const subscriber: UIStateSubscriber = {
    heroHealthChanged: (heroId: string, current: number, max: number) => {
      tracker.heroHealthChanged.push({ heroId, current, max });
    },
  };
  const subscriberId = world.observer!.subscribe(subscriber);
  world.subscribers!.set('default', { tracker, id: subscriberId });
  world.currentSubscriber = 'default';
});

Given(
  'I have subscribed to heroHealthChanged events as subscriber {int}',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      heroHealthChanged: (heroId: string, current: number, max: number) => {
        tracker.heroHealthChanged.push({ heroId, current, max });
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set(`subscriber${subscriberNum}`, { tracker, id: subscriberId });
  }
);

Given('I have subscribed to heroBeadsChanged events', function (world: BattleStateObserverWorld) {
  const tracker = createEventTracker();
  const subscriber: UIStateSubscriber = {
    heroBeadsChanged: (heroId: string, counts: BeadCounts) => {
      tracker.heroBeadsChanged.push({ heroId, counts });
    },
  };
  const subscriberId = world.observer!.subscribe(subscriber);
  world.subscribers!.set('default', { tracker, id: subscriberId });
  world.currentSubscriber = 'default';
});

Given(
  'I have subscribed to heroBeadsChanged events as subscriber {int}',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      heroBeadsChanged: (heroId: string, counts: BeadCounts) => {
        tracker.heroBeadsChanged.push({ heroId, counts });
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set(`subscriber${subscriberNum}`, { tracker, id: subscriberId });
  }
);

Given(
  'I have subscribed to monsterHealthChanged events',
  function (world: BattleStateObserverWorld) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      monsterHealthChanged: (current: number, max: number) => {
        tracker.monsterHealthChanged.push({ current, max });
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set('default', { tracker, id: subscriberId });
    world.currentSubscriber = 'default';
  }
);

Given(
  'I have subscribed to monsterBeadsChanged events',
  function (world: BattleStateObserverWorld) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      monsterBeadsChanged: (counts: BeadCounts | null) => {
        tracker.monsterBeadsChanged.push(counts);
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set('default', { tracker, id: subscriberId });
    world.currentSubscriber = 'default';
  }
);

Given(
  'I have subscribed to actorChanged and selectionChanged events',
  function (world: BattleStateObserverWorld) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      actorChanged: (actorId: string | null) => {
        tracker.actorChanged.push(actorId);
      },
      selectionChanged: (characterId: string | null) => {
        tracker.selectionChanged.push(characterId);
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set('default', { tracker, id: subscriberId });
    world.currentSubscriber = 'default';
  }
);

Given(
  'subscriber {int} subscribes to actorChanged and wheelAdvanced events',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      actorChanged: (actorId: string | null) => {
        tracker.actorChanged.push(actorId);
      },
      wheelAdvanced: (entityId: string, newPosition: number) => {
        tracker.wheelAdvanced.push({ entityId, newPosition });
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set(`subscriber${subscriberNum}`, { tracker, id: subscriberId });
  }
);

Given(
  'subscriber {int} subscribes to heroHealthChanged events',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const tracker = createEventTracker();
    const subscriber: UIStateSubscriber = {
      heroHealthChanged: (heroId: string, current: number, max: number) => {
        tracker.heroHealthChanged.push({ heroId, current, max });
      },
    };
    const subscriberId = world.observer!.subscribe(subscriber);
    world.subscribers!.set(`subscriber${subscriberNum}`, { tracker, id: subscriberId });
  }
);

// When steps

When(
  'the current actor changes to {string}',
  function (world: BattleStateObserverWorld, actorId: string) {
    world.observer!.emitActorChanged(actorId);
  }
);

When('the current actor changes to null', function (world: BattleStateObserverWorld) {
  world.observer!.emitActorChanged(null);
});

When(
  'a character {string} is selected',
  function (world: BattleStateObserverWorld, characterId: string) {
    world.observer!.emitSelectionChanged(characterId);
  }
);

When(
  'entity {string} advances on the wheel to position {int}',
  function (world: BattleStateObserverWorld, entityId: string, position: number) {
    world.observer!.emitWheelAdvanced(entityId, position);
  }
);

When(
  'hero {string} health changes to current {int} and max {int}',
  function (world: BattleStateObserverWorld, heroId: string, current: number, max: number) {
    world.observer!.emitHeroHealthChanged(heroId, current, max);
  }
);

When(
  'a monster health changes to current {int} and max {int}',
  function (world: BattleStateObserverWorld, current: number, max: number) {
    world.observer!.emitMonsterHealthChanged(current, max);
  }
);

When(
  'hero {string} beads change to red {int}, blue {int}, green {int}, white {int}',
  function (
    world: BattleStateObserverWorld,
    heroId: string,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    const counts: BeadCounts = { red, blue, green, white };
    world.observer!.emitHeroBeadsChanged(heroId, counts);
  }
);

When(
  'monster beads change to red {int}, blue {int}, green {int}, white {int}',
  function (
    world: BattleStateObserverWorld,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    const counts: BeadCounts = { red, blue, green, white };
    world.observer!.emitMonsterBeadsChanged(counts);
  }
);

When('monster beads change to null', function (world: BattleStateObserverWorld) {
  world.observer!.emitMonsterBeadsChanged(null);
});

When('I unsubscribe from actorChanged events', function (world: BattleStateObserverWorld) {
  const subscriberData = world.subscribers!.get('default');
  if (subscriberData) {
    world.observer!.unsubscribe(subscriberData.id);
  }
});

When(
  'I unsubscribe subscriber {int} from actorChanged events',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const subscriberData = world.subscribers!.get(`subscriber${subscriberNum}`);
    if (subscriberData) {
      world.observer!.unsubscribe(subscriberData.id);
    }
  }
);

// Then steps

Then(
  'I should receive an actorChanged event for {string}',
  function (world: BattleStateObserverWorld, expectedActorId: string) {
    const subscriberData = world.subscribers!.get('default');
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.actorChanged).toContain(expectedActorId);
  }
);

Then('I should receive an actorChanged event for null', function (world: BattleStateObserverWorld) {
  const subscriberData = world.subscribers!.get('default');
  expect(subscriberData).toBeDefined();
  expect(subscriberData!.tracker.actorChanged).toContain(null);
});

Then(
  'subscriber {int} should receive an actorChanged event for {string}',
  function (world: BattleStateObserverWorld, subscriberNum: number, expectedActorId: string) {
    const subscriberData = world.subscribers!.get(`subscriber${subscriberNum}`);
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.actorChanged).toContain(expectedActorId);
  }
);

Then(
  'I should receive a selectionChanged event for {string}',
  function (world: BattleStateObserverWorld, expectedCharacterId: string) {
    const subscriberData = world.subscribers!.get('default');
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.selectionChanged).toContain(expectedCharacterId);
  }
);

Then(
  'subscriber {int} should receive a selectionChanged event for {string}',
  function (world: BattleStateObserverWorld, subscriberNum: number, expectedCharacterId: string) {
    const subscriberData = world.subscribers!.get(`subscriber${subscriberNum}`);
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.selectionChanged).toContain(expectedCharacterId);
  }
);

Then(
  'I should receive a wheelAdvanced event for entity {string} at position {int}',
  function (world: BattleStateObserverWorld, expectedEntityId: string, expectedPosition: number) {
    const subscriberData = world.subscribers!.get('default');
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.wheelAdvanced).toContainEqual({
      entityId: expectedEntityId,
      newPosition: expectedPosition,
    });
  }
);

Then(
  'subscriber {int} should receive a wheelAdvanced event for entity {string} at position {int}',
  function (
    world: BattleStateObserverWorld,
    subscriberNum: number,
    expectedEntityId: string,
    expectedPosition: number
  ) {
    const subscriberData = world.subscribers!.get(`subscriber${subscriberNum}`);
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.wheelAdvanced).toContainEqual({
      entityId: expectedEntityId,
      newPosition: expectedPosition,
    });
  }
);

Then(
  'I should receive a heroHealthChanged event for hero {string} with health {int} out of {int}',
  function (world: BattleStateObserverWorld, expectedHeroId: string, current: number, max: number) {
    const subscriberData = world.subscribers!.get('default');
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.heroHealthChanged).toContainEqual({
      heroId: expectedHeroId,
      current,
      max,
    });
  }
);

Then(
  'subscriber {int} should receive a heroHealthChanged event for hero {string} with health {int} out of {int}',
  function (
    world: BattleStateObserverWorld,
    subscriberNum: number,
    expectedHeroId: string,
    current: number,
    max: number
  ) {
    const subscriberData = world.subscribers!.get(`subscriber${subscriberNum}`);
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.heroHealthChanged).toContainEqual({
      heroId: expectedHeroId,
      current,
      max,
    });
  }
);

Then(
  'I should receive a heroBeadsChanged event for hero {string} with beads red={int} blue={int} green={int} white={int}',
  function (
    world: BattleStateObserverWorld,
    expectedHeroId: string,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    const subscriberData = world.subscribers!.get('default');
    expect(subscriberData).toBeDefined();
    const expectedCounts: BeadCounts = { red, blue, green, white };
    expect(subscriberData!.tracker.heroBeadsChanged).toContainEqual({
      heroId: expectedHeroId,
      counts: expectedCounts,
    });
  }
);

Then(
  'I should receive a monsterBeadsChanged event with beads red={int} blue={int} green={int} white={int}',
  function (
    world: BattleStateObserverWorld,
    red: number,
    blue: number,
    green: number,
    white: number
  ) {
    const subscriberData = world.subscribers!.get('default');
    expect(subscriberData).toBeDefined();
    const expectedCounts: BeadCounts = { red, blue, green, white };
    expect(subscriberData!.tracker.monsterBeadsChanged).toContainEqual(expectedCounts);
  }
);

Then(
  'I should receive a monsterBeadsChanged event with null beads',
  function (world: BattleStateObserverWorld) {
    const subscriberData = world.subscribers!.get('default');
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.monsterBeadsChanged).toContain(null);
  }
);

Then('I should not receive a selectionChanged event', function (world: BattleStateObserverWorld) {
  const subscriberData = world.subscribers!.get('default');
  expect(subscriberData).toBeDefined();
  expect(subscriberData!.tracker.selectionChanged).toHaveLength(0);
});

Then('I should not receive an actorChanged event', function (world: BattleStateObserverWorld) {
  const subscriberData = world.subscribers!.get('default');
  expect(subscriberData).toBeDefined();
  expect(subscriberData!.tracker.actorChanged).toHaveLength(0);
});

Then(
  'I should not receive a monsterHealthChanged event',
  function (world: BattleStateObserverWorld) {
    const subscriberData = world.subscribers!.get('default');
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.monsterHealthChanged).toHaveLength(0);
  }
);

Then(
  'subscriber {int} should not receive a heroHealthChanged event',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const subscriberData = world.subscribers!.get(`subscriber${subscriberNum}`);
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.heroHealthChanged).toHaveLength(0);
  }
);

Then(
  'subscriber {int} should not receive an actorChanged event',
  function (world: BattleStateObserverWorld, subscriberNum: number) {
    const subscriberData = world.subscribers!.get(`subscriber${subscriberNum}`);
    expect(subscriberData).toBeDefined();
    expect(subscriberData!.tracker.actorChanged).toHaveLength(0);
  }
);
