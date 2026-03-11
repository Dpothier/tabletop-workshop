Feature: Warp - Warping Stone teleportation spell
  As a caster
  I need to teleport myself or others
  So that I can control battlefield positioning

  Background:
    Given a warp test grid of 12x12
    And a warp test game context with the grid

  # Base Teleportation

  Scenario: Warp teleports the caster to an empty tile within range 6
    Given a warp test caster at position 1,1
    When the warp test effect is executed with destination 5,5
    Then the warp test caster should be at position 5,5

  Scenario: Warp ignores obstacles in the path
    Given a warp test caster at position 1,1
    And a warp test obstacle at position 3,3
    When the warp test effect is executed with destination 5,5
    Then the warp test caster should be at position 5,5

  Scenario: Warp fails if the destination is occupied
    Given a warp test caster at position 1,1
    And a warp test entity "blocker" at position 5,5
    When the warp test effect is executed with destination 5,5
    Then the warp test result should have failed

  Scenario: Warp fails if destination is out of range
    Given a warp test caster at position 1,1
    When the warp test effect is executed with destination 10,10
    Then the warp test result should have failed

  # Cost

  Scenario: Warp base cost is 2 windup + 1 blue bead
    When I check the warp test action cost from YAML
    Then the warp test cost should have 2 windup
    And the warp test cost should have 1 blue bead

  # Swap Enhancement

  Scenario: Swap exchanges positions of caster and target creature
    Given a warp test caster at position 1,1
    And a warp test entity "target" at position 3,3
    When the warp test effect is executed with swap targeting "target"
    Then the warp test caster should be at position 3,3
    And the warp test entity "target" should be at position 1,1

  Scenario: Swap performs ward check on enemy targets
    Given a warp test caster at position 1,1
    And a warp test enemy "enemy1" at position 3,3 with 0 ward
    When the warp test effect is executed with swap targeting "enemy1"
    Then the warp test caster should be at position 3,3
    And the warp test entity "enemy1" should be at position 1,1

  Scenario: Swap fails ward check if enemy has high ward
    Given a warp test caster at position 1,1
    And a warp test enemy "warded" at position 3,3 with 5 ward
    When the warp test effect is executed with swap targeting "warded"
    Then the warp test result should have failed
    And the warp test caster should be at position 1,1

  # Other Enhancement

  Scenario: Other teleports an adjacent creature instead of the caster
    Given a warp test caster at position 1,1
    And a warp test entity "ally" at position 1,2
    When the warp test effect is executed with other targeting "ally" to destination 5,5
    Then the warp test entity "ally" should be at position 5,5
    And the warp test caster should be at position 1,1

  Scenario: Other requires target to be adjacent by default
    Given a warp test caster at position 1,1
    And a warp test entity "far-ally" at position 5,5
    When the warp test effect is executed with other targeting "far-ally" to destination 8,8
    Then the warp test result should have failed

  # Extended Selection Enhancement

  Scenario: Extended Selection allows Other target at range 6
    Given a warp test caster at position 1,1
    And a warp test entity "far-ally" at position 5,5
    When the warp test effect is executed with other and extendedSelection targeting "far-ally" to destination 6,6
    Then the warp test entity "far-ally" should be at position 6,6

  # Extended Range Enhancement

  Scenario: Extended Range increases destination range to 12
    Given a warp test caster at position 1,1
    When the warp test effect is executed with extendedRange to destination 11,11
    Then the warp test caster should be at position 11,11

  # Enhancement Combinations

  Scenario: Enhancements are freely combinable - Swap + Extended Range
    Given a warp test caster at position 1,1
    And a warp test entity "far-target" at position 10,10
    When the warp test effect is executed with swap and extendedRange targeting "far-target"
    Then the warp test caster should be at position 10,10
    And the warp test entity "far-target" should be at position 1,1
