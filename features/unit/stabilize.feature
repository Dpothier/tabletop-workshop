Feature: Stabilize Mechanic
  As a game designer
  I need wound stabilization to decouple hand size from HP
  So that healers can restore hand size without restoring health

  Background:
    Given a battle grid of size 9x9

  # Default State

  Scenario: Default hand size equals max HP with no wounds
    Given an entity "hero-0" with 5 health registered at position 3,3
    Then the entity hand size should be 5
    And the entity stabilized wounds should be 0

  # Basic Wound Calculation

  Scenario: Wounds calculation is max HP minus current HP
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 2 damage
    Then the entity wounds should be 2

  Scenario: Hand size decreases with wounds
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 2 damage
    Then the entity hand size should be 3
    And the entity wounds should be 2

  # Stabilization Impact

  Scenario: Stabilized wounds increase hand size by their count
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 2 damage
    And the entity has 2 stabilized wounds
    Then the entity hand size should be 5
    And the entity wounds should be 2

  Scenario: Partial stabilization increases hand size partially
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 4 damage
    And the entity has 2 stabilized wounds
    Then the entity hand size should be 3
    And the entity wounds should be 4
    And the entity stabilized wounds should be 2

  Scenario: Stabilization does not restore HP
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 2 damage
    And the entity stabilizes 2 wounds
    Then the entity should have 3 health
    And the entity hand size should be 5

  # Stabilization Mechanics

  Scenario: Stabilize action sets stabilized wounds count
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 3 damage
    And the entity stabilizes 2 wounds
    Then the entity stabilized wounds should be 2
    And the entity wounds should be 3

  Scenario: Hand size has minimum of zero
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 5 damage
    Then the entity hand size should be 0

  Scenario: Entity dies at zero HP regardless of stabilized wounds
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 3 damage
    And the entity has 3 stabilized wounds
    And the entity receives 5 damage
    Then the entity should not be alive

  Scenario: Stabilized wounds cannot exceed total wounds
    Given an entity "hero-0" with 5 health registered at position 3,3
    When the entity has taken 2 damage
    And the entity stabilizes 3 wounds
    Then the entity stabilized wounds should be 2
    And the entity wounds should be 2
