Feature: TurnFlowController uses initial snapshot for recording
  As a game system
  I want the recording snapshot to reflect battle start state
  So that replay begins from the correct initial positions and health

  Scenario: buildRecording uses initialSnapshot from BattleState
    Given a TurnFlowController where checkBattleStatus returns "victory"
    And the monster name is "Goblin"
    And the battle state has an initialSnapshot with monster HP 200
    When I call start()
    Then the recording snapshot should have monster HP 200

  Scenario: buildRecording returns null when no initialSnapshot exists
    Given a TurnFlowController where checkBattleStatus returns "victory"
    And the monster name is "Goblin"
    And the battle state has no initialSnapshot
    When I call start()
    Then adapter.transition should receive no recording
