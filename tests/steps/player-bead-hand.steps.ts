import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { PlayerBeadHand } from '@src/systems/PlayerBeadHand';
import type { BeadColor, BeadCounts } from '@src/systems/BeadBag';

interface PlayerBeadHandWorld extends QuickPickleWorld {
  beadHand?: PlayerBeadHand;
  drawnBeads?: BeadColor[];
  randomSequence?: number[];
  randomIndex?: number;
  error?: Error;
  spendResult?: boolean;
  reshuffleCount?: number;
}

function createRandomFn(world: PlayerBeadHandWorld): () => number {
  if (world.randomSequence) {
    world.randomIndex = 0;
    return () => {
      const value = world.randomSequence![world.randomIndex! % world.randomSequence!.length];
      world.randomIndex!++;
      return value;
    };
  }
  return Math.random;
}

// Initialization
Given('a player bead hand with default beads', function (world: PlayerBeadHandWorld) {
  const randomFn = createRandomFn(world);
  world.beadHand = new PlayerBeadHand(undefined, randomFn);
  world.drawnBeads = [];
  world.reshuffleCount = 0;
});

Given(
  'a player bead hand with {int} red, {int} blue, {int} green, {int} white beads',
  function (world: PlayerBeadHandWorld, red: number, blue: number, green: number, white: number) {
    const counts: BeadCounts = { red, blue, green, white };
    const randomFn = createRandomFn(world);
    world.beadHand = new PlayerBeadHand(counts, randomFn);
    world.drawnBeads = [];
    world.reshuffleCount = 0;
  }
);

When(
  'I try to create a player bead hand with {int} red, {int} blue, {int} green, {int} white beads',
  function (world: PlayerBeadHandWorld, red: number, blue: number, green: number, white: number) {
    try {
      const counts: BeadCounts = { red, blue, green, white };
      world.beadHand = new PlayerBeadHand(counts);
    } catch (e) {
      world.error = e as Error;
    }
  }
);

// Random function setup (must be done before creating the hand, so recreate if needed)
Given('hand random function returns {float}', function (world: PlayerBeadHandWorld, value: number) {
  world.randomSequence = [value];
  // Recreate hand with new random function if it exists
  if (world.beadHand) {
    const bagCounts = world.beadHand.getBagCounts();
    const handCounts = world.beadHand.getHandCounts();
    const discardCounts = world.beadHand.getDiscardedCounts();
    // Calculate original counts
    const original: BeadCounts = {
      red: bagCounts.red + handCounts.red + discardCounts.red,
      blue: bagCounts.blue + handCounts.blue + discardCounts.blue,
      green: bagCounts.green + handCounts.green + discardCounts.green,
      white: bagCounts.white + handCounts.white + discardCounts.white,
    };
    world.beadHand = new PlayerBeadHand(original, createRandomFn(world));
    world.drawnBeads = [];
  }
});

Given(
  'hand random function returns sequence {string}',
  function (world: PlayerBeadHandWorld, sequenceStr: string) {
    const cleaned = sequenceStr.replace(/[[\]"]/g, '');
    world.randomSequence = cleaned.split(',').map((s) => parseFloat(s.trim()));
    // Recreate hand with new random function if it exists
    if (world.beadHand) {
      const bagCounts = world.beadHand.getBagCounts();
      const handCounts = world.beadHand.getHandCounts();
      const discardCounts = world.beadHand.getDiscardedCounts();
      const original: BeadCounts = {
        red: bagCounts.red + handCounts.red + discardCounts.red,
        blue: bagCounts.blue + handCounts.blue + discardCounts.blue,
        green: bagCounts.green + handCounts.green + discardCounts.green,
        white: bagCounts.white + handCounts.white + discardCounts.white,
      };
      world.beadHand = new PlayerBeadHand(original, createRandomFn(world));
      world.drawnBeads = [];
    }
  }
);

// Draw actions
When('I draw {int} bead(s) to hand', function (world: PlayerBeadHandWorld, count: number) {
  const beforeBagTotal = world.beadHand!.getBagTotal();
  const drawn = world.beadHand!.drawToHand(count);
  world.drawnBeads!.push(...drawn);

  // Check if reshuffle occurred (bag was empty before draw completed)
  if (beforeBagTotal < count) {
    world.reshuffleCount = (world.reshuffleCount || 0) + 1;
  }
});

// Spend actions
When('I spend a {string} bead', function (world: PlayerBeadHandWorld, color: string) {
  world.spendResult = world.beadHand!.spend(color as BeadColor);
});

// Bag total assertions
Then(
  'the bag should have {int} total beads',
  function (world: PlayerBeadHandWorld, expected: number) {
    expect(world.beadHand!.getBagTotal()).toBe(expected);
  }
);

Then(
  'the bag should have {int} red, {int} blue, {int} green, {int} white beads',
  function (world: PlayerBeadHandWorld, red: number, blue: number, green: number, white: number) {
    const counts = world.beadHand!.getBagCounts();
    expect(counts.red).toBe(red);
    expect(counts.blue).toBe(blue);
    expect(counts.green).toBe(green);
    expect(counts.white).toBe(white);
  }
);

// Hand assertions
Then('the hand should have {int} bead(s)', function (world: PlayerBeadHandWorld, expected: number) {
  expect(world.beadHand!.getHandTotal()).toBe(expected);
});

Then('all drawn beads should be {string}', function (world: PlayerBeadHandWorld, color: string) {
  for (const bead of world.drawnBeads!) {
    expect(bead).toBe(color);
  }
});

Then(
  'the drawn beads should include {string} and {string}',
  function (world: PlayerBeadHandWorld, color1: string, color2: string) {
    expect(world.drawnBeads).toContain(color1);
    expect(world.drawnBeads).toContain(color2);
  }
);

// Spend result assertions
Then('the spend should succeed', function (world: PlayerBeadHandWorld) {
  expect(world.spendResult).toBe(true);
});

Then('the spend should fail', function (world: PlayerBeadHandWorld) {
  expect(world.spendResult).toBe(false);
});

// Discard assertions
Then(
  'player discarded red should be {int}',
  function (world: PlayerBeadHandWorld, expected: number) {
    expect(world.beadHand!.getDiscardedCounts().red).toBe(expected);
  }
);

Then(
  'player discarded blue should be {int}',
  function (world: PlayerBeadHandWorld, expected: number) {
    expect(world.beadHand!.getDiscardedCounts().blue).toBe(expected);
  }
);

// Can afford assertions
Then(
  'I should be able to afford {int} red bead(s)',
  function (world: PlayerBeadHandWorld, count: number) {
    expect(world.beadHand!.canAfford({ red: count, blue: 0, green: 0, white: 0 })).toBe(true);
  }
);

Then(
  'I should not be able to afford {int} red bead(s)',
  function (world: PlayerBeadHandWorld, count: number) {
    expect(world.beadHand!.canAfford({ red: count, blue: 0, green: 0, white: 0 })).toBe(false);
  }
);

Then(
  'I should be able to afford {int} red and {int} blue beads',
  function (world: PlayerBeadHandWorld, red: number, blue: number) {
    expect(world.beadHand!.canAfford({ red, blue, green: 0, white: 0 })).toBe(true);
  }
);

Then('I should be able to afford 0 beads', function (world: PlayerBeadHandWorld) {
  expect(world.beadHand!.canAfford({ red: 0, blue: 0, green: 0, white: 0 })).toBe(true);
});

// Reshuffle assertions
Then('the player bag should have reshuffled', function (world: PlayerBeadHandWorld) {
  expect(world.reshuffleCount).toBeGreaterThan(0);
});

// Bag/hand specific count assertions
Then('bag red should be {int}', function (world: PlayerBeadHandWorld, expected: number) {
  expect(world.beadHand!.getBagCounts().red).toBe(expected);
});

Then('bag blue should be {int}', function (world: PlayerBeadHandWorld, expected: number) {
  expect(world.beadHand!.getBagCounts().blue).toBe(expected);
});

Then('bag green should be {int}', function (world: PlayerBeadHandWorld, expected: number) {
  expect(world.beadHand!.getBagCounts().green).toBe(expected);
});

Then('hand red should be {int}', function (world: PlayerBeadHandWorld, expected: number) {
  expect(world.beadHand!.getHandCounts().red).toBe(expected);
});

Then('hand blue should be {int}', function (world: PlayerBeadHandWorld, expected: number) {
  expect(world.beadHand!.getHandCounts().blue).toBe(expected);
});

// Empty bag assertion
Then('the player bag should be empty', function (world: PlayerBeadHandWorld) {
  expect(world.beadHand!.isEmpty()).toBe(true);
});

// Error assertion
Then(
  'a player bead hand error should be thrown with message {string}',
  function (world: PlayerBeadHandWorld, expectedMessage: string) {
    expect(world.error).toBeDefined();
    expect(world.error!.message).toBe(expectedMessage);
  }
);
