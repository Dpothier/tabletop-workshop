Feature: Great Shield - Shield with Great Guard and Shield Wall reactions
  As a defensive character with a Great Shield
  I need to protect myself with Great Guard and shield adjacent allies with Shield Wall
  So that I can be a frontline group defender at the cost of attack capability

  Background:
    Given a great shield test grid of 12x12
    And a great shield test game context with the grid

  # Great Guard - Self Defense +1 Guard
  Scenario: Great Guard adds +1 Guard to bearer
    Given a great shield test bearer at position 5,5 with bead hand having 3 red and 0 guard
    When the great shield test great guard is triggered
    Then the great shield test great guard result should be successful
    And the great shield test bearer should have 1 guard

  Scenario: Great Guard costs 1 red bead
    When I check the great shield test great guard action cost from YAML
    Then the great shield test great guard cost should have 1 red bead

  # Shield Wall - Adjacent Ally Defense +1 Guard
  Scenario: Shield Wall grants +1 Guard to adjacent ally when attacked
    Given a great shield test bearer at position 5,5 with bead hand having 3 red and 0 guard
    And a great shield test ally "fighter" at position 5,6 with 0 guard
    When the great shield test shield wall is triggered for "fighter"
    Then the great shield test shield wall result should be successful
    And the great shield test ally "fighter" should have 1 guard

  Scenario: Shield Wall costs 1 red bead
    When I check the great shield test shield wall action cost from YAML
    Then the great shield test shield wall cost should have 1 red bead

  Scenario: Shield Wall only triggers if ally is adjacent to bearer
    Given a great shield test bearer at position 1,1 with bead hand having 3 red and 0 guard
    And a great shield test ally "far-ally" at position 5,5 with 0 guard
    When the great shield test shield wall is triggered for "far-ally"
    Then the great shield test shield wall result should have failed

  Scenario: Shield Wall does not trigger when bearer is attacked
    Given a great shield test bearer at position 5,5 with bead hand having 3 red and 0 guard
    When the great shield test shield wall is triggered for self
    Then the great shield test shield wall result should have failed

  # Attack Restriction
  Scenario: Great Shield bearer cannot use attack action
    Given a great shield test bearer with great shield equipped
    Then the great shield test bearer should not have "attack" in available actions

  # Passive Guard
  Scenario: Great Shield has passiveGuard +1
    When I check the great shield test equipment from YAML
    Then the great shield test equipment slot should be "off-hand"
    And the great shield test equipment category should be "shield"
    And the great shield test equipment passiveGuard should be 1
