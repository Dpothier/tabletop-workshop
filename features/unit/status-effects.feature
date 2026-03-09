Feature: Status Effects - Burn
  As a game designer
  I need a burn status effect system
  So that fire damage resolves at end of round with stack-based tracking

  Background:
    Given a battle grid of size 9x9

  # Basic Burn Stack Management

  Scenario: Apply burn stacks to an entity
    Given an entity "hero-0" with 10 health registered at position 3,3
    When entity "hero-0" has 2 burn stacks applied
    Then entity "hero-0" should have 2 burn stacks

  Scenario: Entity has no burn stacks by default
    Given an entity "hero-0" with 10 health registered at position 3,3
    Then entity "hero-0" should have no burn
    And entity "hero-0" should have 0 burn stacks

  Scenario: Multiple burn stacks accumulate on an entity
    Given an entity "hero-0" with 10 health registered at position 3,3
    When entity "hero-0" has 1 burn stack applied
    And entity "hero-0" has 2 burn stacks applied
    Then entity "hero-0" should have 3 burn stacks

  # End-of-Round Damage Resolution

  Scenario: End-of-round deals 1 damage per burn stack
    Given an entity "hero-0" with 10 health registered at position 3,3
    And entity "hero-0" has 3 burn stacks applied
    When end of round is resolved
    Then entity "hero-0" should have 7 health
    And the end-of-round results should show 3 damage to "hero-0"

  Scenario: Burn stacks consumed after end-of-round resolution
    Given an entity "hero-0" with 10 health registered at position 3,3
    And entity "hero-0" has 4 burn stacks applied
    When end of round is resolved
    Then entity "hero-0" should have no burn

  Scenario: Entity with zero burn stacks takes no damage at end-of-round
    Given an entity "hero-0" with 10 health registered at position 3,3
    When end of round is resolved
    Then entity "hero-0" should have 10 health
    And there should be 0 end-of-round damage events

  # Multiple Entity Resolution

  Scenario: Multiple entities with burn resolve simultaneously
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "monster" with 20 health registered at position 5,5
    And entity "hero-0" has 2 burn stacks applied
    And entity "monster" has 3 burn stacks applied
    When end of round is resolved
    Then there should be 2 end-of-round damage events
    And entity "hero-0" should have 8 health
    And entity "monster" should have 17 health

  Scenario: Burn damage cannot kill entity below 0 health
    Given an entity "hero-0" with 5 health registered at position 3,3
    And entity "hero-0" has 10 burn stacks applied
    When end of round is resolved
    Then entity "hero-0" should have 0 health
    And the end-of-round results should show 5 damage to "hero-0"

  # Status Query

  Scenario: Query affected entities returns only entities with burn
    Given an entity "hero-0" with 10 health registered at position 3,3
    And an entity "monster" with 20 health registered at position 5,5
    And entity "hero-0" has 1 burn stack applied
    Then the affected entities list should contain "hero-0"
    And the affected entities list should not contain "monster"

  Scenario: Entity with burn can query burn status
    Given an entity "hero-0" with 10 health registered at position 3,3
    When entity "hero-0" has 3 burn stacks applied
    Then entity "hero-0" should have burn
