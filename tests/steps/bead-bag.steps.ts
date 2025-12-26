import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { BeadColor, BeadCounts } from '@src/types/Beads';
import { BeadBag } from '@src/systems/BeadBag';

interface BeadBagWorld extends QuickPickleWorld {
  beadBag?: BeadBag;
  drawnBead?: BeadColor;
  drawnBeads?: BeadColor[];
  randomSequence?: number[];
  randomIndex?: number;
  error?: Error;
  wasEmptyBeforeReshuffle?: boolean;
  reshuffleCount?: number;
}

function createRandomFn(world: BeadBagWorld): () => number {
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

Given(
  'a bead bag with {int} red, {int} blue, {int} green, {int} white beads',
  function (world: BeadBagWorld, red: number, blue: number, green: number, white: number) {
    const counts: BeadCounts = { red, blue, green, white };
    const randomFn = createRandomFn(world);
    world.beadBag = new BeadBag(counts, randomFn);
    world.drawnBeads = [];
    world.reshuffleCount = 0;
  }
);

Given('random function returns {float}', function (world: BeadBagWorld, value: number) {
  world.randomSequence = [value];
  // Recreate bag with new random function if it exists
  if (world.beadBag) {
    const counts = world.beadBag.getRemainingCounts();
    const discarded = world.beadBag.getDiscardedCounts();
    // Total original counts = remaining + discarded
    const original: BeadCounts = {
      red: counts.red + discarded.red,
      blue: counts.blue + discarded.blue,
      green: counts.green + discarded.green,
      white: counts.white + discarded.white,
    };
    world.beadBag = new BeadBag(original, createRandomFn(world));
    world.drawnBeads = [];
  }
});

Given(
  'random function returns sequence {string}',
  function (world: BeadBagWorld, sequenceStr: string) {
    // Parse "0, 0.6, 0.8" format
    const cleaned = sequenceStr.replace(/[[\]"]/g, '');
    world.randomSequence = cleaned.split(',').map((s) => parseFloat(s.trim()));
    // Recreate bag with new random function if it exists
    if (world.beadBag) {
      const counts = world.beadBag.getRemainingCounts();
      const discarded = world.beadBag.getDiscardedCounts();
      const original: BeadCounts = {
        red: counts.red + discarded.red,
        blue: counts.blue + discarded.blue,
        green: counts.green + discarded.green,
        white: counts.white + discarded.white,
      };
      world.beadBag = new BeadBag(original, createRandomFn(world));
      world.drawnBeads = [];
    }
  }
);

When('I draw a bead', function (world: BeadBagWorld) {
  const beforeEmpty = world.beadBag!.isEmpty();
  world.drawnBead = world.beadBag!.draw();
  world.drawnBeads!.push(world.drawnBead);
  if (beforeEmpty) {
    world.wasEmptyBeforeReshuffle = true;
    world.reshuffleCount = (world.reshuffleCount || 0) + 1;
  }
});

When('I draw {int} beads', function (world: BeadBagWorld, count: number) {
  for (let i = 0; i < count; i++) {
    const beforeEmpty = world.beadBag!.isEmpty();
    world.drawnBead = world.beadBag!.draw();
    world.drawnBeads!.push(world.drawnBead);
    if (beforeEmpty) {
      world.wasEmptyBeforeReshuffle = true;
      world.reshuffleCount = (world.reshuffleCount || 0) + 1;
    }
  }
});

When(
  'I try to create a bead bag with {int} red, {int} blue, {int} green, {int} white beads',
  function (world: BeadBagWorld, red: number, blue: number, green: number, white: number) {
    try {
      const counts: BeadCounts = { red, blue, green, white };
      world.beadBag = new BeadBag(counts);
    } catch (e) {
      world.error = e as Error;
    }
  }
);

Then(
  'the bag should have {int} total beads remaining',
  function (world: BeadBagWorld, expected: number) {
    expect(world.beadBag!.getTotalRemaining()).toBe(expected);
  }
);

Then(
  'the bag should have {int} discarded bead(s)',
  function (world: BeadBagWorld, expected: number) {
    const discarded = world.beadBag!.getDiscardedCounts();
    const total = discarded.red + discarded.blue + discarded.green + discarded.white;
    expect(total).toBe(expected);
  }
);

Then('the drawn bead should be {string}', function (world: BeadBagWorld, expected: string) {
  expect(world.drawnBead).toBe(expected);
});

Then('the last drawn bead should be {string}', function (world: BeadBagWorld, expected: string) {
  expect(world.drawnBeads![world.drawnBeads!.length - 1]).toBe(expected);
});

Then('the remaining counts should sum to {int}', function (world: BeadBagWorld, expected: number) {
  expect(world.beadBag!.getTotalRemaining()).toBe(expected);
});

Then('remaining red should be {int}', function (world: BeadBagWorld, expected: number) {
  expect(world.beadBag!.getRemainingCounts().red).toBe(expected);
});

Then('remaining blue should be {int}', function (world: BeadBagWorld, expected: number) {
  expect(world.beadBag!.getRemainingCounts().blue).toBe(expected);
});

Then('discarded red should be {int}', function (world: BeadBagWorld, expected: number) {
  expect(world.beadBag!.getDiscardedCounts().red).toBe(expected);
});

Then('discarded blue should be {int}', function (world: BeadBagWorld, expected: number) {
  expect(world.beadBag!.getDiscardedCounts().blue).toBe(expected);
});

Then('the bag should have reshuffled', function (world: BeadBagWorld) {
  expect(world.reshuffleCount).toBeGreaterThan(0);
});

Then('the bag should not be empty', function (world: BeadBagWorld) {
  expect(world.beadBag!.isEmpty()).toBe(false);
});

Then('the bag should be empty', function (world: BeadBagWorld) {
  expect(world.beadBag!.isEmpty()).toBe(true);
});

Then('the bag was empty before reshuffle', function (world: BeadBagWorld) {
  expect(world.wasEmptyBeforeReshuffle).toBe(true);
});

Then(
  'a bead bag error should be thrown with message {string}',
  function (world: BeadBagWorld, expectedMessage: string) {
    expect(world.error).toBeDefined();
    expect(world.error!.message).toBe(expectedMessage);
  }
);

Then('a bead bag error should be thrown', function (world: BeadBagWorld) {
  expect(world.error).toBeDefined();
});
