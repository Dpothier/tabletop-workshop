Feature: Longbow Full Flow Integration
  As a game system
  I need to handle the complete Longbow aim stack application and Strong Draw penetration flow
  So that aim stacks and Strong Draw penetration modifiers work correctly together

  Scenario: Aim stack applied → Shoot with Strong Draw applies penetration
    Given a longbow integration grid of 12x12
    And a longbow integration game context with the grid
    And a longbow integration bearer at position 5,5
    When the longbow integration aim stacks are added 2
    Then the longbow integration bearer should have aim stacks 2
    When the longbow integration strong draw penetration is applied
    Then the longbow integration penetration modifier should be 1
