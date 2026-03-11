Feature: Phoenix Heart - Phoenix Rebirth spell
  As a caster with a Phoenix Heart
  I need to cast Phoenix Rebirth to stabilize allies and trigger fire bursts
  So that I can heal and deal area damage simultaneously

  Background:
    Given a phoenix test grid of 12x12
    And a phoenix test game context with the grid

  # Base Stabilization

  Scenario: Phoenix Rebirth stabilizes 1 wound on the targeted ally
    Given a phoenix test caster at position 5,5
    And a phoenix test ally "healed-ally" at position 5,6 with 10 max health and 7 current health
    When the phoenix test stabilize effect is executed targeting "healed-ally"
    Then the phoenix test ally "healed-ally" should have 1 stabilized wound
    And the phoenix test ally "healed-ally" should have a hand size of 8

  # Cost

  Scenario: Phoenix Rebirth base cost is 2 windup + 1 white bead
    When I check the phoenix test action cost from YAML
    Then the phoenix test cost should have 2 windup
    And the phoenix test cost should have 1 white bead

  # Phoenix Burst - AoE damage relative to TARGET

  Scenario: Phoenix Burst deals 1 damage to creatures adjacent to the healed ally
    Given a phoenix test caster at position 1,1
    And a phoenix test ally "healed-ally" at position 5,5 with 10 max health and 7 current health
    And a phoenix test enemy "adj-enemy" at position 5,6 with 0 ward
    When the phoenix test burst effect is executed with target position 5,5
    Then the phoenix test enemy "adj-enemy" should have taken 1 damage

  Scenario: Phoenix Burst targets adjacents of the ally, NOT the caster
    Given a phoenix test caster at position 1,1
    And a phoenix test ally "healed-ally" at position 5,5 with 10 max health and 7 current health
    And a phoenix test enemy "near-caster" at position 1,2 with 0 ward
    And a phoenix test enemy "near-ally" at position 5,6 with 0 ward
    When the phoenix test burst effect is executed with target position 5,5
    Then the phoenix test enemy "near-caster" should have taken 0 damage
    And the phoenix test enemy "near-ally" should have taken 1 damage

  Scenario: Phoenix Burst does individual ward check on each enemy
    Given a phoenix test caster at position 1,1
    And a phoenix test ally "healed-ally" at position 5,5 with 10 max health and 7 current health
    And a phoenix test enemy "low-ward" at position 5,6 with 0 ward
    And a phoenix test enemy "high-ward" at position 4,5 with 5 ward
    When the phoenix test burst effect is executed with target position 5,5
    Then the phoenix test enemy "low-ward" should have taken 1 damage
    And the phoenix test enemy "high-ward" should have taken 0 damage

  Scenario: Allies in Phoenix Burst zone can accept or resist
    Given a phoenix test caster at position 1,1
    And a phoenix test ally "healed-ally" at position 5,5 with 10 max health and 7 current health
    And a phoenix test ally-in-burst "accepting-ally" at position 5,6 with 10 max health and 10 current health accepting
    And a phoenix test ally-in-burst "resisting-ally" at position 4,5 with 10 max health and 10 current health resisting
    When the phoenix test burst effect is executed with target position 5,5
    Then the phoenix test entity "accepting-ally" should have taken 1 damage
    And the phoenix test entity "resisting-ally" should have taken 0 damage

  # Ignite

  Scenario: Ignite applies Burn to targets hit by Phoenix Burst
    Given a phoenix test caster at position 1,1
    And a phoenix test ally "healed-ally" at position 5,5 with 10 max health and 7 current health
    And a phoenix test enemy "burned-enemy" at position 5,6 with 0 ward
    When the phoenix test burst effect is executed with ignite and target position 5,5
    Then the phoenix test enemy "burned-enemy" should have taken 1 damage
    And the phoenix test enemy "burned-enemy" should have burn status

  Scenario: Ignite requires Phoenix Burst active
    When I check the phoenix test ignite enhancement requires from YAML
    Then the phoenix test ignite should require "phoenix-burst"

  # Range Enhancement

  Scenario: Range extends targeting from adjacent to range 6
    Given a phoenix test caster at position 1,1
    And a phoenix test ally "distant-ally" at position 5,5 with 10 max health and 7 current health
    When the phoenix test stabilize effect is executed with range targeting "distant-ally"
    Then the phoenix test ally "distant-ally" should have 1 stabilized wound
