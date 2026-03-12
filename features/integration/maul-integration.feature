Feature: Maul Integration - Crush and Slam Combined
  As a game system
  I need to handle the complete Maul attack flow with Crush and Slam
  So that both effects work correctly together in a single attack

  Scenario: Attack with Crush and Slam combined - Guard ignored and target pushed
    Given a maul integration grid of 12x12
    And a maul integration game context with the grid
    And a maul integration bearer at position 5,5 with bead hand having 2 red and 1 green
    And a maul integration target "enemy" at position 5,6 with 30 health and 2 guard
    When the maul integration crush is triggered for "maul-integration-enemy" with guard 2
    Then the maul integration crush result should be successful
    And the maul integration crush effective guard should be 0
    When the maul integration slam is triggered for "maul-integration-enemy" pushing vertically
    Then the maul integration slam result should be successful
    And the maul integration target "maul-integration-enemy" should be at position 5,7
