Feature: CastEffect Spell Resolution
  As a game designer
  I need CastEffect to use Intensity vs Ward spell resolution
  So that spells are resolved differently from physical attacks

  Background:
    Given a cast effect grid of 9x9
    And a cast effect game context with the grid

  # CastResolver formula:
  # intensity = 1 + extraBeads
  # rawDamage = baseDamage * intensity
  # if ward >= rawDamage → warded (0 damage)
  # else → hit (damage = rawDamage - ward)

  Scenario: CastEffect resolves damage via Intensity vs Ward
    Given a cast effect caster at position 0,0 with spell power 5
    And a cast effect target at position 3,0 with 20 health and 2 ward
    When I execute cast effect with base damage 5 and 0 extra beads
    Then the cast effect should succeed
    And the cast effect target should take damage
    And the cast effect result should show intensity 1

  Scenario: CastEffect blocked when intensity less than or equal to ward on enemy
    Given a cast effect caster at position 0,0 with spell power 3
    And a cast effect target at position 3,0 with 20 health and 5 ward
    When I execute cast effect with base damage 3 and 0 extra beads
    Then the cast effect should succeed
    And the cast effect target should have 20 health
    And the cast effect result should show blocked by ward

  Scenario: CastEffect hits ally who voluntarily accepts
    Given a cast effect caster at position 0,0 with spell power 3
    And a cast effect ally target at position 3,0 with 20 health and 5 ward
    When I execute cast effect with base damage 3 and 0 extra beads targeting ally
    Then the cast effect should succeed
    And the cast effect target should take damage
    And the cast effect result should show damage manifested

  Scenario: CastEffect uses channel stacks to reduce bead cost
    Given a cast effect caster at position 0,0 with spell power 5
    And a cast effect target at position 3,0 with 20 health and 2 ward
    When I execute cast effect with base cost 4 and channel stacks 2
    Then the cast effect should succeed
    And the cast effect result should show effective cost 2

  Scenario: CastEffect extra beads increase intensity
    Given a cast effect caster at position 0,0 with spell power 3
    And a cast effect target at position 3,0 with 20 health and 4 ward
    When I execute cast effect with base damage 3 and 2 extra beads
    Then the cast effect should succeed
    And the cast effect target should take damage
    And the cast effect result should show intensity 3

  Scenario: CastEffect applies correct damage when spell manifests
    Given a cast effect caster at position 0,0 with spell power 4
    And a cast effect target at position 3,0 with 20 health and 2 ward
    When I execute cast effect with base damage 4 and 1 extra beads
    Then the cast effect should succeed
    And the cast effect target should have 14 health
    And the cast effect result should show damage 6

  Scenario: CastEffect respects ward stacking
    Given a cast effect caster at position 0,0 with spell power 6
    And a cast effect target at position 3,0 with 25 health and 10 ward
    When I execute cast effect with base damage 2 and 1 extra beads
    Then the cast effect should succeed
    And the cast effect target should have 25 health
    And the cast effect result should show blocked by ward

  Scenario: CastEffect with zero channel stacks uses full bead cost
    Given a cast effect caster at position 0,0 with spell power 2
    And a cast effect target at position 3,0 with 15 health and 1 ward
    When I execute cast effect with base cost 5 and channel stacks 0
    Then the cast effect should succeed
    And the cast effect result should show effective cost 5
