Feature: Grid System
  As a game system
  I need to convert between grid and world coordinates
  So that tokens appear at correct screen positions

  Background:
    Given a grid system with size 64, offset 80,80 and arena 8x8

  Scenario: Convert grid position (0,0) to world coordinates
    When converting grid position 0,0 to world
    Then the world position should be 112,112

  Scenario: Convert grid position (5,4) to world coordinates
    When converting grid position 5,4 to world
    Then the world position should be 432,368

  Scenario: Convert world position back to grid
    When converting world position 432,368 to grid
    Then the grid position should be 5,4

  Scenario: Position (0,0) is valid
    Then position 0,0 should be valid

  Scenario: Position at arena boundary is valid
    Then position 7,7 should be valid

  Scenario: Position outside arena width is invalid
    Then position 8,4 should be invalid

  Scenario: Position outside arena height is invalid
    Then position 4,8 should be invalid

  Scenario: Negative position is invalid
    Then position -1,4 should be invalid

  Scenario Outline: Various grid to world conversions
    When converting grid position <gridX>,<gridY> to world
    Then the world position should be <worldX>,<worldY>

    Examples:
      | gridX | gridY | worldX | worldY |
      | 0     | 0     | 112    | 112    |
      | 1     | 0     | 176    | 112    |
      | 0     | 1     | 112    | 176    |
      | 3     | 3     | 304    | 304    |
