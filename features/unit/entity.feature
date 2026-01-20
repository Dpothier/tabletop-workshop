Feature: Entity
  As a game entity
  I need to manage my position through the grid and track my health
  So that game state is consistent and testable

  Background:
    Given a battle grid of size 9x9

  # Position Delegation

  Scenario: Entity getPosition delegates to grid
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I query the entity position
    Then the entity position should be 3,3

  Scenario: Entity moveTo delegates to grid
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity moves to position 4,4
    Then the entity move result should be successful
    And the entity position should be 4,4

  Scenario: Entity moveTo returns failure for invalid move
    Given an entity "hero-0" with 10 health registered at position 8,8
    When the entity moves to position 9,8
    Then the entity move result should fail with reason "out of bounds"
    And the entity position should be 8,8

  Scenario: Entity moveTo returns failure when destination occupied
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "monster" with 20 health registered at position 4,4
    When entity "hero-0" moves to position 4,4
    Then the entity move result should fail with reason "occupied"

  # Health Management

  Scenario: Entity receives attack and loses health
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity receives 3 damage
    Then the entity should have 7 health

  Scenario: Entity health cannot go below zero
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity receives 15 damage
    Then the entity should have 0 health

  Scenario: Entity receiveAttack returns attack result
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity receives 3 damage
    Then the attack result should be successful with 3 damage dealt

  Scenario: Entity with health is alive
    Given an entity "hero-0" with 10 health registered at position 3,3
    Then the entity should be alive

  Scenario: Entity with zero health is not alive
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity receives 10 damage
    Then the entity should not be alive

  # Healing

  Scenario: Entity heals and gains health
    Given an entity "hero-0" with 10 health registered at position 3,3
    And the entity has taken 5 damage
    When the entity heals 3 health
    Then the entity should have 8 health

  Scenario: Entity cannot heal above max health
    Given an entity "hero-0" with 10 health registered at position 3,3
    And the entity has taken 2 damage
    When the entity heals 5 health
    Then the entity should have 10 health

  # Entity Identification

  Scenario: Entity has correct ID
    Given an entity "hero-0" with 10 health registered at position 3,3
    Then the entity ID should be "hero-0"

  Scenario: Entity max health is preserved
    Given an entity "hero-0" with 15 health registered at position 3,3
    Then the entity max health should be 15

  # Defense Stats

  Scenario: Entity has default defense stats of zero
    Given an entity "hero-0" with 10 health registered at position 3,3
    Then the entity armor should be 0
    And the entity guard should be 0
    And the entity evasion should be 0

  Scenario: Entity can have armor set
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity armor is set to 2
    Then the entity armor should be 2

  Scenario: Entity can have guard set
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity guard is set to 3
    Then the entity guard should be 3

  Scenario: Entity can have evasion set
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity evasion is set to 4
    Then the entity evasion should be 4

  Scenario: Entity guard can be reset to zero
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity guard is set to 3
    And the entity guard is reset
    Then the entity guard should be 0

  Scenario: Entity getDefenseStats returns all stats
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity armor is set to 2
    And the entity guard is set to 1
    And the entity evasion is set to 3
    Then the entity defense stats should have armor 2, guard 1, and evasion 3

  Scenario: Entity receiveDamage reduces health directly
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity receives 4 direct damage
    Then the entity should have 6 health

  Scenario: Entity receiveDamage cannot reduce health below zero
    Given an entity "hero-0" with 10 health registered at position 3,3
    When the entity receives 15 direct damage
    Then the entity should have 0 health
