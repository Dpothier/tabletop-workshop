Feature: Effect System
  As a game developer
  I need a pluggable effect system with typed effect classes
  So that actions can execute game logic in a composable, data-driven way

  Background:
    Given a battle grid of size 9x9
    And a game context with the grid
    And an effect registry

  # EffectRegistry Tests

  Scenario: Register an effect type
    When I register effect "attack" with a MoveEffect
    Then the registry should contain "attack"

  Scenario: Retrieve a registered effect
    Given effect "move" is registered
    When I retrieve effect "move" from registry
    Then I should get a valid effect instance

  Scenario: Retrieve unregistered effect returns undefined
    When I retrieve effect "unknown" from registry
    Then the result should be undefined

  # MoveEffect Tests

  Scenario: Move effect successfully moves entity to destination
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I execute MoveEffect with destination 4,4
    Then the effect result should be successful
    And the entity "hero-0" should be at position 4,4
    And the effect result should contain a move animation event

  Scenario: Move effect fails when destination is occupied
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "monster" with 20 health registered at position 4,4
    When I execute MoveEffect with destination 4,4
    Then the effect result should fail
    And the entity "hero-0" should be at position 3,3

  Scenario: Move effect fails when destination is out of bounds
    Given an entity "hero-0" with 10 health registered at position 8,8
    When I execute MoveEffect with destination 9,8
    Then the effect result should fail
    And the entity "hero-0" should be at position 8,8

  Scenario: Move effect applies range modifier
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I execute MoveEffect with destination 5,3 and range modifier 2
    Then the effect result should be successful
    And the entity "hero-0" should be at position 5,3

  Scenario: Move effect animation contains correct positions
    Given an entity "hero-0" with 10 health registered at position 2,2
    When I execute MoveEffect with destination 3,3
    Then the effect result should contain a move animation event
    And the move event should have from position 2,2
    And the move event should have to position 3,3

  # AttackEffect Tests

  Scenario: Attack effect successfully attacks adjacent target
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 4,3
    When I execute AttackEffect on "goblin" with damage 2
    Then the effect result should be successful
    And entity "goblin" should have 3 health
    And the effect result should contain attack animation event
    And the effect result should contain damage animation event

  Scenario: Attack effect fails when target not adjacent
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 5,5
    When I execute AttackEffect on "goblin" with damage 2
    Then the effect result should fail

  Scenario: Attack effect applies damage modifier
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 4,3
    When I execute AttackEffect on "goblin" with damage 2 and damage modifier 1
    Then the effect result should be successful
    And entity "goblin" should have 2 health

  Scenario: Attack effect returns hit data for chaining
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 4,3
    When I execute AttackEffect on "goblin" with damage 2
    Then the effect result data should have "hit" = true
    And the effect result data should have "damage" = 2

  Scenario: Attack damage cannot exceed target max health
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 4,3
    When I execute AttackEffect on "goblin" with damage 10
    Then entity "goblin" should have 0 health
    And the effect result data should have "damage" = 5

  # DrawBeadsEffect Tests

  Scenario: Draw beads effect draws beads to hand
    Given an entity "hero-0" with 10 health registered at position 3,3
    And a player bead system
    When I execute DrawBeadsEffect to draw 3 beads for "hero-0"
    Then the effect result should be successful
    And the player should have 3 beads in hand
    And the effect result should contain rest animation event

  Scenario: Draw beads effect returns beads drawn in animation event
    Given an entity "hero-0" with 10 health registered at position 3,3
    And a player bead system
    When I execute DrawBeadsEffect to draw 2 beads for "hero-0"
    Then the effect result should contain rest animation event
    And the rest event should have 2 beads drawn

  Scenario: Draw beads effect works with zero beads
    Given an entity "hero-0" with 10 health registered at position 3,3
    And a player bead system
    When I execute DrawBeadsEffect to draw 0 beads for "hero-0"
    Then the effect result should be successful
    And the player should have 0 beads in hand

  # Effect Chaining Tests

  Scenario: Effect can read previous effect result data
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 4,3
    When I execute AttackEffect on "goblin" with damage 2 storing result as "baseAttack"
    And I execute a conditional effect that checks "baseAttack" hit data
    Then the conditional effect should see "hit" = true
    And the conditional effect should see "damage" = 2

  Scenario: Effect receives empty chain results when first in sequence
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 4,3
    When I execute AttackEffect on "goblin" with damage 2 with no prior results
    Then the effect should execute with empty chain results
    And the effect result should be successful

  # Integration: Multiple Effects in Sequence

  Scenario: Movement then attack in sequence
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 4,5
    When I execute MoveEffect with destination 4,4
    And then execute AttackEffect on "goblin" with damage 2
    Then the hero should have moved to 4,4
    And the goblin should have 3 health
    And both effects should be in the result events

  Scenario: Failed move stops subsequent effects
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "monster" with 20 health registered at position 4,4
    When I execute MoveEffect with destination 4,4
    Then the effect result should fail
    And no attack should be executed
