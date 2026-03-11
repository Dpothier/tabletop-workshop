Feature: Horn - Support item with Command bead sharing
  As a support character with a Horn
  I need to share beads with allies via Command while maintaining Ponder
  So that I can provide tactical resource support

  Background:
    Given a horn test grid of 12x12
    And a horn test game context with the grid

  # Command - Ponder Required
  Scenario: Command verifies bearer has at least 1 Ponder stack
    Given a horn test bearer at position 5,5 with 2 ponder stacks and bead hand
    And a horn test ally "fighter" at position 5,6 with bead hand
    When the horn test command effect is executed targeting "fighter" spending red
    Then the horn test command result should be successful

  Scenario: Command fails if bearer has no Ponder
    Given a horn test bearer at position 5,5 with 0 ponder stacks and bead hand
    And a horn test ally "fighter" at position 5,6 with bead hand
    When the horn test command effect is executed targeting "fighter" spending red
    Then the horn test command result should have failed

  # Command - Bead Sharing
  Scenario: Command allows ally to use 1 bead from bearer's hand
    Given a horn test bearer at position 5,5 with 1 ponder stacks and bead hand having 3 red
    And a horn test ally "fighter" at position 5,6 with bead hand
    When the horn test command effect is executed targeting "fighter" spending red
    Then the horn test command result should be successful
    And the horn test bearer should have 2 red beads in hand

  Scenario: Command consumes 1 Ponder stack from bearer
    Given a horn test bearer at position 5,5 with 2 ponder stacks and bead hand
    And a horn test ally "fighter" at position 5,6 with bead hand
    When the horn test command effect is executed targeting "fighter" spending red
    Then the horn test bearer should have 1 ponder stacks

  # Command - Range
  Scenario: Command has range 1-6
    Given a horn test bearer at position 1,1 with 1 ponder stacks and bead hand
    And a horn test ally "far-ally" at position 5,5 with bead hand
    When the horn test command effect is executed targeting "far-ally" spending red
    Then the horn test command result should be successful

  Scenario: Command fails if ally is out of range
    Given a horn test bearer at position 1,1 with 1 ponder stacks and bead hand
    And a horn test ally "far-ally" at position 9,9 with bead hand
    When the horn test command effect is executed targeting "far-ally" spending red
    Then the horn test command result should have failed

  # Bead Sharing - Correct Hand
  Scenario: Bead sharing removes bead from bearer's hand not ally's
    Given a horn test bearer at position 5,5 with 1 ponder stacks and bead hand having 3 red
    And a horn test ally "fighter" at position 5,6 with bead hand having 3 red
    When the horn test command effect is executed targeting "fighter" spending red
    Then the horn test bearer should have 2 red beads in hand
    And the horn test ally "fighter" should have 3 red beads in hand

  # Command - Cost from YAML
  Scenario: Command costs 0 windup
    When I check the horn test command action cost from YAML
    Then the horn test command cost should have 0 windup
