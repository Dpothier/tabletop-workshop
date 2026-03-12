Feature: Hatchet Integration - Chop attack with modifiers
  As a game system
  I need to handle the complete Hatchet attack flow with Chop
  So that power and agility modifiers are correctly applied

  Scenario: Attack with Chop - power increased and agility reduced
    Given a hatchet integration grid of 12x12
    And a hatchet integration game context with the grid
    And a hatchet integration bearer at position 5,5 with bead hand having 1 red
    And a hatchet integration bearer with base power 1
    And a hatchet integration bearer with base agility 2
    When the hatchet integration chop modifier is applied
    Then the hatchet integration effective power should be 2
    And the hatchet integration effective agility should be 1
