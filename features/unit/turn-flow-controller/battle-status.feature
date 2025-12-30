Feature: TurnFlowController battle status detection
  As a battle system
  I need TurnFlowController to detect battle status transitions
  So that the game can determine when to transition to victory/defeat scenes

  # FR-4.2: Battle status delegation to TurnController
  Scenario: Victory when monster is dead
    Given a TurnFlowController with a dead monster and alive heroes
    When I call checkBattleStatus()
    Then it returns "victory"

  Scenario: Defeat when all heroes are dead
    Given a TurnFlowController with an alive monster and dead heroes
    When I call checkBattleStatus()
    Then it returns "defeat"

  Scenario: Ongoing when battle continues
    Given a TurnFlowController with alive monster and heroes
    When I call checkBattleStatus()
    Then it returns "ongoing"
