import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BeadPile } from '@src/systems/BeadPile';
import type { BeadCounts } from '@src/types/Beads';

interface BeadPileWorld extends QuickPickleWorld {
  pile?: BeadPile;
  removalResult?: boolean;
  clearedCounts?: BeadCounts;
}

// Creation

Given('an empty bead pile', function (world: BeadPileWorld) {
  world.pile = new BeadPile();
});

Given(
  'a bead pile with {int} red, {int} blue, {int} green, {int} white beads',
  function (world: BeadPileWorld, red: number, blue: number, green: number, white: number) {
    world.pile = new BeadPile({ red, blue, green, white });
  }
);

// Adding beads

When('I add {int} red bead(s) to the pile', function (world: BeadPileWorld, count: number) {
  world.pile!.add('red', count);
});

When('I add {int} blue bead(s) to the pile', function (world: BeadPileWorld, count: number) {
  world.pile!.add('blue', count);
});

When('I add {int} green bead(s) to the pile', function (world: BeadPileWorld, count: number) {
  world.pile!.add('green', count);
});

When('I add {int} white bead(s) to the pile', function (world: BeadPileWorld, count: number) {
  world.pile!.add('white', count);
});

// Removing beads

When('I remove {int} red bead(s) from the pile', function (world: BeadPileWorld, count: number) {
  world.removalResult = world.pile!.remove('red', count);
});

When('I remove {int} blue bead(s) from the pile', function (world: BeadPileWorld, count: number) {
  world.removalResult = world.pile!.remove('blue', count);
});

When('I remove {int} green bead(s) from the pile', function (world: BeadPileWorld, count: number) {
  world.removalResult = world.pile!.remove('green', count);
});

When('I remove {int} white bead(s) from the pile', function (world: BeadPileWorld, count: number) {
  world.removalResult = world.pile!.remove('white', count);
});

// Clear

When('I clear the pile', function (world: BeadPileWorld) {
  world.clearedCounts = world.pile!.clear();
});

// Assertions

Then('the pile should have {int} total beads', function (world: BeadPileWorld, total: number) {
  expect(world.pile!.getTotal()).toBe(total);
});

Then('the pile should be empty', function (world: BeadPileWorld) {
  expect(world.pile!.isEmpty()).toBe(true);
});

Then('the pile should have {int} red beads', function (world: BeadPileWorld, count: number) {
  expect(world.pile!.getCounts().red).toBe(count);
});

Then('the pile should have {int} blue beads', function (world: BeadPileWorld, count: number) {
  expect(world.pile!.getCounts().blue).toBe(count);
});

Then('the pile should have {int} green beads', function (world: BeadPileWorld, count: number) {
  expect(world.pile!.getCounts().green).toBe(count);
});

Then('the pile should have {int} white beads', function (world: BeadPileWorld, count: number) {
  expect(world.pile!.getCounts().white).toBe(count);
});

Then('the removal should succeed', function (world: BeadPileWorld) {
  expect(world.removalResult).toBe(true);
});

Then('the removal should fail', function (world: BeadPileWorld) {
  expect(world.removalResult).toBe(false);
});

Then(
  'the cleared counts should be {int} red, {int} blue, {int} green, {int} white',
  function (world: BeadPileWorld, red: number, blue: number, green: number, white: number) {
    expect(world.clearedCounts).toEqual({ red, blue, green, white });
  }
);
