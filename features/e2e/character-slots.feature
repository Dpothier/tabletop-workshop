Feature: Character Slots
  As a player
  I want to see character slots on the main menu
  So that I can manage my party before starting a battle

  Scenario: Display 4 slots with default characters on load
    Given I am on the main menu
    Then I should see 4 character slots
    And slot 1 should display "Warrior"
    And slot 2 should display "Mage"
    And slot 3 should display "Rogue"
    And slot 4 should display "Cleric"

  Scenario: Slot shows character name and first letter icon
    Given I am on the main menu
    Then slot 1 should show the letter "W"
    And slot 1 should display "Warrior"
    And slot 1 should show attributes "S:5 D:2 M:1 R:1"

  Scenario: Click filled slot removes character
    Given I am on the main menu
    When I click character slot 1
    Then slot 1 should be empty

  Scenario: Start Battle disabled when no characters
    Given I am on the main menu
    When I click character slot 1
    And I click character slot 2
    And I click character slot 3
    And I click character slot 4
    Then the Start Battle button should be disabled

  Scenario: Start Battle enabled with at least 1 character
    Given I am on the main menu
    When I click character slot 1
    Then the Start Battle button should be enabled

  Scenario: Click empty slot assigns next available character
    Given I am on the main menu
    When I click character slot 1
    Then slot 1 should be empty
    When I click character slot 1
    Then slot 1 should display "Warrior"
