Feature: CoordinateEffect
  As a game developer
  I need CoordinateEffect to grant preparation stacks to allied entities
  So that players can coordinate with allies to prepare them for action

  Background:
    Given a battle grid of size 9x9
    And a game context with the grid

  Scenario: Coordinate grants 1 preparation stack to the targeted ally
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "hero-1" with 10 health registered at position 4,4
    When I execute CoordinateEffect with targetId "hero-1" and prepType "windup"
    Then the coordinate effect result should be successful
    And the entity "hero-1" should have 1 stacks of "windup"

  Scenario: The ally chooses the preparation type (Aim)
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "hero-1" with 10 health registered at position 4,4
    When I execute CoordinateEffect with targetId "hero-1" and prepType "aim"
    Then the coordinate effect result should be successful
    And the entity "hero-1" should have 1 stacks of "aim"

  Scenario: Coordinate fails if ally is out of range (>6 tiles)
    Given an entity "hero-0" with 10 health registered at position 0,0
    And an entity "hero-1" with 10 health registered at position 8,8
    When I execute CoordinateEffect with targetId "hero-1" and prepType "windup"
    Then the coordinate effect result should fail
    And the coordinate effect reason should be "Target is out of range"
    And the entity "hero-1" should have 0 stacks of "windup"

  Scenario: Standard interruption rules apply to the granted stack
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "hero-1" with 10 health registered at position 4,4
    When I execute CoordinateEffect with targetId "hero-1" and prepType "windup"
    Then the coordinate effect result should be successful
    And the entity "hero-1" should have 1 stacks of "windup"
    When the coordinated entity "hero-1" preparations are interrupted by damage
    Then the entity "hero-1" should have 0 stacks of "windup"

  Scenario: Coordinate action has correct cost definition
    When I load the action "coordinate" from actions yaml
    Then the action cost should have field "time" with value 1
    And the action cost should have field "white" with value 1
    And the action parameter range should be "1-6"
