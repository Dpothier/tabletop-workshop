Feature: Strategize modifier on Rest action
  As a player
  I want to use the Strategize modifier on the Rest action
  So that I can draw and keep more beads by spending resources

  Background:
    Given a battle grid of size 9x9
    And a game context with the grid
    And an entity "hero-0" with 10 health registered at position 3,3
    And a player bead system

  Scenario: Without Strategize, Rest draws 2 beads normally
    When I execute DrawBeadsEffect to draw 2 beads for "hero-0"
    Then the effect result should be successful
    And the player should have 2 beads in hand
    And the effect result should contain rest animation event
    And the rest event should have 2 beads drawn

  Scenario: Strategize makes Rest draw 4 beads instead of 2
    When I execute DrawBeadsEffect to draw 2 beads for "hero-0" with strategize modifier
    Then the effect result should be successful
    And the player should have 4 beads in hand
    And the effect result should contain rest animation event
    And the rest event should have 4 beads drawn

  Scenario: Strategize returns data about drawn beads for player selection
    When I execute DrawBeadsEffect to draw 2 beads for "hero-0" with strategize modifier
    Then the effect result data should include drawn beads list with 4 beads
    And the effect result data should indicate must return 1 bead

  Scenario: Player keeps 3 beads and returns 1 to bag
    When I execute DrawBeadsEffect to draw 2 beads for "hero-0" with strategize modifier
    And I return the first drawn bead to pool
    Then the player should have 3 beads in hand
    And the pool should contain the returned bead

  Scenario: Strategize costs 1 blue bead per instance
    When I load the rest action definition from YAML
    Then the rest action should have a strategize option with cost 1 blue bead

  Scenario: Strategize can be paid with 1 ponder stack
    When I load the rest action definition from YAML
    Then the rest action strategize option should have ponder as alternative cost
