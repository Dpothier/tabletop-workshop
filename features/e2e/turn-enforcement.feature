Feature: Turn Enforcement
  As a player
  I want only the current actor to be able to act
  So that the action wheel turn order is properly enforced

  Background:
    Given I have started a battle with bead system

  Scenario: Only current actor can perform actions
    Given the first hero is the current actor
    When I click on a different hero token
    Then the different hero should not become selected
    And the current actor should remain selected

  Scenario: Clicking non-current actor shows feedback
    Given the first hero is the current actor
    When I click on the second hero token
    Then I should see turn rejection feedback in the log

  Scenario: Current actor is auto-selected on their turn
    Given the first hero is the current actor
    Then the first hero should be automatically selected
    And the action buttons should be visible
