Feature: Temporal Shift Full Flow Integration
  As a game system
  I need to handle the complete Temporal Shift spell flow
  So that time manipulation with AoE works correctly

  Scenario: Cast Temporal Shift with AoE 3x3 - all entities in zone advanced by 1w
    Given a temporal integration grid of 12x12
    And a temporal integration game context with the grid
    And a temporal integration caster at position 5,5 on wheel position 0
    And a temporal integration entity "ally1" at grid position 5,6 on wheel position 2 accepting
    And a temporal integration entity "enemy1" at grid position 6,5 on wheel position 3 with 0 ward
    And a temporal integration entity "far-enemy" at grid position 8,8 on wheel position 4 with 0 ward
    When the temporal integration spell is cast with aoe3x3 direction "advance"
    Then the temporal integration entity "temporal-integration-ally1" should be at wheel position 3
    And the temporal integration entity "temporal-integration-enemy1" should be at wheel position 4
    And the temporal integration entity "temporal-integration-far-enemy" should be at wheel position 4
    And the temporal integration caster should be at wheel position 0
