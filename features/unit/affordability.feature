Feature: Affordability checks
  Utility to verify if a player can afford an action cost

  Scenario: Can afford when resources exactly match cost
    Given available resources "{ time: 2, red: 1 }"
    And required cost "{ time: 2, red: 1 }"
    Then canAfford should return true

  Scenario: Cannot afford when time is insufficient
    Given available resources "{ time: 1 }"
    And required cost "{ time: 2 }"
    Then canAfford should return false

  Scenario: Cannot afford when beads are insufficient
    Given available resources "{ time: 2, red: 0 }"
    And required cost "{ time: 2, red: 1 }"
    Then canAfford should return false

  Scenario: Can afford with excess resources
    Given available resources "{ time: 5, red: 3, blue: 2 }"
    And required cost "{ time: 2, red: 1 }"
    Then canAfford should return true

  Scenario: Missing bead type treated as zero
    Given available resources "{ time: 2 }"
    And required cost "{ time: 2, green: 1 }"
    Then canAfford should return false

  Scenario: Can afford zero-cost action
    Given available resources "{ time: 0 }"
    And required cost "{ time: 0 }"
    Then canAfford should return true
