Feature: Battle Flow
  As a player
  I want to engage in turn-based combat
  So that I can defeat the monster

  Scenario: Start battle shows arena
    Given I am on the main menu
    When I click the Start Battle button
    Then the battle scene should be visible
    And I should see the arena grid

  Scenario: Battle displays tokens
    Given I have started a battle
    Then I should see character tokens
    And I should see the monster token

  Scenario: Select character shows action buttons
    Given I have started a battle
    When I click on a character token
    Then action buttons should appear

  Scenario: End turn triggers monster phase
    Given I have started a battle
    When I click the End Turn button
    Then the monster should take its turn
    And the turn counter should increment
