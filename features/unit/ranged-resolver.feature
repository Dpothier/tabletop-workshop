Feature: Ranged Combat Resolution System
  As a game designer
  I need a ranged combat system that determines hit outcomes based on range bands and aim stacks
  So that ranged attacks are resolved fairly with tactical depth

  # Basic Hit/Miss Mechanics

  Scenario: Basic hit at short range with no defenses
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 1 aim stacks
    And a target at range 3
    And the target has cover 0, guard 0, armor 0
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 3
    And the ranged difficulty should be 0
    And the range band should be "short"

  Scenario: Miss when difficulty exceeds precision
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And no aim stacks
    And a target at range 2
    And the target has cover 3, guard 2, armor 1
    When I resolve the ranged attack
    Then the ranged outcome should be "miss"
    And the ranged damage should be 0
    And the ranged precision should be 2
    And the ranged difficulty should be 5
    And the range band should be "short"

  # Aim Stacks Increase Precision

  Scenario: Aim stacks increase precision
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 3 aim stacks
    And a target at range 4
    And the target has cover 1, guard 1, armor 0
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 5
    And the ranged difficulty should be 2
    And the range band should be "short"

  # Cover Increases Difficulty

  Scenario: Cover increases difficulty
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 2 aim stacks
    And a target at range 5
    And the target has cover 2, guard 0, armor 0
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 4
    And the ranged difficulty should be 2
    And the range band should be "short"

  # Armor Reduced by Penetration

  Scenario: Armor reduced by penetration
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 1 aim stacks
    And a target at range 2
    And the target has cover 0, guard 1, armor 3
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 3
    And the ranged difficulty should be 2
    And the range band should be "short"

  # Penetration Fully Negates Armor

  Scenario: Penetration fully negates armor - no negative contribution
    Given a ranged weapon "crossbow" with penetration 5
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 1 aim stacks
    And a target at range 3
    And the target has cover 0, guard 1, armor 2
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 3
    And the ranged difficulty should be 1
    And the range band should be "short"

  # Range Band Modifiers

  Scenario: Medium range band applies zero modifier
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 1 aim stacks
    And a target at range 10
    And the target has cover 0, guard 0, armor 0
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 2
    And the ranged difficulty should be 0
    And the range band should be "medium"

  Scenario: Long range band applies negative modifier
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 3 aim stacks
    And a target at range 15
    And the target has cover 0, guard 0, armor 0
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 2
    And the ranged difficulty should be 0
    And the range band should be "long"

  # Guard Contributes to Difficulty

  Scenario: Guard contributes to difficulty
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 3 aim stacks
    And a target at range 3
    And the target has cover 1, guard 3, armor 0
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 5
    And the ranged difficulty should be 4
    And the range band should be "short"

  # Boundary Conditions

  Scenario: Hit at exact precision exceeds difficulty by 1
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 2 aim stacks
    And a target at range 4
    And the target has cover 2, guard 1, armor 0
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 4
    And the ranged difficulty should be 3
    And the range band should be "short"

  Scenario: Miss when precision equals difficulty
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 2 aim stacks
    And a target at range 5
    And the target has cover 2, guard 2, armor 0
    When I resolve the ranged attack
    Then the ranged outcome should be "miss"
    And the ranged damage should be 0
    And the ranged precision should be 4
    And the ranged difficulty should be 4
    And the range band should be "short"

  # Multiple Aim Stacks Stack Additively

  Scenario: Multiple aim stacks stack additively
    Given a ranged weapon "crossbow" with penetration 2
    And the ranged weapon has short range 1-6 with modifier 1
    And the ranged weapon has medium range 7-12 with modifier 0
    And the ranged weapon has long range 13+ with modifier -2
    And 5 aim stacks
    And a target at range 2
    And the target has cover 2, guard 2, armor 1
    When I resolve the ranged attack
    Then the ranged outcome should be "hit"
    And the ranged damage should be 1
    And the ranged precision should be 7
    And the ranged difficulty should be 4
    And the range band should be "short"
