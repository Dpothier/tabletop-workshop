Feature: Sanctuary Full Flow Integration
  As a game system
  I need to handle the complete Sanctuary spell flow
  So that zone control and persistence work correctly

  Scenario: Cast Sanctuary, push enemies, maintain zone with Channel, repel breach
    Given a sanctuary integration grid of 9x9
    And a sanctuary integration game context with the grid
    And a sanctuary integration caster at position 5,5 with 3 channel stacks
    And a sanctuary integration enemy at position 5,5 with 10 health
    When the sanctuary spell is cast with size 3
    Then the integration enemy should be pushed outside the zone
    And a zone should exist at center 5,5
    When the caster uses Channel to add 1 stack
    Then the caster should have 3 channel stacks
    And the zone should still be active
    When the enemy at 6,6 tries to breach the zone
    And the caster repels with 1 channel + 1 white bead
    Then the integration enemy should be pushed further away
    And the caster should have 2 channel stacks

  Scenario: Cast Sanctuary, maintain with Channel, take damage, zone collapses
    Given a sanctuary integration grid of 9x9
    And a sanctuary integration game context with the grid
    And a sanctuary integration caster at position 5,5 with 2 channel stacks
    When the sanctuary spell is cast with size 3
    Then a zone should exist at center 5,5
    When the caster uses Channel to add 1 stack
    Then the caster should have 2 channel stacks
    And the zone should still be active
    When the integration caster takes 5 damage
    Then the integration zone should be removed
