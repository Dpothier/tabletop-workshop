Feature: Throwing Dagger Integration - Throw → Drop → Move → Recovery → Available
  As a game system
  I need to handle the complete Throwing Dagger flow from throw to recovery
  So that weapon drop and auto-recovery mechanics work seamlessly

  Scenario: Throw dagger → weapon dropped → move to tile → recovery → attack available
    Given a throwing-dagger integration grid of 12x12
    And a throwing-dagger integration game context with the grid
    And a throwing-dagger integration bearer at position 5,5 with bead hand having 1 green
    And a throwing-dagger integration target "victim" at position 5,7
    When the throwing-dagger integration throw action is executed against "victim"
    Then the throwing-dagger integration weapon should be dropped at target position
    And the throwing-dagger integration bearer should lose attack action
    When the throwing-dagger integration bearer moves to position 5,7
    Then the throwing-dagger integration weapon should be recovered
    And the throwing-dagger integration bearer should regain attack action
    And the throwing-dagger integration bearer should have parade action available
