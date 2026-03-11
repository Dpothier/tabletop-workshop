Feature: Phoenix Heart Full Flow Integration
  As a game system
  I need to handle the complete Phoenix Rebirth spell flow
  So that stabilization with burst and ignite works correctly

  Scenario: Cast Phoenix Rebirth + Burst + Ignite - ally stabilized, adjacents take damage + Burn
    Given a phoenix integration grid of 12x12
    And a phoenix integration game context with the grid
    And a phoenix integration caster at position 1,1
    And a phoenix integration ally "target-ally" at position 1,2 with 10 max health and 7 current health
    And a phoenix integration enemy "burst-target" at position 1,3 with 0 ward
    When the phoenix integration full chain is cast targeting "phoenix-integration-target-ally" with burst and ignite
    Then the phoenix integration ally "phoenix-integration-target-ally" should have 1 stabilized wound
    And the phoenix integration enemy "phoenix-integration-burst-target" should have taken 1 damage
    And the phoenix integration enemy "phoenix-integration-burst-target" should have burn status
    And the phoenix integration caster should be at position 1,1
