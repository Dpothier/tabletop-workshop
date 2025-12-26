Feature: Bead Pile
  A simple collection of beads that can be added to or removed from.
  Used as a hand (beads available to spend) or discard pile.

  Background:
    Given an empty bead pile

  # Creation
  Scenario: Empty pile has zero beads
    Then the pile should have 0 total beads
    And the pile should be empty

  Scenario: Create pile with initial beads
    Given a bead pile with 2 red, 1 blue, 0 green, 3 white beads
    Then the pile should have 6 total beads
    And the pile should have 2 red beads
    And the pile should have 1 blue beads
    And the pile should have 0 green beads
    And the pile should have 3 white beads

  # Adding beads
  Scenario: Add single bead
    When I add 1 red bead to the pile
    Then the pile should have 1 red beads
    And the pile should have 1 total beads

  Scenario: Add multiple beads of same color
    When I add 3 blue beads to the pile
    Then the pile should have 3 blue beads

  Scenario: Add beads of different colors
    When I add 2 red beads to the pile
    And I add 1 green bead to the pile
    Then the pile should have 2 red beads
    And the pile should have 1 green beads
    And the pile should have 3 total beads

  # Removing beads
  Scenario: Remove single bead succeeds
    Given a bead pile with 2 red, 0 blue, 0 green, 0 white beads
    When I remove 1 red bead from the pile
    Then the removal should succeed
    And the pile should have 1 red beads

  Scenario: Remove multiple beads succeeds
    Given a bead pile with 0 red, 3 blue, 0 green, 0 white beads
    When I remove 2 blue beads from the pile
    Then the removal should succeed
    And the pile should have 1 blue beads

  Scenario: Remove bead fails when not enough
    Given a bead pile with 1 red, 0 blue, 0 green, 0 white beads
    When I remove 2 red beads from the pile
    Then the removal should fail
    And the pile should have 1 red beads

  Scenario: Remove bead fails when color is empty
    When I remove 1 green bead from the pile
    Then the removal should fail

  # Clear
  Scenario: Clear returns all beads and empties pile
    Given a bead pile with 2 red, 1 blue, 3 green, 1 white beads
    When I clear the pile
    Then the cleared counts should be 2 red, 1 blue, 3 green, 1 white
    And the pile should be empty
