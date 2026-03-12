Feature: TurnFlowController turn counter
  As a player
  I want VictoryScene to display the correct number of turns played
  So that I can see how many turns the combat took

  # MFG-71: Turn counter currently hardcoded to 0

  Scenario: Turn counter starts at zero
    Given a TurnFlowController where checkBattleStatus returns "victory"
    And the monster name is "Goblin"
    When I call start()
    Then adapter.transition is called with "VictoryScene" and turns 0

  Scenario: Turn counter increments for each player turn
    Given a TurnFlowController for turn alternation
    And getNextActor returns "hero-0" then "hero-1" then victory
    When I call start()
    Then adapter.transition is called with "VictoryScene" and turns 2

  Scenario: Turn counter does not increment for monster turns
    Given a TurnFlowController for turn alternation
    And getNextActor returns "monster" then "hero-0" then victory
    When I call start()
    Then adapter.transition is called with "VictoryScene" and turns 1

  Scenario: Turn counter counts multiple hero turns correctly
    Given a TurnFlowController for turn alternation
    And getNextActor returns "hero-0" then "monster" then "hero-1" then victory
    When I call start()
    Then adapter.transition is called with "VictoryScene" and turns 2
