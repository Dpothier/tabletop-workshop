Feature: Buckler Full Flow Integration
  As a game system
  I need to handle the complete Buckler defensive flow
  So that block and riposte work correctly together

  Scenario: Attack → Block → guarded outcome → Riposte → 1 damage to attacker
    Given a buckler integration grid of 12x12
    And a buckler integration game context with the grid
    And a buckler integration bearer at position 5,5 with bead hand having 1 green
    And a buckler integration attacker "monster" at position 5,6 with 30 health
    When the buckler integration block is triggered granting 0 guard
    And the buckler integration riposte is triggered for "buckler-integration-monster" with guard outcome "guarded"
    Then the buckler integration riposte result should be successful
    And the buckler integration attacker "buckler-integration-monster" should have 29 health
