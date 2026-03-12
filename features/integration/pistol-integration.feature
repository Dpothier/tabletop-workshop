Feature: Pistol Full Flow Integration
  As a game system
  I need to handle the complete Pistol firing and reloading flow
  So that loaded state management works correctly for one-handed ranged combat

  Scenario: Shoot loaded → Unloaded → Reload → Loaded → Shoot again
    Given a pistol integration grid of 12x12
    And a pistol integration game context with the grid
    And a pistol integration bearer at position 5,5 with loaded stacks 1
    When the pistol integration shot is fired removing loaded stack
    Then the pistol integration bearer should have loaded stacks 0
    When the pistol integration reload is executed
    Then the pistol integration bearer should have loaded stacks 1
    When the pistol integration shot is fired removing loaded stack
    Then the pistol integration bearer should have loaded stacks 0
