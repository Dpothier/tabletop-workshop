Feature: Combat Export & Import
  As a player
  I want to export battle recordings as JSONL files
  And replay saved combats from a menu
  So that I can review past battles and archive my gameplay

  Scenario: Export button appears on victory screen after battle
    Given I have export-import navigated to the victory screen after a combat victory
    Then the export button should be visible on the victory screen
    And the export button should be positioned below the Main Menu button

  Scenario: Clicking Export button triggers JSONL file download
    Given I have export-import navigated to the victory screen with a recorded combat
    Then the export button should be visible on the victory screen
    When I export-import click the export button
    Then a JSONL file download should be triggered

  Scenario: Exported JSONL file contains valid snapshot in first line
    Given I have export-import navigated to the victory screen with a recorded combat
    When I export-import capture the downloaded file contents
    Then the export first line should be valid JSON with type snapshot
    And the export snapshot should have version 1
    And the export snapshot should contain arena characters and monster data

  Scenario: Menu shows Rejouer un combat button
    Given I am on the main menu
    Then the export-import replay button should be visible on the menu
    And the replay button should be positioned below the Manage Characters button

  Scenario: Clicking Rejouer un combat shows list of saved combats
    Given I am on the main menu
    And there are 2 export-import recorded combats in local storage
    When I export-import click the replay button
    Then the recent combats panel should appear
    And the panel should display both saved combats with monster names and outcomes

  Scenario: Selecting a recent combat launches ReplayScene
    Given I am on the main menu
    And there are export-import recorded combats in local storage
    When I export-import click the replay button
    And I export-import select the first recorded combat
    Then the export-import ReplayScene should load
    And the export-import selected combat recording should be displayed

  Scenario: Loading a valid JSONL file via file upload launches ReplayScene
    Given I am on the main menu
    When I export-import click the replay button
    Then the export-import file upload button should be visible in the panel
    When I export-import upload a valid JSONL combat recording file
    Then the export-import ReplayScene should load
    And the export-import uploaded recording should be displayed

  @wip
  Scenario: Combat recording captures entries during a real battle
    Given I have started a battle via character selection
    When I play at least one full hero turn
    Then the recorder should not be undefined
    And the recorder should contain at least turn-start and wheel-advance entries

  @wip
  Scenario: Recording is passed to VictoryScene with non-empty entries
    Given I have played a combat to completion with monster killed
    Then VictoryScene recording entries should have length greater than 0
    And the entries should include at least one attack-attempt and one combat-outcome entry

  Scenario: Loading an invalid JSONL file shows error message
    Given I am on the main menu
    When I export-import click the replay button
    And I export-import upload an invalid JSONL file
    Then an export-import error message should appear in the replay panel
    And the export-import error should describe the validation failure
