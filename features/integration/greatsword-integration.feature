Feature: Greatsword Integration - Cleave and Sweep Combined
  As a game system
  I need to handle the complete Greatsword attack flow with Cleave and Sweep
  So that both effects work correctly together in a single attack

  Scenario: Attack with Cleave on hit - adjacent enemies take damage
    Given a greatsword integration grid of 12x12
    And a greatsword integration game context with the grid
    And a greatsword integration bearer at position 5,5 with bead hand having 1 red
    And a greatsword integration target "primary" at position 5,6 with 30 health
    And a greatsword integration adjacent enemy "adjacent1" at position 5,7 with 20 health
    And a greatsword integration adjacent enemy "adjacent2" at position 6,6 with 20 health
    When the greatsword integration cleave is triggered for "greatsword-integration-primary" with hit outcome "hit" and adjacent enemies '["greatsword-integration-adjacent1", "greatsword-integration-adjacent2"]'
    Then the greatsword integration cleave result should be successful
    And the greatsword integration cleave should have damaged 2 adjacent enemies

  Scenario: Attack with Sweep - multiple targets in arc resolve same attack
    Given a greatsword integration grid of 12x12
    And a greatsword integration game context with the grid
    And a greatsword integration bearer at position 5,5 with bead hand having 1 green
    And a greatsword integration target "arc-target1" at position 5,6 with 30 health
    And a greatsword integration target "arc-target2" at position 6,5 with 25 health
    And a greatsword integration target "arc-target3" at position 4,5 with 28 health
    When the greatsword integration sweep is triggered with targets '["greatsword-integration-arc-target1", "greatsword-integration-arc-target2", "greatsword-integration-arc-target3"]'
    Then the greatsword integration sweep result should be successful
    And the greatsword integration sweep should have resolved against 3 targets
