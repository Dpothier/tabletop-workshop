Feature: Hero Selection Bar
  As a player
  I want a hero selection bar below the arena
  So that I can see and select my heroes during battle

  Background:
    Given I have started a battle with bead system

  Scenario: Hero bar displays all party members
    Then I should see the hero selection bar
    And the hero bar should show 4 hero cards
    And each hero card should display a class icon
    And each hero card should display an HP bar
    And each hero card should display beads in hand

  Scenario: Current actor is highlighted in hero bar
    Given the first hero is the current actor
    Then the first hero card should be highlighted
    And other hero cards should be dimmed

  Scenario: Clicking current hero in bar selects them
    Given the first hero is the current actor
    When I click the first hero card in the bar
    Then the first hero should be selected

  Scenario: Clicking non-current hero in bar shows feedback
    Given the first hero is the current actor
    When I click the second hero card in the bar
    Then I should see turn rejection feedback in the log
    And the first hero should remain the current actor

  Scenario: Hero card shows updated bead count after rest
    Given the first hero is the current actor
    When I click the Rest button
    And I wait for the turn to complete
    Then the first hero card should show more beads

  @skip
  Scenario: Hero card shows updated HP after taking damage
    Given I wait for the monster to attack a hero
    Then the damaged hero card should show reduced HP
