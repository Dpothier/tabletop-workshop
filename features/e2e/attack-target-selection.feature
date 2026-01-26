Feature: Attack Target Selection
  As a player
  I want to select which enemy to attack
  So that I can strategically choose my targets

  Background:
    Given I have started a battle with bead system

  Scenario: Attack button disabled when no enemy in range
    Given the first hero is the current actor
    And the hero is not adjacent to any enemy
    When I click the first hero card in the bar
    Then the Attack button should be disabled

  Scenario: Attack button enabled when enemy is adjacent
    Given the first hero is the current actor
    And I am adjacent to the monster
    When I click the first hero card in the bar
    Then the Attack button should be enabled

  Scenario: Attack button enabled when enemy is diagonally adjacent
    Given the first hero is the current actor
    And the hero is diagonally adjacent to the monster
    When I click the first hero card in the bar
    Then the Attack button should be enabled

  Scenario: Clicking attack executes on adjacent enemy
    Given the first hero is the current actor
    And I am adjacent to the monster
    When I click the first hero card in the bar
    And I click the Attack button
    Then the monster should take exactly 1 damage

  Scenario: Action selection works after attacking
    Given the first hero is the current actor
    And I am adjacent to the monster
    When I click the first hero card in the bar
    And I click the Attack button
    And I wait for the attack animation to complete
    Then the turn should advance to next actor
    And I should be able to select actions for the current actor

  Scenario: Feint Attack button is enabled when adjacent to enemy and has blue beads
    Given the first hero is the current actor
    And I am adjacent to the monster
    And the current hero has 1 blue bead in hand
    When I click the first hero card in the bar
    And I click the Attacks tab
    Then the Feint Attack button should be enabled

  Scenario: Feint Attack shows entity target selector
    Given the first hero is the current actor
    And I am adjacent to the monster
    And the current hero has 1 blue bead in hand
    When I click the first hero card in the bar
    And I click the Attacks tab
    And I click the Feint Attack button
    Then I should see the entity target selector
    And the monster should be highlighted as a valid target

  Scenario: Selecting target with Feint Attack executes the attack
    Given the first hero is the current actor
    And I am adjacent to the monster
    And the current hero has 1 blue bead in hand
    When I click the first hero card in the bar
    And I click the Attacks tab
    And I click the Feint Attack button
    And I click on the monster as target
    Then the monster should take damage from Feint Attack

  Scenario: Game remains responsive after using Feint Attack
    Given the first hero is the current actor
    And I am adjacent to the monster
    And the current hero has 1 blue bead in hand
    When I click the first hero card in the bar
    And I click the Attacks tab
    And I click the Feint Attack button
    And I click on the monster as target
    And I wait for the attack animation to complete
    Then the turn should advance to next actor
    And I should be able to select actions for the current actor
