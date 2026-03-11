Feature: Shield Full Flow Integration
  As a game system
  I need to handle the complete Shield defensive flow
  So that block and rebuke work correctly together

  Scenario: Attack P2 with Block and Rebuke - no push when Guard equals Power
    Given a shield integration grid of 12x12
    And a shield integration game context with the grid
    And a shield integration bearer at position 5,5 with bead hand having 3 red and 1 passive guard
    And a shield integration attacker "monster" at position 5,6 with 2 power and 30 health
    When the shield integration block is triggered granting 1 guard
    And the shield integration rebuke is triggered for "shield-integration-monster" with total guard and power 2
    Then the shield integration rebuke push distance should be 0
    And the shield integration attacker "shield-integration-monster" should be at position 5,6

  Scenario: Attack P1 with Block and Rebuke - push 1 tile
    Given a shield integration grid of 12x12
    And a shield integration game context with the grid
    And a shield integration bearer at position 5,5 with bead hand having 3 red and 1 passive guard
    And a shield integration attacker "monster" at position 5,6 with 1 power and 30 health
    When the shield integration block is triggered granting 1 guard
    And the shield integration rebuke is triggered for "shield-integration-monster" with total guard and power 1
    Then the shield integration rebuke push distance should be 1
    And the shield integration attacker "shield-integration-monster" should be at position 5,7
