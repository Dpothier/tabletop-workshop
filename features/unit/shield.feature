Feature: Shield - Defensive shield with Block and Rebuke reactions
  As a defensive character with a Shield
  I need to block attacks and push back attackers with Rebuke
  So that I can defend myself and control positioning

  Background:
    Given a shield test grid of 12x12
    And a shield test game context with the grid

  # Shield Equipment
  Scenario: Shield has passiveGuard +1
    When I check the shield test equipment from YAML
    Then the shield test equipment slot should be "off-hand"
    And the shield test equipment category should be "shield"
    And the shield test equipment passiveGuard should be 1

  Scenario: Shield has Block in granted modifiers
    When I check the shield test equipment from YAML
    Then the shield test equipment should have modifier "block"

  Scenario: Shield has Rebuke in granted modifiers
    When I check the shield test equipment from YAML
    Then the shield test equipment should have modifier "rebuke"

  Scenario: Shield has 2 inventory slots
    When I check the shield test equipment from YAML
    Then the shield test equipment inventorySlots should be 2

  # Rebuke - Push attacker
  Scenario: Rebuke pushes attacker by Guard minus Power distance
    Given a shield test bearer at position 5,5 with bead hand having 3 red and 2 guard
    And a shield test attacker "enemy" at position 5,6 with 1 power
    When the shield test rebuke is triggered for "enemy" with guard 2 and power 1
    Then the shield test rebuke result should be successful
    And the shield test rebuke push distance should be 1
    And the shield test attacker "enemy" should be at position 5,7

  Scenario: Rebuke does not push if Guard minus Power is zero or less
    Given a shield test bearer at position 5,5 with bead hand having 3 red and 2 guard
    And a shield test attacker "enemy" at position 5,6 with 2 power
    When the shield test rebuke is triggered for "enemy" with guard 2 and power 2
    Then the shield test rebuke result should be successful
    And the shield test rebuke push distance should be 0

  Scenario: Rebuke costs 1 red bead
    When I check the shield test rebuke action cost from YAML
    Then the shield test rebuke cost should have 1 red bead

  Scenario: Rebuke inflicts 1 damage per remaining tile if attacker hits obstacle
    Given a shield test bearer at position 5,5 with bead hand having 3 red and 3 guard
    And a shield test attacker "enemy" at position 5,6 with 1 power and 20 health
    And a shield test obstacle at position 5,8
    When the shield test rebuke is triggered for "enemy" with guard 3 and power 1
    Then the shield test rebuke result should be successful
    And the shield test attacker "enemy" should be at position 5,7
    And the shield test attacker "enemy" should have 19 health

  Scenario: Rebuke is only available after a successful Block
    Given a shield test bearer at position 5,5 with bead hand having 3 red and 0 guard
    And a shield test attacker "enemy" at position 5,6 with 1 power
    When the shield test rebuke is triggered for "enemy" with guard 0 and power 1
    Then the shield test rebuke result should have failed
