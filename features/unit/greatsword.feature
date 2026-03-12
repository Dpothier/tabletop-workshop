Feature: Greatsword - Heavy Melee weapon with Cleave and Sweep
  As a fighter with a Greatsword
  I need to deal heavy damage with Cleave and Sweep mechanics
  So that I can control the battlefield with wide-reaching strikes

  Background:
    Given a greatsword test grid of 12x12
    And a greatsword test game context with the grid

  # Greatsword Equipment
  Scenario: Greatsword has power 3
    When I check the greatsword test equipment from YAML
    Then the greatsword test equipment power should be 3

  Scenario: Greatsword has agility 0
    When I check the greatsword test equipment from YAML
    Then the greatsword test equipment agility should be 0

  Scenario: Greatsword is two-handed
    When I check the greatsword test equipment from YAML
    Then the greatsword test equipment twoHanded should be true

  Scenario: Greatsword has 2 inventory slots
    When I check the greatsword test equipment from YAML
    Then the greatsword test equipment inventorySlots should be 2

  Scenario: Greatsword has Cleave in granted modifiers
    When I check the greatsword test equipment from YAML
    Then the greatsword test equipment should have modifier "cleave"

  Scenario: Greatsword has Sweep in granted modifiers
    When I check the greatsword test equipment from YAML
    Then the greatsword test equipment should have modifier "sweep"

  Scenario: Greatsword has Strength in granted modifiers
    When I check the greatsword test equipment from YAML
    Then the greatsword test equipment should have modifier "strength"

  # Cleave Effect
  Scenario: Cleave deals 1 damage to each adjacent enemy on hit
    Given a greatsword test bearer at position 5,5 with bead hand having 1 red
    And a greatsword test target "victim" at position 5,6
    And a greatsword test adjacent enemy "enemy1" at position 5,7
    And a greatsword test adjacent enemy "enemy2" at position 6,6
    When the greatsword test cleave is triggered for "victim" with hit outcome "hit" and adjacent enemies '["enemy1", "enemy2"]'
    Then the greatsword test cleave result should be successful
    And the greatsword test cleave should have damaged 2 adjacent enemies

  Scenario: Cleave deals no collateral on miss
    Given a greatsword test bearer at position 5,5
    And a greatsword test target "victim" at position 5,6
    When the greatsword test cleave is triggered for "victim" with hit outcome "miss" and adjacent enemies '[]'
    Then the greatsword test cleave result should be successful
    And the greatsword test cleave should have damaged 0 adjacent enemies

  Scenario: Cleave costs 1 red bead
    When I check the greatsword test cleave action cost from YAML
    Then the greatsword test cleave cost should have 1 red bead

  # Sweep Effect
  Scenario: Sweep resolves against entities in arc
    Given a greatsword test bearer at position 5,5 with bead hand having 1 green
    And a greatsword test target "target1" at position 5,6
    And a greatsword test target "target2" at position 6,5
    And a greatsword test target "target3" at position 4,5
    When the greatsword test sweep is triggered with targets '["target1", "target2", "target3"]'
    Then the greatsword test sweep result should be successful
    And the greatsword test sweep should have resolved against 3 targets

  Scenario: Sweep costs 1 green bead
    When I check the greatsword test sweep action cost from YAML
    Then the greatsword test sweep cost should have 1 green bead

  # Mutual Exclusivity
  Scenario: Cleave and Sweep cannot be combined
    When I check the greatsword test equipment from YAML
    Then the greatsword test equipment should have modifiers that are mutually exclusive for "cleave" and "sweep"
