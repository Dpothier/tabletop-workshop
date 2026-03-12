Feature: Crossbow - Ranged weapon with load and steady aim
  As a character with a Crossbow
  I want to manage loading and improve precision with Steady Aim
  So that I can use a practical two-handed ranged weapon effectively

  Background:
    Given a crossbow test grid of 12x12
    And a crossbow test game context with the grid

  # Equipment Definition
  Scenario: Crossbow has penetration 1
    When I check the crossbow test equipment from YAML
    Then the crossbow test equipment penetration should be 1

  Scenario: Crossbow starts unloaded
    When I check the crossbow test equipment from YAML
    Then the crossbow test equipment startsLoaded should be false

  Scenario: Crossbow has 2 inventory slots
    When I check the crossbow test equipment from YAML
    Then the crossbow test equipment inventorySlots should be 2

  Scenario: Crossbow is two-handed
    When I check the crossbow test equipment from YAML
    Then the crossbow test equipment twoHanded should be true

  # Load Action
  Scenario: Load costs 1w (time cost 1)
    When I check the crossbow test load action cost from YAML
    Then the crossbow test load cost should have time 1

  Scenario: Load sets weapon loaded
    Given a crossbow test entity at position 5,5
    When the crossbow test load effect is executed
    Then the crossbow test entity should have loaded stacks 1

  # Loaded State Management
  Scenario: After shot, crossbow is unloaded (loaded stacks go to 0)
    Given a crossbow test entity at position 5,5
    When the crossbow test load effect is executed
    And the crossbow test shot removes loaded stack
    Then the crossbow test entity should have loaded stacks 0

  Scenario: Shoot fails if unloaded (loaded stacks = 0)
    Given a crossbow test entity at position 5,5
    When the crossbow test entity is checked with loaded stacks 0
    Then the crossbow test entity cannot shoot due to unloaded state

  # Steady Aim Modifier
  Scenario: Steady Aim adds +1 agility (precision)
    When the crossbow test steady aim modifier is applied
    Then the crossbow test modifier output should have agility 1

  Scenario: Steady Aim costs 1 blue bead
    When I check the crossbow test steady aim modifier from YAML
    Then the crossbow test steady aim cost should have blue 1

  # Range Bands
  Scenario: Range band short (1-6) applies +1 modifier
    When I check the crossbow test range bands from YAML
    Then the crossbow test range band short should apply modifier 1

  Scenario: Range band medium (7-12) applies +0 modifier
    When I check the crossbow test range bands from YAML
    Then the crossbow test range band medium should apply modifier 0

  Scenario: Range band long (13-18) applies -2 modifier
    When I check the crossbow test range bands from YAML
    Then the crossbow test range band long should apply modifier -2
