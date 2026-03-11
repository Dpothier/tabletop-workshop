Feature: Horn Full Flow Integration
  As a game system
  I need to handle the complete Horn Command bead sharing flow
  So that cross-entity resource management works correctly

  Scenario: Bearer with Ponder - ally Command - bead transferred and Ponder consumed
    Given a horn integration grid of 12x12
    And a horn integration game context with the grid
    And a horn integration bearer at position 5,5 with 2 ponder stacks and bead hand having 3 red 3 blue
    And a horn integration ally "fighter" at position 5,7 with bead hand having 1 red
    When the horn integration command is executed for "horn-integration-fighter" spending blue
    Then the horn integration bearer should have 2 blue beads
    And the horn integration ally "horn-integration-fighter" should have 1 red beads
    And the horn integration bearer should have 1 ponder stacks
    And the horn integration command result should be successful
