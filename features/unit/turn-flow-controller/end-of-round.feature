Feature: End-of-Round Resolution in TurnFlowController

  As a game designer
  I need the TurnFlowController to resolve status effects when a round ends
  So that burn damage and other round-end effects are applied between rounds

  Scenario: Burn damage is applied when round ends
    Given a TurnFlowController with round-end resolution
    And entity "hero-0" has 3 burn stacks
    When a round completes
    Then entity "hero-0" should have taken 3 burn damage
    And entity "hero-0" should have 0 burn stacks remaining

  Scenario: Multiple entities with burn take damage at round end
    Given a TurnFlowController with round-end resolution
    And entity "hero-0" has 2 burn stacks
    And entity "hero-1" has 4 burn stacks
    When a round completes
    Then entity "hero-0" should have taken 2 burn damage
    And entity "hero-1" should have taken 4 burn damage

  Scenario: Entities without burn are unaffected at round end
    Given a TurnFlowController with round-end resolution
    And entity "hero-0" has 0 burn stacks
    When a round completes
    Then entity "hero-0" should have taken 0 burn damage

  Scenario: roundEnded event is emitted when round completes
    Given a TurnFlowController with round-end resolution
    When a round completes
    Then the stateObserver should have emitted roundEnded

  Scenario: No round-end resolution when round has not completed
    Given a TurnFlowController with round-end resolution
    And entity "hero-0" has 3 burn stacks
    When a turn completes without completing a round
    Then entity "hero-0" should have taken 0 burn damage
    And entity "hero-0" should still have 3 burn stacks
