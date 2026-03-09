Feature: Resist Defensive Reaction
  As a player targeted by a magical effect
  I want to trigger the Resist reaction
  So that I gain +1 Ward against this effect and resist its impact

  Background:
    Given a magical caster "sorceress" at position 4,3
    And a defending character "hero-0" at position 3,3

  Scenario: Resist adds +1 Ward against a magical effect
    Given the defender has 1 white bead in hand
    And the defender has innate ward of 0
    When the magical attack triggers defensive reactions
    And the defender chooses resist
    Then the defender ward should be 1

  Scenario: Resist costs 1 White bead
    Given the defender has 2 white beads in hand
    When the magical attack triggers defensive reactions
    And the defender chooses resist
    Then the defender should have 1 white bead remaining

  Scenario: Resist stacks with innate ward
    Given the defender has 1 white bead in hand
    And the defender has innate ward of 2
    When the magical attack triggers defensive reactions
    And the defender chooses resist
    Then the defender ward should be 3

  Scenario: Resist is not available against melee attacks
    Given the defender has 1 red bead and 1 white bead in hand
    When the melee attack triggers defensive reactions
    Then resist should not be available as an option
    And guard should still be available

  Scenario: Resist is not available against ranged attacks
    Given the defender has 1 red bead and 1 white bead in hand
    When a ranged attack triggers defensive reactions
    Then resist should not be available as an option
    And guard should still be available

  Scenario: Resist cannot be paid via preparation stacks
    Given the defender has 0 white beads in hand
    And the defender has 1 Windup stack
    When the magical attack triggers defensive reactions
    Then resist should not be available as an option

  Scenario: Resist follows sourcing rules - one per source
    Given the defender has 3 white beads in hand
    When the magical attack triggers defensive reactions
    Then only one resist option should be offered
