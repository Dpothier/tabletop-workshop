Feature: Bead Pool
  A bag you draw from. When empty, reshuffles from a linked discard pile.
  Drawing only removes from pool - does NOT auto-discard.

  # Creation
  Scenario: Cannot create empty pool
    Given an empty discard pile
    When I try to create a pool with 0 red, 0 blue, 0 green, 0 white beads
    Then an error should be thrown with message "Cannot create empty bead pool"

  Scenario: Create pool with initial beads
    Given an empty discard pile
    And a pool with 2 red, 1 blue, 3 green, 0 white beads
    Then the pool should have 6 total remaining
    And the pool should have 2 red remaining
    And the pool should have 1 blue remaining
    And the pool should have 3 green remaining
    And the pool should have 0 white remaining

  # Drawing
  Scenario: Draw reduces pool count
    Given an empty discard pile
    And a pool with 1 red, 0 blue, 0 green, 0 white beads
    When I draw from the pool
    Then the drawn bead should be red
    And the pool should have 0 total remaining
    And the pool should be empty

  Scenario: Draw with seeded random
    Given an empty discard pile
    And a pool with 1 red, 1 blue, 1 green, 1 white beads
    And a seeded random that returns 0.5
    When I draw from the pool
    Then the pool should have 3 total remaining

  # Reshuffle
  Scenario: Auto-reshuffle when pool empty
    Given an empty discard pile
    And a pool with 1 red, 0 blue, 0 green, 0 white beads
    When I draw from the pool
    Then the pool should be empty
    When I add 2 blue beads to the discard
    And I draw from the pool
    Then the drawn bead should be blue
    And the pool should have 1 blue remaining

  Scenario: Reshuffle clears discard pile
    Given an empty discard pile
    And a pool with 1 red, 0 blue, 0 green, 0 white beads
    When I draw from the pool
    And I add 3 green beads to the discard
    And I draw from the pool
    Then the discard should be empty

  # Multiple draws
  Scenario: Multiple draws reduce pool
    Given an empty discard pile
    And a pool with 2 red, 2 blue, 0 green, 0 white beads
    When I draw 3 beads from the pool
    Then the pool should have 1 total remaining
