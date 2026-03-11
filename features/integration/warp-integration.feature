Feature: Warp Full Flow Integration
  As a game system
  I need to handle the complete Warp spell flow
  So that teleportation with enhancements works correctly

  Scenario: Cast Warp + Swap + Other - adjacent creature swapped with distant creature
    Given a warp integration grid of 12x12
    And a warp integration game context with the grid
    And a warp integration caster at position 1,1
    And a warp integration entity "ally" at position 1,2
    And a warp integration entity "distant" at position 5,5
    When the warp integration spell is cast with swap and other targeting "warp-integration-ally" with swap target at 5,5
    Then the warp integration entity "warp-integration-ally" should be at position 5,5
    And the warp integration entity "warp-integration-distant" should be at position 1,2
    And the warp integration caster should be at position 1,1
