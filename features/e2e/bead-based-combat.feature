Feature: Bead-Based Combat System
  As a player
  I want to see and manage beads during combat
  So that I can plan my actions and predict monster behavior

  Background:
    Given I have started a battle with bead system

  Scenario: Players draw beads at battle start
    Then each player should have beads in their hand
    And I should see the bead hand display

  Scenario: Bead hand shows colored beads
    Given I am the current actor
    Then I should see my bead hand with colored circles
    And the beads should be red, blue, green, or white

  Scenario: Rest action draws 2 beads
    Given I am the current actor
    And I have fewer than 12 beads in my hand
    When I click the Rest button
    Then I should have 2 more beads in my hand

  Scenario: Monster draws bead on its turn
    Given the monster is the current actor
    When the monster takes its turn
    Then the monster should draw a bead
    And the drawn bead color should be logged

  Scenario: Monster state transition is visible
    Given the monster is the current actor
    When the monster takes its turn
    Then I should see the monster's new state
    And the battle log should show the transition

  Scenario: Monster discarded beads are visible
    Given the monster has taken several turns
    Then I should see the monster discard counts
    And the discard shows counts by color

  Scenario: Hero HP is 3
    Given I have started a battle with bead system
    Then the hero health should be 3

  Scenario: Monster HP is 10
    Given I have started a battle with bead system
    Then the monster health should be 10

  Scenario: Attack deals fixed 1 damage
    Given I am the current actor
    And I am adjacent to the monster
    When I click the Attack button
    Then the monster should take exactly 1 damage

  Scenario: All monsters use bead-based AI
    Given I select a different monster for battle
    When the battle starts
    Then that monster should have a bead bag
    And that monster should use bead-based actions
