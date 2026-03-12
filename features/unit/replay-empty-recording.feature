Feature: ReplayScene empty recording handling
  As a game designer
  I want ReplayScene to show a clear error message when a recording has no entries
  So that I understand the recording is empty instead of seeing a broken UI

  Background:
    Given a ReplayScene with mocked Phaser dependencies

  Scenario: empty recording displays error message
    When the scene is created with an empty recording
    Then the info panel should display "No combat data to replay"
    And the progress text should display "No data"

  Scenario: empty recording disables Next and Auto buttons
    When the scene is created with an empty recording
    Then the Next button should have interactivity removed
    And the Auto button should have interactivity removed
    And the Next button alpha should be 0.3
    And the Auto button alpha should be 0.3

  Scenario: empty recording still shows Menu button
    When the scene is created with an empty recording
    Then the Menu button should be visible

  Scenario: empty recording exposes state for testing
    When the scene is created with an empty recording
    Then getState should return totalSteps equal to 0
    And getState should return scene equal to "ReplayScene"
