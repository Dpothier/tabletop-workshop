Feature: Monster Entity with Bead-Based AI
  As a monster entity
  I need to decide my turn based on bead draws and state machine
  So that combat has varied and interesting AI behavior

  Background:
    Given a battle grid of size 9x9

  # Position Delegation

  Scenario: Monster getPosition delegates to grid
    Given a monster "boss" with 30 health at position 5,5
    Then the monster should be at grid position 5,5

  Scenario: Monster moveTo delegates to grid
    Given a monster "boss" with 30 health at position 5,5
    When the monster moves to position 6,5
    Then the monster move result should be successful
    And the monster should be at grid position 6,5

  # Health Management

  Scenario: Monster receives attack and loses health
    Given a monster "boss" with 30 health at position 5,5
    When the monster receives 5 damage
    Then the monster should have 25 health remaining

  Scenario: Monster isAlive checks health
    Given a monster "boss" with 30 health at position 5,5
    When the monster receives 30 damage
    Then the monster should not be alive

  # Bead System

  Scenario: Monster has bead bag initialized
    Given a monster "boss" with 30 health at position 5,5
    And the monster has bead configuration: 3 red, 2 blue, 1 green
    Then the monster should have a bead bag

  Scenario: Monster has state machine initialized
    Given a monster "boss" with 30 health at position 5,5
    And the monster has states: idle, attack, defend with start state "idle"
    Then the monster should have a state machine

  # Turn Decision

  Scenario: Monster decideTurn draws bead and transitions state
    Given a monster "boss" with 30 health at position 5,5
    And the monster has bead configuration: 5 red, 0 blue, 0 green
    And the monster has states: idle, attack with start state "idle"
    And state "idle" transitions to "attack" on red bead
    And a target character at position 6,5
    When the monster decides its turn
    Then the monster action should draw a bead
    And the monster action should have transitioned state

  Scenario: Monster attacks when target in range
    Given a monster "boss" with 30 health at position 5,5
    And the monster has bead configuration: 5 red, 0 blue, 0 green
    And the monster has attack state with range 1 and damage 2
    And a target character at position 6,5
    When the monster decides its turn
    Then the monster action type should be "attack"
    And the monster action target should be the adjacent character

  Scenario: Monster moves toward target when out of range
    Given a monster "boss" with 30 health at position 5,5
    And the monster has bead configuration: 5 red, 0 blue, 0 green
    And the monster has attack state with range 1 and damage 2
    And a target character at position 8,5
    When the monster decides its turn
    Then the monster action type should be "move"

  # Wheel Cost

  Scenario: Monster action includes wheel cost from state
    Given a monster "boss" with 30 health at position 5,5
    And the monster has attack state with wheel cost 3
    And a target character at position 6,5
    When the monster decides its turn
    Then the monster action wheel cost should be 3

  # Defense Stats

  Scenario: Monster has default defense stats of zero
    Given a monster "boss" with 30 health at position 5,5
    Then the monster armor should be 0
    And the monster evasion should be 0

  Scenario: Monster can apply stats from config
    Given a monster "boss" with 30 health at position 5,5
    When the monster applies stats: armor 2, evasion 1
    Then the monster armor should be 2
    And the monster evasion should be 1

  Scenario: Monster getDefenseStats returns correct values
    Given a monster "boss" with 30 health at position 5,5
    When the monster applies stats: armor 2, evasion 3
    Then the monster defense stats should be: armor 2, guard 0, evasion 3

  # Combat Resolution

  Scenario: Monster attack is dodged by high evasion target
    Given a monster "boss" with 30 health at position 5,5
    And the monster has attack state with damage 2, agility 2, and wheel cost 2
    And a target character at position 6,5 with evasion 3
    When the monster decides its turn
    And the monster executes its decision
    Then the target should have 10 health
    And the execution events should contain a dodge event

  Scenario: Monster attack is guarded by high defense target
    Given a monster "boss" with 30 health at position 5,5
    And the monster has attack state with damage 2, agility 3, and wheel cost 2
    And a target character at position 6,5 with armor 2 and guard 1
    When the monster decides its turn
    And the monster executes its decision
    Then the target should have 10 health
    And the execution events should contain a guarded event

  Scenario: Monster attack hits and deals reduced damage
    Given a monster "boss" with 30 health at position 5,5
    And the monster has attack state with damage 3, agility 3, and wheel cost 2
    And a target character at position 6,5 with armor 1 and evasion 1
    When the monster decides its turn
    And the monster executes its decision
    Then the target should have 8 health
    And the execution events should contain a hit event
