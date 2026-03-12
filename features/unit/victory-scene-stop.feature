Feature: VictoryScene stops when transitioning to ReplayScene
  As a player
  I want only one scene active at a time
  So that VictoryScene UI doesn't overlap ReplayScene

  Background:
    Given a VictoryScene with mocked Phaser dependencies

  Scenario: Clicking Replay stops VictoryScene before starting ReplayScene
    When the VictoryScene is created with a recording containing 5 entries
    And the Replay button is clicked
    Then the scene should call stop before starting ReplayScene

  Scenario: Clicking Play Again stops VictoryScene before starting MenuScene
    When the VictoryScene is created with a recording containing 5 entries
    And the Play Again button is clicked
    Then the scene should transition to MenuScene
