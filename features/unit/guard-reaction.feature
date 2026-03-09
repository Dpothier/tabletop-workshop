Feature: Guard Defensive Reaction
  As a player targeted by a melee attack
  I want to trigger the Guard reaction
  So that I gain +1 Guard against this attack and better absorb damage

  Background:
    Given a melee attacker "goblin" at position 4,3
    And a defending character "hero-0" at position 3,3

  Scenario: Guard adds +1 Guard against a melee attack
    Given the defender has 1 red bead in hand
    And the defender has passive guard of 0
    When the melee attack triggers defensive reactions
    And the defender chooses guard
    Then the defender guard should be 1

  Scenario: Guard costs 1 Red bead
    Given the defender has 2 red beads in hand
    When the melee attack triggers defensive reactions
    And the defender chooses guard
    Then the defender should have 1 red bead remaining

  Scenario: Guard cannot be paid with Windup
    Given the defender has 0 red beads and 1 Windup stack
    When the melee attack triggers defensive reactions
    Then guard should not be available as an option

  Scenario: Guard stacks with passive guard
    Given the defender has 1 red bead in hand
    And the defender has passive guard of 2
    When the melee attack triggers defensive reactions
    And the defender chooses guard
    Then the defender guard should be 3

  Scenario: Guard is not available against ranged attacks
    Given the defender has 1 green bead and 1 red bead in hand
    When a ranged attack triggers defensive reactions
    Then guard should not be available as an option

  Scenario: Guard is not available against magical attacks
    Given the defender has 1 white bead and 1 red bead in hand
    When a magical attack triggers defensive reactions
    Then guard should not be available as an option

  Scenario: Guard follows sourcing rules - one per attack
    Given the defender has 3 red beads in hand
    When the melee attack triggers defensive reactions
    Then only one guard option should be offered
