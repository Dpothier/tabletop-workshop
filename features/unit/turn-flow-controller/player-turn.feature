Feature: TurnFlowController player turn execution

  As a battle system
  I need TurnFlowController to orchestrate player turns
  So that players can execute their character's actions in turn

  # FR-4.4: Player turn execution - success path

  Background:
    Given a TurnFlowController with mock adapter and action registry

  Scenario: Player executes action successfully
    Given adapter.awaitPlayerAction returns "strike"
    And action "strike" resolves successfully with cost time 20
    When I call executePlayerTurn with "hero-0"
    Then adapter.showPlayerTurn is called with "hero-0"
    And adapter.awaitPlayerAction is called with "hero-0"
    And turnController.advanceTurn is called with "hero-0" and 20
    And adapter.delay is called

  # FR-4.5: Player turn execution - cancellation and failure paths

  Scenario: Player cancels first action and chooses another
    Given adapter.awaitPlayerAction returns "move" then "strike"
    And action "move" is cancelled by user
    And action "strike" resolves successfully with cost time 15
    When I call executePlayerTurn with "hero-0"
    Then adapter.awaitPlayerAction is called twice
    And adapter.log is called with "Action cancelled"
    And turnController.advanceTurn is called with "hero-0" and 15

  Scenario: Player action fails but turn still advances
    Given adapter.awaitPlayerAction returns "attack"
    And action "attack" fails with reason "Target blocked"
    When I call executePlayerTurn with "hero-0"
    Then adapter.log is called with "Target blocked"
    And turnController.advanceTurn is called with "hero-0" and 0
