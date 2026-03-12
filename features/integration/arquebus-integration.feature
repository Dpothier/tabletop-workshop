Feature: Arquebus Full Flow Integration
  As a game system
  I need to handle the complete Arquebus firing, reloading, and precision flow
  So that loaded state and Steady Aim modifiers work correctly together

  Scenario: Shoot unloaded → Reload → Shoot with Steady Aim applies precision
    Given a arquebus integration grid of 12x12
    And a arquebus integration game context with the grid
    And a arquebus integration bearer at position 5,5 with loaded stacks 1
    When the arquebus integration shot is fired removing loaded stack
    Then the arquebus integration bearer should have loaded stacks 0
    When the arquebus integration reload is executed
    Then the arquebus integration bearer should have loaded stacks 1
    When the arquebus integration steady aim is applied
    Then the arquebus integration precision modifier should be 1
