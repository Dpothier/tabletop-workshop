Feature: Menu Navigation
  As a player
  I want to navigate the main menu
  So that I can configure my game before starting

  Scenario: Display main menu on load
    Given I am on the game page
    Then the canvas should be visible
    And I should see the menu

  Scenario: Cycle through monster selection
    Given I am on the main menu
    When I click the next monster button
    Then the monster selection should change

  Scenario: Cycle through arena selection
    Given I am on the main menu
    When I click the next arena button
    Then the arena selection should change

  Scenario: Change party size
    Given I am on the main menu
    When I click the party size up button
    Then the party size should change
