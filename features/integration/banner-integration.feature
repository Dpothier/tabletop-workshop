Feature: Banner Full Flow Integration
  As a game system
  I need to handle the complete Banner Rally and Inspire flow
  So that defensive support at range works correctly

  Scenario: Ally with Windup attacked - Rally cancels interruption
    Given a banner integration grid of 12x12
    And a banner integration game context with the grid
    And a banner integration bearer at position 5,5 with bead hand having 3 white
    And a banner integration ally "fighter" at position 5,7 with 3 windup stacks
    When the banner integration ally "banner-integration-fighter" would be interrupted
    And the banner integration rally is triggered for "banner-integration-fighter"
    Then the banner integration ally "banner-integration-fighter" should have 3 windup stacks
    And the banner integration rally result should be successful

  Scenario: Ally attacked at range 4 - Inspire grants +1 Guard
    Given a banner integration grid of 12x12
    And a banner integration game context with the grid
    And a banner integration bearer at position 1,1 with bead hand having 3 white
    And a banner integration ally "defender" at position 5,1 with 0 guard
    When the banner integration inspire is triggered for "banner-integration-defender"
    Then the banner integration ally "banner-integration-defender" should have 1 guard
    And the banner integration inspire result should be successful
