Feature: Targeting System
  As a targeting system
  I need to handle tile selection for movement and targeting
  So that players can select valid targets for their actions

  # Tile targeting

  Scenario: Show tile targeting highlights valid tiles
    Given a TargetingSystem with valid moves at 3,3 and 4,4
    When I show tile targeting for entity "entity1" with range 2 and action "Move"
    Then valid tiles should be highlighted with color 0x00ff00
    And an action prompt should be logged for action "Move"

  Scenario: Show tile targeting returns selected position when valid tile clicked
    Given a TargetingSystem with valid moves at 3,3 and 4,4
    When I show tile targeting for entity "entity1" with range 2 and action "Attack"
    And I click on world position 192,192
    Then the targeting should return position 3,3
    And the highlight should be removed

  Scenario: Show tile targeting returns null when invalid tile clicked
    Given a TargetingSystem with valid moves at 3,3 and 4,4
    When I show tile targeting for entity "entity1" with range 2 and action "Move"
    And I click on world position 0,0
    Then the targeting should return null
    And the highlight should be removed

  Scenario: Show tile targeting calls getValidMoves with entity and range
    Given a TargetingSystem with valid moves at 2,2 and 5,5
    When I show tile targeting for entity "monster-42" with range 3 and action "Defend"
    Then getValidMoves should have been called with entity "monster-42" and range 3
    And valid tiles should be highlighted with color 0x00ff00

  # Cancel

  Scenario: Cancel returns null from active targeting
    Given a TargetingSystem with valid moves at 3,3 and 4,4
    When I show tile targeting for entity "entity1" with range 2 and action "Move"
    And I cancel targeting
    Then the targeting should return null

  Scenario: Cancel removes highlight
    Given a TargetingSystem with valid moves at 3,3 and 4,4
    When I show tile targeting for entity "entity1" with range 2 and action "Attack"
    And I cancel targeting
    Then the highlight should be removed

  Scenario: Cancel does nothing when not active
    Given a TargetingSystem with valid moves at 3,3
    When I cancel targeting without active targeting
    Then no error should occur

  # Active state

  Scenario: isActive returns true during targeting
    Given a TargetingSystem with valid moves at 3,3 and 4,4
    When I show tile targeting for entity "entity1" with range 2 and action "Move"
    Then isActive should return true

  Scenario: isActive returns false when not targeting
    Given a TargetingSystem with no valid moves
    Then isActive should return false

  Scenario: isActive returns false after selection
    Given a TargetingSystem with valid moves at 3,3 and 4,4
    When I show tile targeting for entity "entity1" with range 2 and action "Attack"
    And I click on world position 192,192
    Then isActive should return false

  Scenario: isActive returns false after cancel
    Given a TargetingSystem with valid moves at 3,3 and 4,4
    When I show tile targeting for entity "entity1" with range 2 and action "Defend"
    And I cancel targeting
    Then isActive should return false
