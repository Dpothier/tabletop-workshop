Feature: Unified Attack System
  As a game designer
  I need a single Attack action that uses weapon stats and modifiers
  So that combat is streamlined with meaningful tactical choices

  # Base Attack with Weapon Stats

  Scenario: Sword attack hits unarmored target
    Given a unified weapon with power 1 and agility 1
    And a unified attack target with armor 0, guard 0, and evasion 0
    When I resolve a unified attack with no modifiers
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 2

  Scenario: Axe attack deals more damage
    Given a unified weapon with power 2 and agility 0
    And a unified attack target with armor 0, guard 0, and evasion 0
    When I resolve a unified attack with no modifiers
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 3

  Scenario: Low agility weapon is dodged
    Given a unified weapon with power 1 and agility 0
    And a unified attack target with armor 0, guard 0, and evasion 1
    When I resolve a unified attack with no modifiers
    Then the unified attack outcome should be "dodged"

  Scenario: Armor reduces damage from weapon attack
    Given a unified weapon with power 1 and agility 1
    And a unified attack target with armor 1, guard 0, and evasion 0
    When I resolve a unified attack with no modifiers
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 1

  # Attack Modifiers with Weapon Stats

  Scenario: Feint modifier bypasses guard with weapon
    Given a unified weapon with power 1 and agility 1
    And a unified attack target with armor 0, guard 3, and evasion 0
    When I resolve a unified attack with modifier "feint"
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 2

  Scenario: Precise modifier prevents dodge with low agility weapon
    Given a unified weapon with power 1 and agility 0
    And a unified attack target with armor 0, guard 0, and evasion 2
    When I resolve a unified attack with modifier "precise"
    Then the unified attack outcome should be "hit"

  # Windup Preparation Bonus

  Scenario: Windup adds power to attack
    Given a unified weapon with power 1 and agility 1
    And a unified attack target with armor 0, guard 0, and evasion 0
    And 1 unified windup stacks
    When I resolve a unified attack with no modifiers
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 3

  Scenario: Multiple windup stacks increase power further
    Given a unified weapon with power 1 and agility 1
    And a unified attack target with armor 2, guard 0, and evasion 0
    And 2 unified windup stacks
    When I resolve a unified attack with no modifiers
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 2

  # Weapon-Specific Modifiers

  Scenario: Weapon modifier adds stat bonuses
    Given a unified weapon with power 2 and agility 0
    And a unified weapon modifier with power bonus 1 and agility bonus 0 and modifiers ""
    And a unified attack target with armor 0, guard 0, and evasion 0
    When I resolve a unified attack with weapon modifier
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 4

  Scenario: Weapon modifier includes built-in attack modifier
    Given a unified weapon with power 1 and agility 1
    And a unified weapon modifier with power bonus 0 and agility bonus 0 and modifiers "feint"
    And a unified attack target with armor 0, guard 5, and evasion 0
    When I resolve a unified attack with weapon modifier
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 2

  # Full Calculation

  Scenario: Full calculation with weapon, modifier, and preparation
    Given a unified weapon with power 2 and agility 0
    And a unified attack target with armor 1, guard 0, and evasion 0
    And 1 unified windup stacks
    When I resolve a unified attack with modifier "precise"
    Then the unified attack outcome should be "hit"
    And the unified attack damage should be 3
