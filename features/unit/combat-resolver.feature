Feature: Combat Resolution System
  As a game designer
  I need a combat resolution system that determines hit outcomes and damage
  So that attacks are resolved fairly with modifiers for tactical depth

  # Basic Combat Mechanics

  Scenario: Basic hit when agility beats evasion and power beats defense
    Given an attack with power 10 and agility 8
    And a defense with armor 3, guard 2, and evasion 5
    When I resolve the attack with no modifiers
    Then the outcome should be "hit"
    And the damage should be 5

  Scenario: Dodge when evasion meets or exceeds agility
    Given an attack with power 10 and agility 5
    And a defense with armor 3, guard 2, and evasion 5
    When I resolve the attack with no modifiers
    Then the outcome should be "dodged"
    And the damage should be 0

  Scenario: Guard when power cannot overcome defense
    Given an attack with power 5 and agility 8
    And a defense with armor 3, guard 2, and evasion 2
    When I resolve the attack with no modifiers
    Then the outcome should be "guarded"
    And the damage should be 0

  Scenario: Zero damage when power equals defense
    Given an attack with power 5 and agility 8
    And a defense with armor 2, guard 3, and evasion 2
    When I resolve the attack with no modifiers
    Then the outcome should be "guarded"
    And the damage should be 0

  Scenario: Hit with higher power than total defense
    Given an attack with power 12 and agility 7
    And a defense with armor 2, guard 3, and evasion 3
    When I resolve the attack with no modifiers
    Then the outcome should be "hit"
    And the damage should be 7

  # Edge Cases: Power and Defense Zero

  Scenario: Always guarded when power is zero
    Given an attack with power 0 and agility 10
    And a defense with armor 0, guard 0, and evasion 0
    When I resolve the attack with no modifiers
    Then the outcome should be "guarded"
    And the damage should be 0

  Scenario: Full damage when both armor and guard are zero
    Given an attack with power 8 and agility 7
    And a defense with armor 0, guard 0, and evasion 2
    When I resolve the attack with no modifiers
    Then the outcome should be "hit"
    And the damage should be 8

  # Feint Modifier: Ignores guard, only armor counts

  Scenario: Feint ignores guard, damage calculated with armor only
    Given an attack with power 10 and agility 8
    And a defense with armor 3, guard 5, and evasion 2
    When I resolve the attack with modifier "feint"
    Then the outcome should be "hit"
    And the damage should be 7

  Scenario: Feint still respects dodge
    Given an attack with power 10 and agility 5
    And a defense with armor 3, guard 5, and evasion 5
    When I resolve the attack with modifier "feint"
    Then the outcome should be "dodged"
    And the damage should be 0

  Scenario: Feint with armor absorbs all damage
    Given an attack with power 5 and agility 8
    And a defense with armor 5, guard 0, and evasion 2
    When I resolve the attack with modifier "feint"
    Then the outcome should be "guarded"
    And the damage should be 0

  # Heavy Modifier: Ignores armor, only guard counts

  Scenario: Heavy ignores armor, damage calculated with guard only
    Given an attack with power 10 and agility 8
    And a defense with armor 5, guard 3, and evasion 2
    When I resolve the attack with modifier "heavy"
    Then the outcome should be "hit"
    And the damage should be 7

  Scenario: Heavy still respects dodge
    Given an attack with power 10 and agility 5
    And a defense with armor 5, guard 3, and evasion 5
    When I resolve the attack with modifier "heavy"
    Then the outcome should be "dodged"
    And the damage should be 0

  Scenario: Heavy with guard absorbs all damage
    Given an attack with power 5 and agility 8
    And a defense with armor 0, guard 5, and evasion 2
    When I resolve the attack with modifier "heavy"
    Then the outcome should be "guarded"
    And the damage should be 0

  # Precise Modifier: +2 agility for hit check

  Scenario: Precise adds 2 to agility for dodge check
    Given an attack with power 10 and agility 5
    And a defense with armor 2, guard 2, and evasion 6
    When I resolve the attack with modifier "precise"
    Then the outcome should be "hit"
    And the damage should be 6

  Scenario: Precise does not affect damage calculation
    Given an attack with power 8 and agility 6
    And a defense with armor 2, guard 2, and evasion 4
    When I resolve the attack with modifier "precise"
    Then the outcome should be "hit"
    And the damage should be 4

  Scenario: Precise still respects high evasion
    Given an attack with power 10 and agility 5
    And a defense with armor 2, guard 2, and evasion 8
    When I resolve the attack with modifier "precise"
    Then the outcome should be "dodged"
    And the damage should be 0

  # Swift Modifier: Dodge result has canReact = false

  Scenario: Swift sets canReact to false when dodged
    Given an attack with power 10 and agility 5
    And a defense with armor 2, guard 2, and evasion 5
    When I resolve the attack with modifier "swift"
    Then the outcome should be "dodged"
    And the damage should be 0
    And canReact should be false

  Scenario: Swift does not affect hit outcome canReact
    Given an attack with power 10 and agility 8
    And a defense with armor 2, guard 2, and evasion 2
    When I resolve the attack with modifier "swift"
    Then the outcome should be "hit"
    And the damage should be 6
    And canReact should be true

  Scenario: Swift does not affect guarded outcome
    Given an attack with power 3 and agility 8
    And a defense with armor 2, guard 2, and evasion 2
    When I resolve the attack with modifier "swift"
    Then the outcome should be "guarded"
    And the damage should be 0
    And canReact should be true

  # Multiple Modifiers: Feint + Precise

  Scenario: Feint and precise together
    Given an attack with power 8 and agility 5
    And a defense with armor 2, guard 4, and evasion 6
    When I resolve the attack with modifiers "feint" and "precise"
    Then the outcome should be "hit"
    And the damage should be 6

  Scenario: Feint and precise with dodge
    Given an attack with power 10 and agility 5
    And a defense with armor 2, guard 4, and evasion 8
    When I resolve the attack with modifiers "feint" and "precise"
    Then the outcome should be "dodged"
    And the damage should be 0

  # Multiple Modifiers: Heavy + Precise

  Scenario: Heavy and precise together
    Given an attack with power 10 and agility 5
    And a defense with armor 4, guard 2, and evasion 6
    When I resolve the attack with modifiers "heavy" and "precise"
    Then the outcome should be "hit"
    And the damage should be 8

  # Multiple Modifiers: Feint + Heavy

  Scenario: Feint and heavy cannot both apply, feint takes precedence
    Given an attack with power 10 and agility 8
    And a defense with armor 3, guard 4, and evasion 2
    When I resolve the attack with modifiers "feint" and "heavy"
    Then the outcome should be "hit"
    And the damage should be 7

  # Multiple Modifiers: Heavy + Precise + Swift

  Scenario: Heavy, precise, and swift all together
    Given an attack with power 10 and agility 5
    And a defense with armor 4, guard 3, and evasion 6
    When I resolve the attack with modifiers "heavy", "precise", and "swift"
    Then the outcome should be "hit"
    And the damage should be 7
    And canReact should be true

  # Dodge Priority Over Guard

  Scenario: Dodge checked before guard
    Given an attack with power 2 and agility 5
    And a defense with armor 10, guard 10, and evasion 5
    When I resolve the attack with no modifiers
    Then the outcome should be "dodged"
    And the damage should be 0

  # Guard Priority Over Hit

  Scenario: Guard checked before calculating damage
    Given an attack with power 6 and agility 8
    And a defense with armor 3, guard 3, and evasion 2
    When I resolve the attack with no modifiers
    Then the outcome should be "guarded"
    And the damage should be 0

  # Comprehensive Modifier Test Cases

  Scenario: Precise + feint combination
    Given an attack with power 9 and agility 6
    And a defense with armor 3, guard 4, and evasion 7
    When I resolve the attack with modifiers "precise" and "feint"
    Then the outcome should be "hit"
    And the damage should be 6

  Scenario: Precise + heavy combination
    Given an attack with power 9 and agility 6
    And a defense with armor 4, guard 3, and evasion 7
    When I resolve the attack with modifiers "precise" and "heavy"
    Then the outcome should be "hit"
    And the damage should be 6

  Scenario: Swift does not modify hit damage
    Given an attack with power 15 and agility 10
    And a defense with armor 4, guard 2, and evasion 3
    When I resolve the attack with modifier "swift"
    Then the outcome should be "hit"
    And the damage should be 9
    And canReact should be true

  Scenario: Feint + precise + swift combo
    Given an attack with power 8 and agility 5
    And a defense with armor 2, guard 5, and evasion 6
    When I resolve the attack with modifiers "feint", "precise", and "swift"
    Then the outcome should be "hit"
    And the damage should be 6
    And canReact should be true
