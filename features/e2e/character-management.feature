Feature: Character Management
  As a player
  I want to manage my characters
  So that I can edit, delete, and organize my custom characters

  Scenario: Manage Characters button is visible on menu
    Given I am on the main menu
    Then I should see a "Manage Characters" button

  Scenario: Clicking Manage Characters opens the management panel
    Given I am on the main menu
    When I click the "Manage Characters" button
    Then the character management panel should be visible
    And the panel should display all characters

  Scenario: Panel displays character details
    Given I am on the main menu
    When I click the "Manage Characters" button
    Then the panel should show character names and attributes
    And the panel should show character weapons

  Scenario: Default characters have no Edit or Delete buttons
    Given I am on the main menu
    When I click the "Manage Characters" button
    Then default characters should not have Edit or Delete buttons

  Scenario: Custom characters have Edit and Delete buttons
    Given I am on the main menu
    And there are 1 custom characters in storage
    When I click the "Manage Characters" button
    Then custom characters should have Edit and Delete buttons

  Scenario: Delete button is disabled for characters in the party
    Given I am on the main menu
    And there are 1 custom characters in storage
    When I click the "Manage Characters" button
    Then the Delete button should be disabled for characters in the party

  Scenario: Delete flow with confirmation
    Given I am on the main menu
    And there are 1 custom characters in storage
    When I click the "Manage Characters" button
    And I click the Delete button for the custom character
    Then I should see a delete confirmation message
    When I confirm the deletion
    Then the custom character should be removed from the list

  Scenario: Cancel delete restores the row
    Given I am on the main menu
    And there are 1 custom characters in storage
    When I click the "Manage Characters" button
    And I click the Delete button for the custom character
    Then I should see a delete confirmation message
    When I cancel the deletion
    Then the custom character should still be in the list

  Scenario: Edit button navigates to CharacterCreationScene in edit mode
    Given I am on the main menu
    And there are 1 custom characters in storage
    When I click the "Manage Characters" button
    And I click the Edit button for the custom character
    Then I should be on the character creation scene
    And the character name should be pre-filled
