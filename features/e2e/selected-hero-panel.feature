Feature: Selected Hero Panel
  As a player
  I want a panel showing my selected hero's details
  So that I can see inventory and choose actions

  Background:
    Given I have started a battle with bead system

  Scenario: Panel shows when hero is selected
    Given the first hero is the current actor
    When I click the first hero card in the bar
    Then the selected hero panel should be visible
    And the panel should show the selected hero ID

  Scenario: Panel displays action buttons with costs
    Given the first hero is the current actor
    When I click the first hero card in the bar
    Then the panel should show the Move action with cost 1
    And the panel should show the Run action with cost 2
    And the panel should show the Attack action with cost 2
    And the panel should show the Rest action with cost 2

  Scenario: Panel hides during monster turn
    Given I wait until the monster is the current actor
    Then the selected hero panel should not be visible

  Scenario: Panel updates when different hero selected
    Given the first hero is the current actor
    And I click the first hero card in the bar
    When I click the Rest button from panel
    And I wait for the turn to complete
    And the second hero becomes the current actor
    And I click the second hero card in the bar
    Then the panel should show the second hero ID
