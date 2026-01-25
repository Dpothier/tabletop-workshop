Feature: Selected Hero Panel Attack Range Check
  Attack buttons should be disabled when no valid target is in range

  Background:
    Given a mock scene for selected hero panel testing
    And a battle grid of size 9x9
    And test actions including attack actions

  Scenario: Attack button disabled when no enemy adjacent
    Given hero "hero-0" is at position 0,0 on the grid
    And monster "monster" is at position 5,5 on the grid
    When I create the selected hero panel for "hero-0"
    And I update action availability with the grid
    Then the attack button should be disabled due to no target in range

  Scenario: Attack button enabled when enemy is adjacent orthogonally
    Given hero "hero-0" is at position 3,3 on the grid
    And monster "monster" is at position 4,3 on the grid
    When I create the selected hero panel for "hero-0"
    And I update action availability with the grid
    Then the attack button should be enabled

  Scenario: Attack button enabled when enemy is adjacent diagonally
    Given hero "hero-0" is at position 3,3 on the grid
    And monster "monster" is at position 4,4 on the grid
    When I create the selected hero panel for "hero-0"
    And I update action availability with the grid
    Then the attack button should be enabled

  Scenario: Movement actions not affected by enemy position
    Given hero "hero-0" is at position 0,0 on the grid
    And monster "monster" is at position 5,5 on the grid
    When I create the selected hero panel for "hero-0"
    And I update action availability with the grid
    Then the move button should be enabled
    And the run button should be enabled

  Scenario: Attack button state updates when positions change
    Given hero "hero-0" is at position 0,0 on the grid
    And monster "monster" is at position 5,5 on the grid
    When I create the selected hero panel for "hero-0"
    And I update action availability with the grid
    Then the attack button should be disabled due to no target in range
    When I move "monster" to position 1,0 on the grid
    And I update action availability with the grid
    Then the attack button should be enabled
