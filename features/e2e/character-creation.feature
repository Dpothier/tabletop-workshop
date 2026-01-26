Feature: Character Creation Scene
  As a player
  I want to create a new character with a unique name
  So that I can customize my party for battle

  Scenario: Navigate to character creation from menu
    Given I am on the main menu
    When I click the Create Character button
    Then I should see the character creation scene
    And the name input field should be focused
    And the character name field should be empty

  @wip
  Scenario: Enter a valid character name and see preview
    Given I am on the character creation scene
    When I type "Archer" into the name field
    Then the name field should contain "Archer"
    And the token preview should show "A" as the first letter
    And the preview icon should be visible

  Scenario: Character name cannot exceed 20 characters
    Given I am on the character creation scene
    When I type "ThisNameIsWayTooLongToBeValid" into the name field
    Then the name field should contain exactly 20 characters
    And the remaining characters display should show "0"

  Scenario: Real-time character count shows remaining characters
    Given I am on the character creation scene
    When I type "Alice" into the name field
    Then the remaining characters display should show "15"
    When I clear the name field
    Then the remaining characters display should show "20"

  @wip
  Scenario: Empty name shows error when trying to proceed
    Given I am on the character creation scene
    And the name field is empty
    When I click the Continue button
    Then an error message should appear saying "Name is required"
    And I should remain on the character creation scene

  @wip
  Scenario: Duplicate name shows error when trying to proceed
    Given there is a character named "Barbarian" in storage
    And I am on the character creation scene
    When I type "Barbarian" into the name field
    And I click the Continue button
    Then an error message should appear saying "Name already taken"
    And I should remain on the character creation scene

  Scenario: Cancel button returns to menu
    Given I am on the character creation scene
    When I type "Wizard" into the name field
    And I click the Cancel button
    Then I should see the main menu

  @wip
  Scenario: Clear name clears the preview
    Given I am on the character creation scene
    When I type "Warrior" into the name field
    And the token preview should show "W" as the first letter
    And I clear the name field
    Then the token preview should be empty or hidden
    And the preview should reset

  @wip
  Scenario: Multiple valid character names with different first letters
    Given I am on the character creation scene
    When I type "Paladin" into the name field
    Then the token preview should show "P" as the first letter
    When I clear the name field
    And I type "Rogue" into the name field
    Then the token preview should show "R" as the first letter
    When I clear the name field
    And I type "Mage" into the name field
    Then the token preview should show "M" as the first letter

  @wip
  Scenario: Special characters in name are allowed
    Given I am on the character creation scene
    When I type "Sir-Kane" into the name field
    Then the name field should contain "Sir-Kane"
    And the token preview should show "S" as the first letter
