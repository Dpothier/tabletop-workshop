Feature: TurnFlowController monster turn execution

  As a battle system
  I need TurnFlowController to orchestrate monster turns
  So that monsters can execute their AI-driven actions

  # FR-4.3: Monster turn execution with bead system integration

  Background:
    Given a mock BattleAdapter for turn flow
    And a BattleState with a monster that has a bead system

  Scenario: Monster decides and executes turn
    Given a TurnFlowController with the mock adapter
    And monster.decideTurn returns action with wheelCost 30
    And monster.executeDecision returns animation events
    When I call executeMonsterTurn()
    Then adapter.log is called with "--- Monster Turn ---"
    And adapter.animate is called with the animation events
    And turnController.advanceTurn is called with "monster" and 30
    And adapter.delay is called

  Scenario: Monster without bead system advances with default cost
    Given a TurnFlowController with a monster without bead system
    When I call executeMonsterTurn()
    Then adapter.log is called with "Monster has no bead system!"
    And turnController.advanceTurn is called with "monster" and 2
    And adapter.delay is called
