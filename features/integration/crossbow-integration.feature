Feature: Crossbow Full Flow Integration
  As a game system
  I need to handle the complete Crossbow loading, firing, and precision flow
  So that loaded state and Steady Aim modifiers work correctly together

  Scenario: Load → Shoot removes loaded → Load again → Shoot with Steady Aim
    Given a crossbow integration grid of 12x12
    And a crossbow integration game context with the grid
    And a crossbow integration bearer at position 5,5 with loaded stacks 0
    When the crossbow integration load is executed
    Then the crossbow integration bearer should have loaded stacks 1
    When the crossbow integration shot is fired removing loaded stack
    Then the crossbow integration bearer should have loaded stacks 0
    When the crossbow integration load is executed
    Then the crossbow integration bearer should have loaded stacks 1
    When the crossbow integration steady aim is applied
    Then the crossbow integration precision modifier should be 1
