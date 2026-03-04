Feature: Cast Resolution System
  As a game designer
  I need a spell cast resolution system
  So that magical combat resolves fairly with intensity and ward mechanics

  # Basic Cast Mechanics

  Scenario: Basic cast resolves spell damage at intensity 1
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And no channel stacks
    And no extra beads
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 6
    And the cast intensity should be 1
    And the cast effective cost should be 3

  Scenario: Channel stacks reduce effective bead cost to zero
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And 3 channel stacks
    And no extra beads
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 6
    And the cast intensity should be 1
    And the cast effective cost should be 0

  Scenario: Channel stacks reduce effective bead cost partially
    Given a spell "fireball" with color "red", base cost 5, base damage 8
    And 2 channel stacks
    And no extra beads
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 8
    And the cast intensity should be 1
    And the cast effective cost should be 3

  # Intensity System

  Scenario: Intensity increases with extra beads at 1 per bead
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And no channel stacks
    And 2 extra beads
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 18
    And the cast intensity should be 3
    And the cast effective cost should be 3

  Scenario: Intensity calculated from base plus extra beads
    Given a spell "frostbolt" with color "blue", base cost 2, base damage 4
    And 1 channel stack
    And 3 extra beads
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 16
    And the cast intensity should be 4
    And the cast effective cost should be 1

  # Ward Mechanics

  Scenario: Ward blocks spell completely when ward >= damage
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And no channel stacks
    And no extra beads
    And an enemy target with ward 6
    When I resolve the cast
    Then the cast outcome should be "warded"
    And the cast damage should be 0

  Scenario: Ward blocks stronger spell when ward >= damage
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And no channel stacks
    And no extra beads
    And an enemy target with ward 10
    When I resolve the cast
    Then the cast outcome should be "warded"
    And the cast damage should be 0

  Scenario: Ward reduces spell damage when ward < damage
    Given a spell "fireball" with color "red", base cost 3, base damage 10
    And no channel stacks
    And no extra beads
    And an enemy target with ward 3
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 7

  Scenario: Ward has no effect when ward is zero
    Given a spell "fireball" with color "red", base cost 3, base damage 8
    And no channel stacks
    And no extra beads
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 8

  # Spell Enhancements

  Scenario: Spell enhancement adds extra damage
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And no channel stacks
    And no extra beads
    And spell enhancement "power" that adds 3 damage
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 9

  Scenario: Multiple enhancements stack damage bonuses
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And no channel stacks
    And no extra beads
    And spell enhancements "power" adds 2 damage and "precision" adds 1 damage
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 9

  Scenario: Enhancement bonus damage subject to ward
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And no channel stacks
    And no extra beads
    And spell enhancement "power" that adds 5 damage
    And an enemy target with ward 8
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 3

  # Ally Target Mechanics

  Scenario: Ally target resists spell when not accepting
    Given a spell "heal" with color "green", base cost 2, base damage 5
    And no channel stacks
    And no extra beads
    And an ally target that does not accept
    When I resolve the cast
    Then the cast outcome should be "resisted"
    And the cast damage should be 0

  Scenario: Ally target accepts spell normally resolves
    Given a spell "heal" with color "green", base cost 2, base damage 5
    And no channel stacks
    And no extra beads
    And an ally target that accepts
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 5

  Scenario: Ally acceptance bypasses ward check
    Given a spell "heal" with color "green", base cost 2, base damage 5
    And no channel stacks
    And no extra beads
    And an ally target that accepts with ward 10
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 5

  # Combined Mechanics

  Scenario: Intensity bonus increases enhancement damage
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And no channel stacks
    And 2 extra beads
    And spell enhancement "power" that adds 3 damage
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 27
    And the cast intensity should be 3

  Scenario: Full cast calculation with channel stacks, intensity, enhancements, and ward
    Given a spell "fireball" with color "red", base cost 5, base damage 8
    And 2 channel stacks
    And 2 extra beads
    And spell enhancement "power" that adds 2 damage
    And an enemy target with ward 5
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 25
    And the cast intensity should be 3
    And the cast effective cost should be 3

  # Edge Cases

  Scenario: Zero channel stacks means full bead cost
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And 0 channel stacks
    And no extra beads
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 6
    And the cast effective cost should be 3

  Scenario: Extra beads with no enhancement still increase damage
    Given a spell "fireball" with color "red", base cost 3, base damage 5
    And 0 channel stacks
    And 1 extra bead
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 10
    And the cast intensity should be 2

  Scenario: Ward exceeding intensity-scaled damage
    Given a spell "frostbolt" with color "blue", base cost 2, base damage 3
    And 1 channel stack
    And 4 extra beads
    And an enemy target with ward 30
    When I resolve the cast
    Then the cast outcome should be "warded"
    And the cast damage should be 0
    And the cast intensity should be 5

  Scenario: Effective cost cannot go below zero
    Given a spell "fireball" with color "red", base cost 3, base damage 6
    And 10 channel stacks
    And no extra beads
    And an enemy target with ward 0
    When I resolve the cast
    Then the cast outcome should be "hit"
    And the cast damage should be 6
    And the cast effective cost should be 0
