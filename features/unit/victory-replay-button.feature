Feature: VictoryScene Replay button
  As a player
  I want to replay a combat recording from the victory screen
  So that I can review how I won the battle

  Background:
    Given a VictoryScene with mocked Phaser dependencies

  Scenario: VictoryScene shows Replay button when recording has entries
    When the VictoryScene is created with a recording containing 5 entries
    Then an interactive Replay button should exist
    And the Replay button text should read "Replay"

  Scenario: VictoryScene hides Replay button when recording is empty
    When the VictoryScene is created with a recording containing 0 entries
    Then no Replay button should exist

  Scenario: VictoryScene hides Replay button when no recording exists
    When the VictoryScene is created without a recording
    Then no Replay button should exist

  Scenario: Clicking Replay button transitions to ReplayScene
    When the VictoryScene is created with a recording containing 5 entries
    And the Replay button is clicked
    Then the scene should transition to ReplayScene with the recording data
