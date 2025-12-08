Feature: Action Wheel Battle System
  As a player
  I want combat to use the action wheel for turn order
  So that faster actions let me act more frequently

  Background:
    Given I have started a battle with bead system

  Scenario: Battle shows action wheel display
    Then I should see the action wheel UI
    And all entities should start at position 0

  Scenario: Next actor is determined by wheel position
    Then the first character should be the current actor
    And I should see the action buttons for the current actor

  # TODO: Movement tile click coordinates need visual debugging
  @skip
  Scenario: Move action advances wheel by 1
    Given I am the current actor
    When I click the Move button
    And I click a valid movement tile
    Then my wheel position should be 1
    And the next actor should be determined

  # TODO: Movement tile click coordinates need visual debugging
  @skip
  Scenario: Run action advances wheel by 2
    Given I am the current actor
    When I click the Run button
    And I click a valid movement tile
    Then my wheel position should be 2

  # TODO: Movement to adjacent position needs visual debugging
  @skip
  Scenario: Attack action advances wheel by 2
    Given I am the current actor
    And I am adjacent to the monster
    When I click the Attack button
    Then the monster should take 1 damage
    And my wheel position should be 2

  Scenario: Rest action advances wheel by 2
    Given I am the current actor
    When I click the Rest button
    Then I should draw 2 beads
    And my wheel position should be 2

  Scenario: Continuous turn flow without End Turn button
    Given I am the current actor
    When I complete an action
    Then the next actor automatically takes their turn
    And there is no End Turn button

  Scenario: Monster acts when at lowest wheel position
    Given all players have higher wheel positions than the monster
    Then the monster should be the current actor
    And the monster should draw a bead and act

  Scenario: Action buttons show wheel cost
    Given I am the current actor
    Then the Move button should show cost 1
    And the Run button should show cost 2
    And the Attack button should show cost 2
    And the Rest button should show cost 2
