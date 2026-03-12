Feature: Slicing Dagger Integration - Lacerate hits apply Bleed then resolve at end of round
  As a player using Slicing Dagger
  I need Lacerate to apply Bleed on hit and then deal damage at end of round
  So that the bleeding mechanic works end-to-end

  Background:
    Given a slicing-dagger integration grid of 12x12
    And a slicing-dagger integration game context with the grid
    And a slicing-dagger integration bearer at position 5,5
    And a slicing-dagger integration target "victim" at position 5,6 with 20 health

  Scenario: Lacerate on hit applies Bleed, then end of round deals damage
    When the slicing-dagger integration lacerate effect is triggered for "victim" with hit outcome "hit"
    Then the slicing-dagger integration target should have 1 bleed stack
    And the slicing-dagger integration target should have 20 health
    When end of round is resolved for slicing-dagger integration
    Then the slicing-dagger integration end-of-round results should show 1 damage to "victim"
    And the slicing-dagger integration target should have 19 health
