Feature: Preparation System
  As a game designer
  I need a preparation system with stack tracking and interruption rules
  So that players can build up for powerful actions while being vulnerable to interruption

  Background:
    Given a preparation manager

  # Basic Stack Management

  Scenario: Add preparation stacks
    When entity "hero-0" prepares "aim" with 1 stack
    Then entity "hero-0" should have 1 "aim" preparation stack

  Scenario: Entity has no preparation stacks by default
    Then entity "hero-0" should have 0 "aim" preparation stacks

  Scenario: Stacks accumulate across preparations
    When entity "hero-0" prepares "aim" with 1 stack
    And entity "hero-0" prepares "aim" with 1 stack
    Then entity "hero-0" should have 2 "aim" preparation stacks

  # Stack Limits

  Scenario: Windup has maximum 1 stack
    When entity "hero-0" prepares "windup" with 1 stack
    And entity "hero-0" prepares "windup" with 1 stack
    Then entity "hero-0" should have 1 "windup" preparation stack

  Scenario: Aim has no stack limit
    When entity "hero-0" prepares "aim" with 1 stack
    And entity "hero-0" prepares "aim" with 1 stack
    And entity "hero-0" prepares "aim" with 1 stack
    Then entity "hero-0" should have 3 "aim" preparation stacks

  # Interruption Rules

  Scenario: All stacks cleared on taking damage
    When entity "hero-0" prepares "aim" with 2 stacks
    And entity "hero-0" preparations are interrupted by "damage"
    Then entity "hero-0" should have 0 "aim" preparation stacks

  Scenario: All stacks cleared on defensive reaction
    When entity "hero-0" prepares "channel" with 3 stacks
    And entity "hero-0" preparations are interrupted by "defensive_reaction"
    Then entity "hero-0" should have 0 "channel" preparation stacks

  Scenario: Stacks cleared on unrelated action
    When entity "hero-0" prepares "aim" with 2 stacks
    And entity "hero-0" performs action "attack" which is unrelated to "aim"
    Then entity "hero-0" should have 0 "aim" preparation stacks

  Scenario: Paired action does not clear stacks
    When entity "hero-0" prepares "aim" with 2 stacks
    And entity "hero-0" performs action "shoot" which is paired with "aim"
    Then entity "hero-0" should have 2 "aim" preparation stacks

  # Preparation Definitions

  Scenario: Windup costs 1 wheel segment
    Then the "windup" preparation should cost 1 wheel segment

  Scenario: Rest costs 2 wheel segments
    Then the "rest" preparation should cost 2 wheel segments

  Scenario: Windup is paired with attack
    Then the "windup" preparation should be paired with "attack"

  Scenario: Aim is paired with shoot
    Then the "aim" preparation should be paired with "shoot"

  Scenario: Channel is paired with cast
    Then the "channel" preparation should be paired with "cast"

  # Consumption

  Scenario: Stacks consumed after paired action completes
    When entity "hero-0" prepares "aim" with 2 stacks
    And entity "hero-0" consumes "aim" preparation
    Then entity "hero-0" should have 0 "aim" preparation stacks

  # Multiple Preparation Types

  Scenario: Different preparation types tracked independently
    When entity "hero-0" prepares "aim" with 2 stacks
    And entity "hero-0" prepares "channel" with 1 stack
    Then entity "hero-0" should have 2 "aim" preparation stacks
    And entity "hero-0" should have 1 "channel" preparation stack

  Scenario: Damage clears all preparation types
    When entity "hero-0" prepares "aim" with 2 stacks
    And entity "hero-0" prepares "channel" with 1 stack
    And entity "hero-0" preparations are interrupted by "damage"
    Then entity "hero-0" should have 0 "aim" preparation stacks
    And entity "hero-0" should have 0 "channel" preparation stacks
