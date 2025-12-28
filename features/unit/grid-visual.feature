Feature: Grid Visual
  As a rendering system
  I need to visualize the grid with terrain colors and highlight tiles
  So that players can see the battle arena clearly

  Background:
    Given a GridVisual with a 9x9 arena

  # Terrain color mapping

  Scenario Outline: Get terrain color for known terrain types
    When I get the terrain color for "<terrainType>"
    Then the color should be <expectedColor>

    Examples:
      | terrainType | expectedColor |
      | normal      | 0x3d3d5c      |
      | hazard      | 0x8b0000      |
      | difficult   | 0x4a4a2a      |
      | elevated    | 0x2a4a4a      |
      | pit         | 0x1a1a1a      |

  Scenario: Unknown terrain type returns normal color
    When I get the terrain color for "unknown"
    Then the color should be 0x3d3d5c

  Scenario: Unspecified terrain type returns normal color
    When I get the terrain color for "lava"
    Then the color should be 0x3d3d5c

  # Highlight management

  Scenario: Highlight tiles creates graphics object
    When I highlight tiles at positions 3,3 and 4,4 with color 0xff0000
    Then a graphics object should be created
    And the graphics object should be tracked

  Scenario: Highlight tiles accepts alpha parameter
    When I highlight tiles at positions 2,2 with color 0x00ff00 and alpha 0.5
    Then a graphics object should be created
    And the graphics object alpha should be 0.5

  Scenario: Remove specific highlight deletes graphics
    When I highlight tiles at positions 3,3 with color 0xff0000
    And I store the graphics object
    And I remove that highlight
    Then the graphics object should be destroyed
    And the graphics object should no longer be tracked

  Scenario: Clear all highlights removes all tracked graphics
    When I highlight tiles at positions 3,3 with color 0xff0000
    And I highlight tiles at positions 4,4 with color 0x00ff00
    And I highlight tiles at positions 5,5 with color 0x0000ff
    Then 3 graphics objects should be tracked
    When I clear all highlights
    Then 0 graphics objects should be tracked

  Scenario: Multiple highlights can coexist
    When I highlight tiles at positions 1,1 with color 0xff0000
    And I highlight tiles at positions 2,2 with color 0x00ff00
    And I highlight tiles at positions 3,3 with color 0x0000ff
    Then 3 graphics objects should be tracked

  # Destroy cleanup

  Scenario: Destroy clears all highlights
    When I highlight tiles at positions 3,3 with color 0xff0000
    And I highlight tiles at positions 4,4 with color 0x00ff00
    And I destroy the GridVisual
    Then 0 graphics objects should be tracked

  Scenario: Destroy removes container from scene
    Given a GridVisual with a 9x9 arena
    When I destroy the GridVisual
    Then the container should be destroyed
