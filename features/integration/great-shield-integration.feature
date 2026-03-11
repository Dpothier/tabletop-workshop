Feature: Great Shield Full Flow Integration
  As a game system
  I need to handle the complete Great Shield defensive flow
  So that frontline group protection works correctly

  Scenario: Adjacent ally attacked - Shield Wall grants +1 Guard
    Given a great shield integration grid of 12x12
    And a great shield integration game context with the grid
    And a great shield integration bearer at position 5,5 with bead hand having 3 red
    And a great shield integration ally "fighter" at position 5,6 with 0 guard
    When the great shield integration shield wall is triggered for "great-shield-integration-fighter"
    Then the great shield integration ally "great-shield-integration-fighter" should have 1 guard
    And the great shield integration shield wall result should be successful

  Scenario: Block + Great Guard combined - +2 Guard total
    Given a great shield integration grid of 12x12
    And a great shield integration game context with the grid
    And a great shield integration bearer at position 5,5 with bead hand having 3 red
    When the great shield integration block is triggered
    And the great shield integration great guard is triggered
    Then the great shield integration bearer should have 2 guard
