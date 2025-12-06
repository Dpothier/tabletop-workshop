Feature: Token Health Management
  As a game system
  I need to track entity health correctly
  So that damage and healing work properly

  Scenario: Take damage reduces health
    Given a character token with 20 max health
    When the token takes 5 damage
    Then the token should have 15 health

  Scenario: Health cannot go below zero
    Given a character token with 20 max health
    When the token takes 50 damage
    Then the token should have 0 health

  Scenario: Heal restores health
    Given a character token with 20 max health
    And the token has taken 10 damage
    When the token heals for 5
    Then the token should have 15 health

  Scenario: Health cannot exceed maximum
    Given a character token with 20 max health
    And the token has taken 5 damage
    When the token heals for 10
    Then the token should have 20 health

  Scenario: Monster token takes damage
    Given a monster token with 100 max health
    When the monster takes 30 damage
    Then the monster should have 70 health
