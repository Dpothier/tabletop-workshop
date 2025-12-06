Feature: Victory and Defeat
  As a player
  I want clear feedback when the battle ends
  So that I know the outcome

  # Note: These scenarios are slow to run as they require multiple game turns
  # They are tagged @slow and skipped in normal test runs

  @slow @skip
  Scenario: Party wipe leads to defeat screen
    Given I have started a battle
    When the monster defeats all characters
    Then the defeat screen should appear
    And the screen should show the turn count

  @slow @skip
  Scenario: Play Again returns to menu
    Given the game has ended
    When I click the Play Again button
    Then I should see the menu
