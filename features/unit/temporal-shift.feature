Feature: Temporal Shift - Hourglass of Time time manipulation spell
  As a caster with an Hourglass of Time
  I need to cast Temporal Shift to advance or delay targets on the action wheel
  So that I can manipulate turn order for tactical advantage

  Background:
    Given a temporal test grid of 12x12
    And a temporal test game context with the grid

  # Base Advance
  Scenario: Temporal Shift advances the target by 1w on the action wheel
    Given a temporal test caster at position 5,5 on wheel position 0
    And a temporal test target "enemy1" at grid position 5,6 on wheel position 2 with 0 ward
    When the temporal test effect is executed targeting "enemy1" with direction "advance"
    Then the temporal test entity "enemy1" should be at wheel position 3

  # Base Delay
  Scenario: Temporal Shift delays the target by 1w on the action wheel
    Given a temporal test caster at position 5,5 on wheel position 0
    And a temporal test target "enemy1" at grid position 5,6 on wheel position 3 with 0 ward
    When the temporal test effect is executed targeting "enemy1" with direction "delay"
    Then the temporal test entity "enemy1" should be at wheel position 2

  # Cost
  Scenario: Temporal Shift base cost is 2 windup + 1 blue bead
    When I check the temporal test action cost from YAML
    Then the temporal test cost should have 2 windup
    And the temporal test cost should have 1 blue bead

  # AoE 3x3
  Scenario: AoE 3x3 affects all entities in a 3x3 zone centered on the caster
    Given a temporal test caster at position 5,5 on wheel position 0
    And a temporal test target "nearby" at grid position 5,6 on wheel position 2 with 0 ward
    And a temporal test target "diagonal" at grid position 6,6 on wheel position 3 with 0 ward
    And a temporal test target "far" at grid position 8,8 on wheel position 4 with 0 ward
    When the temporal test effect is executed with aoe3x3 direction "advance"
    Then the temporal test entity "nearby" should be at wheel position 3
    And the temporal test entity "diagonal" should be at wheel position 4
    And the temporal test entity "far" should be at wheel position 4

  # AoE 5x5
  Scenario: AoE 5x5 affects all entities in a 5x5 zone centered on the caster
    Given a temporal test caster at position 5,5 on wheel position 0
    And a temporal test target "close" at grid position 5,6 on wheel position 2 with 0 ward
    And a temporal test target "range2" at grid position 5,7 on wheel position 3 with 0 ward
    And a temporal test target "outside" at grid position 5,8 on wheel position 4 with 0 ward
    When the temporal test effect is executed with aoe5x5 direction "advance"
    Then the temporal test entity "close" should be at wheel position 3
    And the temporal test entity "range2" should be at wheel position 4
    And the temporal test entity "outside" should be at wheel position 4

  # Intensity Enhancement
  Scenario: Intensity enhancement changes effect from 1w to 2w
    Given a temporal test caster at position 5,5 on wheel position 0
    And a temporal test target "enemy1" at grid position 5,6 on wheel position 2 with 0 ward
    When the temporal test effect is executed targeting "enemy1" with direction "advance" and intensity
    Then the temporal test entity "enemy1" should be at wheel position 4

  # Ward Check
  Scenario: Ward check blocks effect on targets with ward >= intensity
    Given a temporal test caster at position 5,5 on wheel position 0
    And a temporal test target "warded" at grid position 5,6 on wheel position 2 with 5 ward
    When the temporal test effect is executed targeting "warded" with direction "advance"
    Then the temporal test entity "warded" should be at wheel position 2

  # Ally Acceptance
  Scenario: Allies can accept the effect voluntarily
    Given a temporal test caster at position 5,5 on wheel position 0
    And a temporal test ally "friend" at grid position 5,6 on wheel position 2 accepting
    When the temporal test effect is executed targeting "friend" with direction "advance"
    Then the temporal test entity "friend" should be at wheel position 3

  # Uniform Direction
  Scenario: Choice advance or delay applies to all targets uniformly
    Given a temporal test caster at position 5,5 on wheel position 0
    And a temporal test target "enemy1" at grid position 5,6 on wheel position 2 with 0 ward
    And a temporal test target "enemy2" at grid position 6,5 on wheel position 4 with 0 ward
    When the temporal test effect is executed with aoe3x3 direction "delay"
    Then the temporal test entity "enemy1" should be at wheel position 1
    And the temporal test entity "enemy2" should be at wheel position 3
