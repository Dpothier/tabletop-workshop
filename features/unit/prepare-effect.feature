Feature: PrepareEffect
  As a game developer
  I need PrepareEffect to apply preparation stacks via the effect system
  So that preparation actions can be composed with other effects in action sequences

  Background:
    Given a battle grid of size 9x9
    And a game context with the grid

  Scenario: PrepareEffect adds preparation stacks to actor
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I execute PrepareEffect with type "aim" and 1 stacks to add
    Then the prepare effect result should be successful
    And the entity "hero-0" should have 1 stacks of "aim"
    And the prepare effect result data should have "prepType" = "aim"
    And the prepare effect result data should have "stacksApplied" = 1
    And the prepare effect result data should have "totalStacks" = 1

  Scenario: PrepareEffect respects maxStacks cap for windup
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I execute PrepareEffect with type "windup" and 5 stacks to add
    Then the prepare effect result should be successful
    And the entity "hero-0" should have 1 stacks of "windup"
    And the prepare effect result data should have "stacksApplied" = 1
    And the prepare effect result data should have "totalStacks" = 1

  Scenario: PrepareEffect accumulates stacks when no cap
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I execute PrepareEffect with type "aim" and 2 stacks to add
    Then the entity "hero-0" should have 2 stacks of "aim"
    When I execute PrepareEffect with type "aim" and 1 stacks to add
    Then the entity "hero-0" should have 3 stacks of "aim"
    And the prepare effect result data should have "totalStacks" = 3

  Scenario: PrepareEffect fails when actor not found
    When I execute PrepareEffect with type "aim" and 1 stacks to add but no actor
    Then the prepare effect result should fail
    And the prepare effect reason should be "Actor not found"

  Scenario: PrepareEffect caps stacks to maxStacks limit
    Given an entity "hero-0" with 10 health registered at position 3,3
    And the entity "hero-0" has 1 stacks of "aim"
    When I execute PrepareEffect with type "aim" and 10 stacks to add
    Then the entity "hero-0" should have 11 stacks of "aim"
    And the prepare effect result data should have "totalStacks" = 11

  Scenario: PrepareEffect clears previous stacks before adding capped amount
    Given an entity "hero-0" with 10 health registered at position 3,3
    And the entity "hero-0" has 2 stacks of "windup"
    When I execute PrepareEffect with type "windup" and 3 stacks to add
    Then the entity "hero-0" should have 1 stacks of "windup"
    And the prepare effect result data should have "stacksApplied" = 1

  Scenario: PrepareEffect returns empty events array
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I execute PrepareEffect with type "ponder" and 2 stacks to add
    Then the prepare effect result should be successful
    And the prepare effect result should have 0 animation events

  Scenario: PrepareEffect handles rest with higher wheel cost
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I execute PrepareEffect with type "rest" and 1 stacks to add
    Then the prepare effect result should be successful
    And the entity "hero-0" should have 1 stacks of "rest"
    And the prepare effect result data should have "prepType" = "rest"

  Scenario: PrepareEffect with channel (unlimited stacks)
    Given an entity "hero-0" with 10 health registered at position 3,3
    When I execute PrepareEffect with type "channel" and 100 stacks to add
    Then the prepare effect result should be successful
    And the entity "hero-0" should have 100 stacks of "channel"
    And the prepare effect result data should have "totalStacks" = 100
