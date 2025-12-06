Feature: Turn Manager
  As a game system
  I need to track turns and detect victory/defeat conditions
  So that the game can progress and end properly

  Background:
    Given a game with 3 characters and 1 monster

  Scenario: Increment turn counter
    Given the current turn is 1
    When a turn ends
    Then the current turn should be 2

  Scenario: Get alive characters filters dead ones
    Given character 1 has 0 health
    When I get alive characters
    Then I should have 2 alive characters

  Scenario: Detect party defeat when all dead
    Given all characters have 0 health
    When I check if party is defeated
    Then the party should be defeated

  Scenario: Party not defeated with survivors
    Given character 1 has 0 health
    And character 2 has 10 health
    When I check if party is defeated
    Then the party should not be defeated

  Scenario: Detect monster defeat when HP is 0
    Given the monster has 0 health
    When I check if monster is defeated
    Then the monster should be defeated

  Scenario: Monster not defeated with remaining HP
    Given the monster has 50 health
    When I check if monster is defeated
    Then the monster should not be defeated
