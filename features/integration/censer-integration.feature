Feature: Censer Full Flow Integration
  As a game system
  I need to handle the complete Bless and Gold bead spending flow
  So that support resource management works correctly

  Scenario: Bless grants gold bead which ally spends as red
    Given a censer integration grid of 12x12
    And a censer integration game context with the grid
    And a censer integration caster at position 1,1
    And a censer integration ally "fighter" at position 1,2 with bead hand having 0 red 1 blue 1 green 1 white
    When the censer integration bless is cast targeting "censer-integration-fighter"
    Then the censer integration ally "censer-integration-fighter" should have 1 gold bead
    And the censer integration ally "censer-integration-fighter" can afford 1 red bead
    When the censer integration ally "censer-integration-fighter" spends red
    Then the censer integration ally "censer-integration-fighter" should have 0 gold beads
    And the censer integration spend result should be successful

  Scenario: Renew grants extra bead draw that persists in hand
    Given a censer integration grid of 12x12
    And a censer integration game context with the grid
    And a censer integration caster at position 1,1
    And a censer integration ally "mage" at position 1,2 with bead hand containing 3 red 3 blue 3 green 3 white in bag
    When the censer integration renew is cast targeting "censer-integration-mage"
    Then the censer integration ally "censer-integration-mage" should have 1 bead in hand
