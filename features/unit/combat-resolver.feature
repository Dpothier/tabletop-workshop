Feature: Combat Resolver
  As a game system
  I need to resolve combat correctly
  So that attacks deal appropriate damage

  Background:
    Given a combat resolver

  Scenario: Calculate damage with armor reduction
    When calculating damage of 10 against 3 armor
    Then the calculated damage should be 7

  Scenario: Minimum damage is zero
    When calculating damage of 2 against 5 armor
    Then the calculated damage should be 0

  Scenario: Zero armor means full damage
    When calculating damage of 8 against 0 armor
    Then the calculated damage should be 8

  Scenario: Calculate Manhattan distance
    When calculating distance from 2,2 to 5,4
    Then the distance should be 5

  Scenario: Distance to same position is zero
    When calculating distance from 3,3 to 3,3
    Then the distance should be 0

  Scenario: Target in melee range
    Given an attacker at position 3,3
    And a target at position 4,3
    When checking if target is in range 1
    Then the target should be in range

  Scenario: Target out of melee range
    Given an attacker at position 3,3
    And a target at position 6,3
    When checking if target is in range 1
    Then the target should not be in range

  Scenario: Target in extended range
    Given an attacker at position 3,3
    And a target at position 6,3
    When checking if target is in range 3
    Then the target should be in range

  Scenario: Target at exact range boundary
    Given an attacker at position 0,0
    And a target at position 2,1
    When checking if target is in range 3
    Then the target should be in range

  Scenario: Target just outside range boundary
    Given an attacker at position 0,0
    And a target at position 2,2
    When checking if target is in range 3
    Then the target should not be in range
