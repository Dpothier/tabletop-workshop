Feature: Action Pipeline — validate targeting, handle reactions, mutate state
  As a game designer
  I need an ActionPipeline that validates targets, triggers defensive reactions, and applies damage
  So that effects become thin resolver wrappers without duplicating validation logic

  Background:
    Given an empty action pipeline context

  # Pipeline targeting validation (2 scenarios)

  Scenario: Pipeline rejects melee attack when target is not adjacent
    Given a grid of 9x9
    And an attacker at position 0,0
    And a target at position 3,0
    When I validate melee targeting from attacker to target
    Then the validation should fail
    And the reason should be "target not adjacent"

  Scenario: Pipeline allows ranged attack when target is within range but not adjacent
    Given a grid of 9x9
    And an attacker at position 0,0
    And a target at position 3,0
    When I validate ranged targeting from attacker to target with range 5
    Then the validation should succeed

  # Pipeline defensive reactions (2 scenarios)

  Scenario: Pipeline triggers defensive reaction prompt for player targets
    Given a grid of 9x9
    And an attacker at position 0,0
    And a player target at position 1,0 with 10 health
    And the target has a defensive reaction handler
    When I handle defensive reaction with attack power 5 and agility 3
    Then the target should be prompted for defensive reaction
    And the prompt should include options for "guard" and "evade"

  Scenario: Pipeline skips defensive reaction for non-player targets
    Given a grid of 9x9
    And an attacker at position 0,0
    And a monster target at position 1,0 with 10 health
    When I handle defensive reaction with attack power 5 and agility 3
    Then no defensive reaction prompt should be shown

  # Pipeline state mutation (2 scenarios)

  Scenario: Pipeline applies damage to target after hit result
    Given a grid of 9x9
    And a target at position 0,0 with 20 health
    And a hit combat result with 5 damage
    When I apply the combat result to the target
    Then the pipeline target should have 15 health
    And the mutation result should report 5 damage applied

  Scenario: Pipeline does not mutate target health after dodge result
    Given a grid of 9x9
    And a target at position 0,0 with 20 health
    And a dodge combat result with 0 damage
    When I apply the combat result to the target
    Then the pipeline target should have 20 health
    And the mutation result should report 0 damage applied

  # Thin effect wrappers (2+ scenarios)

  Scenario: ShootEffect resolves ranged attack and returns events
    Given a grid of 9x9
    And an attacker at position 0,0 with attack power 10 and agility 7
    And a target at position 4,0 with armor 2, guard 2, evasion 3
    When I execute ShootEffect with range 5
    Then the pipeline effect should succeed
    And the pipeline effect result should contain attack animation event
    And the pipeline effect result should contain hit animation event

  Scenario: ShootEffect fails when target is out of range
    Given a grid of 9x9
    And an attacker at position 0,0 with attack power 10 and agility 7
    And a target at position 6,0 with armor 2, guard 2, evasion 3
    When I execute ShootEffect with range 5
    Then the pipeline effect should fail
    And the pipeline reason should contain "out of range"

  Scenario: CastEffect resolves spell cast and returns events
    Given a grid of 9x9
    And an attacker at position 0,0 with spell power 8
    And a target at position 3,0 with armor 1, guard 1, evasion 2
    When I execute CastEffect
    Then the pipeline effect should succeed
    And the pipeline effect result should contain attack animation event

  Scenario: CastEffect applies damage based on spell power vs defense
    Given a grid of 9x9
    And an attacker with spell power 10
    And a target with armor 2, guard 2, evasion 1
    And a spell attack that would deal damage
    When I execute CastEffect
    Then the pipeline target health should be reduced
    And the pipeline effect result should contain damage animation event
