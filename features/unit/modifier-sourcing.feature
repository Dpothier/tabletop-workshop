Feature: Modifier Sourcing System
  As a player
  I want each modifier tied to its equipment source
  So that I understand why I have access to a modifier and how many times I can use it

  Scenario: A modifier is usable once per source per trigger
    Given an action with option "strength" that modifies "attack-1" with damage +1
    And a main-hand weapon "Long Sword" that grants modifier "strength"
    When I resolve sourced options
    Then I should get exactly 1 instance of "strength"

  Scenario: Two different sources granting the same modifier allow using it twice
    Given an action with option "strength" that modifies "attack-1" with damage +1
    And a main-hand weapon "Long Sword" that grants modifier "strength"
    And an accessory "Ring of Power" that grants modifier "strength"
    When I resolve sourced options
    Then I should get 2 instances of "strength"
    And one instance should be sourced from "Long Sword"
    And one instance should be sourced from "Ring of Power"

  Scenario: Only main-hand grants modifiers - off-hand does not
    Given an action with option "strength" that modifies "attack-1" with damage +1
    And a main-hand weapon "Long Sword" that grants modifier "strength"
    And an off-hand weapon "Short Sword" that grants modifier "strength"
    When I resolve sourced options
    Then I should get exactly 1 instance of "strength"
    And that instance should be sourced from "Long Sword"

  Scenario: Each modifier instance displays its source name
    Given an action with option "strength" that modifies "attack-1" with damage +1
    And a main-hand weapon "Long Sword" that grants modifier "strength"
    When I resolve sourced options
    Then the display label should be "Strength (Long Sword)"

  Scenario: Each instance cost is paid independently
    Given an action with option "strength" that modifies "attack-1" with damage +1 costing 1 red bead
    And a main-hand weapon "Long Sword" that grants modifier "strength"
    And an accessory "Ring of Power" that grants modifier "strength"
    When I resolve sourced options
    Then each instance should have the original option cost

  Scenario: A character without a source for a modifier does not see it
    Given an action with option "strength" that modifies "attack-1" with damage +1
    And a main-hand weapon "Long Sword" that grants modifier "precision"
    When I resolve sourced options
    Then I should get 0 instances of "strength"
