Feature: AssessEffect
  As a game developer
  I need AssessEffect to reveal a monster's next planned action
  So that players can adapt their strategy

  Background:
    Given a battle grid of size 9x9
    And a game context with the grid

  Scenario: Assess reveals the next action of the targeted monster
    Given an entity "hero-0" with 10 health registered at position 0,0
    And a monster "goblin" with 20 health and cunning state machine at position 3,3
    And the actor is "hero-0"
    When I execute AssessEffect on target "goblin"
    Then the assess effect result should be successful
    And the assess result should contain next action information

  Scenario: Assess costs 1 blue bead (base cost)
    When I load the action "assess" from actions yaml
    Then the action cost should have field "blue" with value 1
    And the action cost should have field "time" with value 1

  Scenario: Assess can be paid with 1 Ponder stack
    Given an entity "hero-0" with 10 health registered at position 0,0
    And a monster "goblin" with 20 health and cunning state machine at position 3,3
    And the entity "hero-0" has 1 ponder stacks
    And the actor is "hero-0"
    When I execute AssessEffect on target "goblin" paying with ponder
    Then the assess effect result should be successful
    And the entity "hero-0" should have 0 ponder stacks remaining

  Scenario: Additional cost based on Cunning of monster's last completed action
    Given an entity "hero-0" with 10 health registered at position 0,0
    And a monster "goblin" with 20 health and cunning state machine at position 3,3
    And the monster "goblin" has completed an action with cunning 2
    And the actor is "hero-0"
    When I execute AssessEffect on target "goblin"
    Then the assess effect result should be successful
    And the assess result additional cost should be 2

  Scenario: Monster with no previous action has Cunning 0 (base cost only)
    Given an entity "hero-0" with 10 health registered at position 0,0
    And a monster "goblin" with 20 health and cunning state machine at position 3,3
    And the actor is "hero-0"
    When I execute AssessEffect on target "goblin"
    Then the assess effect result should be successful
    And the assess result additional cost should be 0

  Scenario: Assess fails if target is out of range (>6 tiles)
    Given an entity "hero-0" with 10 health registered at position 0,0
    And a monster "goblin" with 20 health and cunning state machine at position 8,8
    And the actor is "hero-0"
    When I execute AssessEffect on target "goblin"
    Then the assess effect result should fail
    And the assess effect reason should be "Target is out of range"

  Scenario: Revealed information is publicly accessible
    Given an entity "hero-0" with 10 health registered at position 0,0
    And a monster "goblin" with 20 health and cunning state machine at position 3,3
    And the actor is "hero-0"
    When I execute AssessEffect on target "goblin"
    Then the assess effect result should be successful
    And the assess result should be public
