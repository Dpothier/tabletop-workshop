Feature: TurnFlowController game loop

  As a battle system
  I need TurnFlowController to manage the game loop's victory and defeat transitions
  So that the game can automatically transition to the appropriate end scene

  # FR-4.6: Victory/defeat scene transitions

  Scenario: Victory triggers scene transition
    Given a TurnFlowController where checkBattleStatus returns "victory"
    And the monster name is "Goblin"
    When I call start()
    Then adapter.transition is called with "VictoryScene" and victory true
    And the start method returns

  Scenario: Defeat triggers scene transition
    Given a TurnFlowController where checkBattleStatus returns "defeat"
    And the monster name is "Goblin"
    When I call start()
    Then adapter.transition is called with "VictoryScene" and victory false
    And the start method returns

  # FR-4.7: Turn alternation and actor change events

  Scenario: Turns alternate between monster and heroes
    Given a TurnFlowController for turn alternation
    And getNextActor returns "hero-0" then "monster" then victory
    When I call start()
    Then executePlayerTurn is called for "hero-0"
    And executeMonsterTurn is called
    And adapter.transition is called

  Scenario: stateObserver receives actor change events
    Given a TurnFlowController for turn alternation
    And getNextActor returns "hero-0" then victory
    When I call start()
    Then stateObserver.emitActorChanged is called with "hero-0"
