Feature: Character Selection Popup
  As a player
  I want to select characters through a popup modal
  So that I can easily manage my party with a smooth interaction

  Background:
    Given I am on the main menu

  Scenario: Opening popup on empty slot
    When I click character slot 1
    And I click the Remove button in the popup
    When I click character slot 1
    Then the character selection popup should be visible
    And the popup should display the character list
    And the popup should not show a Remove button

  Scenario: Opening popup on filled slot
    When I click character slot 1
    Then the character selection popup should be visible
    And the popup should display the Remove button

  Scenario: Selecting a character fills the slot
    When I click character slot 3
    And I click the Remove button in the popup
    When I click character slot 3
    And I click the "Rogue" character in the popup
    Then the popup should close
    And slot 3 should display "Rogue"

  Scenario: Already-selected characters are grayed out
    When I click character slot 1
    Then the popup should be visible
    And the character "Mage" should be unavailable (grayed out) in the popup
    And the character "Rogue" should be unavailable (grayed out) in the popup
    And the character "Cleric" should be unavailable (grayed out) in the popup

  Scenario: Remove button clears the slot
    When I click character slot 1
    And I click the Remove button in the popup
    Then the popup should close
    And slot 1 should be empty

  Scenario: Close popup without changes via X button
    When I click character slot 1
    And I click the close button in the popup
    Then the popup should close
    And slot 1 should still display "Warrior"

  Scenario: Close popup without changes by clicking outside
    When I click character slot 1
    And I click outside the popup
    Then the popup should close
    And slot 1 should still display "Warrior"

  Scenario: Create New navigates to CharacterCreationScene
    When I click character slot 2
    And I click the "Create New" button in the popup
    Then I should see the character creation scene
