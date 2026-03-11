Feature: Shield System Full Flow Integration
  As a game system
  I need the complete shield defense flow to work
  So that shields reduce incoming damage

  Background:
    Given a shield system integration grid of 12x12
    And a shield system integration game context with the grid

  Scenario: Attack received with Block - Guard reduces damage
    Given a shield system integration defender at position 5,5 with 20 health and 0 guard
    And a shield system integration attacker at position 5,6 with 1 power and 30 health
    When the shield system integration block is triggered
    Then the shield system integration defender should have 1 guard
    And the shield system integration block result should be successful
