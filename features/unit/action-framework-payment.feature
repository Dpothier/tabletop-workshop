Feature: Action Framework — bead payment, alternative payment, and modifier pipeline
  As a game designer
  I need the action pipeline to handle bead payment and modifier application
  So that effects are thin and the pipeline orchestrates all surrounding concerns

  # Bead Payment (3 scenarios)

  Scenario: Pipeline automatically spends beads when action executes
    Given a framework action "slash" costing 1 red bead
    And a framework player with red=3, green=2, blue=1, white=1 beads in hand
    When the framework action executes successfully
    Then the framework player should have 2 red beads remaining

  Scenario: Pipeline rejects action when player cannot afford bead cost
    Given a framework action "fireball" costing 2 blue beads
    And a framework player with red=1, green=1, blue=1, white=1 beads in hand
    When the framework action is attempted
    Then the framework action should be rejected
    And the framework rejection reason should be "insufficient beads"

  Scenario: Pipeline spends multiple bead colors for multi-color cost
    Given a framework action "combo" costing 1 red and 1 green bead
    And a framework player with red=2, green=2, blue=1, white=1 beads in hand
    When the framework action executes successfully
    Then the framework player should have 1 red beads remaining
    And the framework player should have 1 green beads remaining

  # Alternative Payment (2 scenarios)

  Scenario: Pipeline accepts bead payment when alternative payment is available
    Given a framework action "power-strike" with alternative payment: 1 red bead OR 1 windup stack
    And a framework player with red=2, green=1, blue=1, white=1 beads in hand
    And the framework player has 0 windup stacks
    When the framework action is attempted with bead payment
    Then the framework action should succeed
    And the framework player should have 1 red beads remaining

  Scenario: Pipeline accepts prep stack payment when alternative payment is available
    Given a framework action "power-strike" with alternative payment: 1 red bead OR 1 windup stack
    And a framework player with red=2, green=1, blue=1, white=1 beads in hand
    And the framework player has 2 windup stacks
    When the framework action is attempted with prep stack payment
    Then the framework action should succeed
    And the framework player should have 1 windup stacks remaining

  # Modifier Application in New Pipeline (3 scenarios)

  Scenario: Pipeline applies option modifiers to effects
    Given a framework action "attack" with option "heavy" that modifies "attack-1" with damage +2
    And the framework player selects option "heavy"
    When the framework action applies effects
    Then the framework effect "attack-1" should receive modifier damage=2

  Scenario: Pipeline applies multiple option modifiers to same effect
    Given a framework action "attack" with options "heavy" adding 2 damage and "precise" adding 1 agility
    And the framework player selects options "heavy" and "precise"
    When the framework action applies effects
    Then the framework effect "attack-1" should receive modifier damage=2
    And the framework effect "attack-1" should receive modifier agility=1

  Scenario: Pipeline ignores unselected option modifiers
    Given a framework action "attack" with option "heavy" that modifies "attack-1" with damage +2
    And the framework player selects no options
    When the framework action applies effects
    Then the framework effect "attack-1" should receive no modifiers
