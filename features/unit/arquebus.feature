Feature: Arquebus - Ranged firearm weapon with reload and steady aim
  As a character with an Arquebus
  I want to manage ammunition loading and improve precision with Steady Aim
  So that I can use a powerful ranged weapon effectively

  Background:
    Given a arquebus test grid of 12x12
    And a arquebus test game context with the grid

  # Equipment Definition
  Scenario: Arquebus has penetration 2
    When I check the arquebus test equipment from YAML
    Then the arquebus test equipment penetration should be 2

  Scenario: Arquebus starts loaded
    When I check the arquebus test equipment from YAML
    Then the arquebus test equipment startsLoaded should be true

  Scenario: Arquebus has 2 inventory slots
    When I check the arquebus test equipment from YAML
    Then the arquebus test equipment inventorySlots should be 2

  Scenario: Arquebus is two-handed
    When I check the arquebus test equipment from YAML
    Then the arquebus test equipment twoHanded should be true

  # Reload Action
  Scenario: Reload costs 2w (time cost 2)
    When I check the arquebus test reload action cost from YAML
    Then the arquebus test reload cost should have time 2

  Scenario: Reload sets weapon loaded
    Given a arquebus test entity at position 5,5
    When the arquebus test load effect is executed
    Then the arquebus test entity should have loaded stacks 1

  # Steady Aim Modifier
  Scenario: Steady Aim adds +1 agility (precision)
    When the arquebus test steady aim modifier is applied
    Then the arquebus test modifier output should have agility 1

  Scenario: Steady Aim costs 1 blue bead
    When I check the arquebus test steady aim modifier from YAML
    Then the arquebus test steady aim cost should have blue 1

  Scenario: Steady Aim requires firearm tag condition
    When I check the arquebus test steady aim modifier from YAML
    Then the arquebus test steady aim condition weaponTag should be firearm

  # Range Bands
  Scenario: Range band short (1-6) applies +1 modifier
    When I check the arquebus test range bands from YAML
    Then the arquebus test range band short should apply modifier 1

  Scenario: Range band medium (7-14) applies +0 modifier
    When I check the arquebus test range bands from YAML
    Then the arquebus test range band medium should apply modifier 0

  Scenario: Range band long (15-20) applies -2 modifier
    When I check the arquebus test range bands from YAML
    Then the arquebus test range band long should apply modifier -2
