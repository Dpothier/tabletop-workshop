Feature: Dodge Defensive Reaction
  As a player targeted by a melee attack
  I want to trigger the Dodge reaction
  So that I gain +1 Evasion against this attack and attempt to dodge it

  Background:
    Given a melee attacker "goblin" at position 4,3
    And a defending character "hero-0" at position 3,3

  Scenario: Dodge adds +1 Evasion against a melee attack
    Given the defender has 1 green bead in hand
    And the defender has passive evasion of 0
    When the melee attack triggers defensive reactions
    And the defender chooses dodge
    Then the defender evasion should be 1

  Scenario: Dodge costs 1 Green bead
    Given the defender has 2 green beads in hand
    When the melee attack triggers defensive reactions
    And the defender chooses dodge
    Then the defender should have 1 green bead remaining

  Scenario: Dodge cannot be paid with Windup
    Given the defender has 1 red bead and 0 green beads in hand
    And the defender has 1 Windup stack
    When the melee attack triggers defensive reactions
    Then dodge should not be available as an option

  Scenario: Dodge stacks with passive evasion
    Given the defender has 1 green bead in hand
    And the defender has passive evasion of 2
    When the melee attack triggers defensive reactions
    And the defender chooses dodge
    Then the defender evasion should be 3

  Scenario: Dodge is not available against ranged attacks
    Given the defender has 1 red bead and 1 green bead in hand
    When a ranged attack triggers defensive reactions
    Then dodge should not be available as an option

  Scenario: Dodge follows sourcing rules - one per attack
    Given the defender has 3 green beads in hand
    When the melee attack triggers defensive reactions
    Then only one dodge option should be offered
