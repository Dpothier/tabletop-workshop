Feature: Attack Resolver Functions
  As a game developer
  I need pure resolver functions for attack composition
  So that AttackEffect can decompose its logic into testable, reusable pieces

  Background:
    Given an empty attack resolver context

  # buildDefensiveOptions Tests

  Scenario: Build defensive options with red beads generates guard options
    Given hand counts of red 3, green 0, blue 0, white 0
    When I call buildDefensiveOptions with those hand counts
    Then the result should contain 4 options
    And option 1 should have id "guard-1"
    And option 2 should have id "guard-2"
    And option 3 should have id "guard-3"
    And option 4 should have id "pass"

  Scenario: Build defensive options with green beads generates evade options
    Given hand counts of red 0, green 2, blue 0, white 0
    When I call buildDefensiveOptions with those hand counts
    Then the result should contain 3 options
    And option 1 should have id "evade-1"
    And option 2 should have id "evade-2"
    And option 3 should have id "pass"

  Scenario: Build defensive options with mixed beads generates both types
    Given hand counts of red 2, green 2, blue 0, white 0
    When I call buildDefensiveOptions with those hand counts
    Then the result should contain 5 options
    And option 1 should have id "guard-1"
    And option 2 should have id "guard-2"
    And option 3 should have id "evade-1"
    And option 4 should have id "evade-2"
    And option 5 should have id "pass"

  Scenario: Build defensive options with no defensive beads returns only pass
    Given hand counts of red 0, green 0, blue 2, white 2
    When I call buildDefensiveOptions with those hand counts
    Then the result should contain 1 option
    And option 1 should have id "pass"

  Scenario: Build defensive options with no beads at all returns only pass
    Given hand counts of red 0, green 0, blue 0, white 0
    When I call buildDefensiveOptions with those hand counts
    Then the result should contain 1 option
    And option 1 should have id "pass"

  Scenario: Build defensive options with high red bead count
    Given hand counts of red 5, green 0, blue 0, white 0
    When I call buildDefensiveOptions with those hand counts
    Then the result should contain 6 options
    And option 1 should have id "guard-1"
    And option 5 should have id "guard-5"
    And option 6 should have id "pass"

  Scenario: Pass option is always at the end
    Given hand counts of red 1, green 1, blue 0, white 0
    When I call buildDefensiveOptions with those hand counts
    Then the result should contain 3 options
    And the last option should have id "pass"

  # applyDefensiveReaction Tests

  Scenario: Apply guard-1 reaction returns guard type with count 1
    When I call applyDefensiveReaction with id "guard-1"
    Then the result should have type "guard"
    And the result should have count 1

  Scenario: Apply guard-5 reaction returns guard type with count 5
    When I call applyDefensiveReaction with id "guard-5"
    Then the result should have type "guard"
    And the result should have count 5

  Scenario: Apply evade-1 reaction returns evade type with count 1
    When I call applyDefensiveReaction with id "evade-1"
    Then the result should have type "evade"
    And the result should have count 1

  Scenario: Apply evade-3 reaction returns evade type with count 3
    When I call applyDefensiveReaction with id "evade-3"
    Then the result should have type "evade"
    And the result should have count 3

  Scenario: Apply pass reaction returns pass type with count 0
    When I call applyDefensiveReaction with id "pass"
    Then the result should have type "pass"
    And the result should have count 0

  # buildAttackEvents Tests

  Scenario: Build attack events for hit outcome includes attack, hit, and damage events
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "hit" with damage 3
    And target health 8 with max health 10
    When I call buildAttackEvents
    Then the result should contain 3 events
    And event 1 should have type "attack"
    And event 2 should have type "hit"
    And event 3 should have type "damage"

  Scenario: Attack event has correct attacker and target
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "hit" with damage 3
    And target health 8 with max health 10
    When I call buildAttackEvents
    Then the attack event should have attackerId "hero-0"
    And the attack event should have targetId "goblin-1"

  Scenario: Hit event has correct damage and entity
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "hit" with damage 3
    And target health 8 with max health 10
    When I call buildAttackEvents
    Then the hit event should have entityId "goblin-1"
    And the hit event should have attackerId "hero-0"
    And the hit event should have damage 3

  Scenario: Damage event reflects actual health after damage
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "hit" with damage 3
    And target health 8 with max health 10
    When I call buildAttackEvents
    Then the damage event should have entityId "goblin-1"
    And the damage event should have newHealth 5
    And the damage event should have maxHealth 10

  Scenario: Damage is capped at target current health
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "hit" with damage 10
    And target health 5 with max health 10
    When I call buildAttackEvents
    Then the hit event should have damage 5
    And the damage event should have newHealth 0

  Scenario: Build attack events for dodged outcome includes attack and dodge events
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "dodged" with damage 0
    And target health 10 with max health 10
    When I call buildAttackEvents
    Then the result should contain 2 events
    And event 1 should have type "attack"
    And event 2 should have type "dodge"

  Scenario: Dodge event has correct entity and attacker
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "dodged" with damage 0
    And target health 10 with max health 10
    When I call buildAttackEvents
    Then the dodge event should have entityId "goblin-1"
    And the dodge event should have attackerId "hero-0"

  Scenario: Build attack events for guarded outcome includes attack and guarded events
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "guarded" with damage 0
    And target health 10 with max health 10
    When I call buildAttackEvents
    Then the result should contain 2 events
    And event 1 should have type "attack"
    And event 2 should have type "guarded"

  Scenario: Guarded event has correct entity and attacker
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "guarded" with damage 0
    And target health 10 with max health 10
    When I call buildAttackEvents
    Then the guarded event should have entityId "goblin-1"
    And the guarded event should have attackerId "hero-0"

  Scenario: Guarded event has blocked damage calculated from power and remaining damage
    Given attackerId "hero-0" and targetId "goblin-1"
    And attack power 5 with defense reducing damage to 0
    And combatResult outcome "guarded" with damage 0
    And target health 10 with max health 10
    When I call buildAttackEvents
    Then the guarded event should have blockedDamage 5

  Scenario: Damage capped at zero health minimum
    Given attackerId "hero-0" and targetId "goblin-1"
    And combatResult outcome "hit" with damage 100
    And target health 1 with max health 10
    When I call buildAttackEvents
    Then the hit event should have damage 1
    And the damage event should have newHealth 0
