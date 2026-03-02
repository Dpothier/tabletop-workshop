Feature: Monster Turn Integration
  As a player
  I want the monster to act automatically when it has the lowest wheel position
  So that combat flows naturally between players and monsters

  Scenario: Monster acts when at lowest wheel position
    Given I have started a 1-hero battle
    And I am the current actor
    When I complete an action
    Then the monster should be the current actor
    And the monster should draw a bead and act
