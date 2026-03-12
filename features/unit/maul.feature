Feature: Maul - Heavy Melee weapon with Crush and Slam
  As a fighter with a Maul
  I need to deal heavy damage with Crush and Slam mechanics
  So that I can control the battlefield with powerful strikes

  Background:
    Given a maul test grid of 12x12
    And a maul test game context with the grid

  # Maul Equipment
  Scenario: Maul has power 2
    When I check the maul test equipment from YAML
    Then the maul test equipment power should be 2

  Scenario: Maul is two-handed
    When I check the maul test equipment from YAML
    Then the maul test equipment twoHanded should be true

  Scenario: Maul has 2 inventory slots
    When I check the maul test equipment from YAML
    Then the maul test equipment inventorySlots should be 2

  Scenario: Maul has Crush in granted modifiers
    When I check the maul test equipment from YAML
    Then the maul test equipment should have modifier "crush"

  Scenario: Maul has Slam in granted modifiers
    When I check the maul test equipment from YAML
    Then the maul test equipment should have modifier "slam"

  # Crush Effect
  Scenario: Crush ignores Guard (Guard treated as 0)
    Given a maul test bearer at position 5,5 with bead hand having 3 red
    And a maul test target "victim" at position 5,6
    When the maul test crush is triggered for "victim" with guard 3
    Then the maul test crush result should be successful
    And the maul test crush effective guard should be 0

  Scenario: Crush costs 1 red bead
    When I check the maul test crush action cost from YAML
    Then the maul test crush cost should have 1 red bead

  # Slam Effect
  Scenario: Slam pushes target 1 tile in straight line
    Given a maul test bearer at position 5,5
    And a maul test target "victim" at position 5,6
    When the maul test slam is triggered for "victim" pushing vertically
    Then the maul test slam result should be successful
    And the maul test target "victim" should be at position 5,7

  Scenario: Slam inflicts 1 collision damage on obstacle
    Given a maul test bearer at position 5,5
    And a maul test target "victim" at position 5,6 with 20 health
    And a maul test obstacle at position 5,7
    When the maul test slam is triggered for "victim" pushing vertically
    Then the maul test slam result should be successful
    And the maul test target "victim" should be at position 5,6
    And the maul test target "victim" should have 19 health

  Scenario: Slam inflicts 1 collision damage on entity
    Given a maul test bearer at position 5,5
    And a maul test target "victim" at position 5,6 with 20 health
    And a maul test blocker "ally" at position 5,7
    When the maul test slam is triggered for "victim" pushing vertically
    Then the maul test slam result should be successful
    And the maul test target "victim" should be at position 5,6
    And the maul test target "victim" should have 19 health

  Scenario: Slam costs 1 red and 1 green bead
    When I check the maul test slam action cost from YAML
    Then the maul test slam cost should have 1 red bead
    And the maul test slam cost should have 1 green bead

  Scenario: Crush and Slam can both be granted by Maul
    When I check the maul test equipment from YAML
    Then the maul test equipment should have modifier "crush"
    And the maul test equipment should have modifier "slam"
