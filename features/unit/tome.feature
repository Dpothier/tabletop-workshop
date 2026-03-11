Feature: Tome - Support item with Bestiary passive and Overwrite reaction
  As a support character with a Tome
  I need Bestiary to reduce Assess costs and Overwrite to cancel monster draws
  So that I can provide tactical intelligence support

  Background:
    Given a tome test grid of 12x12
    And a tome test game context with the grid

  # Bestiary Active Condition
  Scenario: Bestiary is active when the bearer has at least 1 Ponder stack
    Given a tome test bearer at position 5,5 with 2 ponder stacks
    And a tome test passive aura system with bestiary for the bearer
    When the tome test bestiary active check is performed
    Then the tome test bestiary should be active

  Scenario: Bestiary is inactive when the bearer has no Ponder
    Given a tome test bearer at position 5,5 with 0 ponder stacks
    And a tome test passive aura system with bestiary for the bearer
    When the tome test bestiary active check is performed
    Then the tome test bestiary should be inactive

  # Bestiary Cunning Reduction
  Scenario: Bestiary reduces Cunning surcharge by 1 for allies within range 6
    Given a tome test bearer at position 5,5 with 2 ponder stacks
    And a tome test passive aura system with bestiary for the bearer
    And a tome test ally "scout" at position 5,8
    When the tome test cunning reduction is checked for "scout" with base cunning 2
    Then the tome test cunning surcharge should be 1

  Scenario: Bestiary does NOT reduce the base cost of Assess
    Given a tome test bearer at position 5,5 with 2 ponder stacks
    And a tome test passive aura system with bestiary for the bearer
    And a tome test ally "scout" at position 5,8
    When the tome test cunning reduction is checked for "scout" with base cunning 0
    Then the tome test cunning surcharge should be 0

  Scenario: Bestiary does not affect allies outside range 6
    Given a tome test bearer at position 1,1 with 2 ponder stacks
    And a tome test passive aura system with bestiary for the bearer
    And a tome test ally "distant" at position 9,9
    When the tome test cunning reduction is checked for "distant" with base cunning 2
    Then the tome test cunning surcharge should be 2

  # Bearer Ponder Preservation
  Scenario: Tome bearer can Assess without losing Ponder stacks
    Given a tome test bearer at position 5,5 with 3 ponder stacks
    And a tome test passive aura system with bestiary for the bearer
    When the tome test bearer assesses with ponder preservation
    Then the tome test bearer should still have 3 ponder stacks

  # Overwrite Effect
  Scenario: Overwrite cancels the monster bead draw and forces a redraw
    Given a tome test bearer at position 5,5 with 0 ponder stacks
    And a tome test monster at position 5,6 with bead bag
    When the tome test overwrite effect is executed targeting the monster
    Then the tome test overwrite result should be successful
    And the tome test monster should have redrawn

  Scenario: Overwrite costs 3 blue beads
    When I check the tome test overwrite action cost from YAML
    Then the tome test overwrite cost should have 3 blue beads

  Scenario: Overwrite allows substituting 1 blue bead with 1 Ponder stack
    Given a tome test bearer at position 5,5 with 2 ponder stacks
    When the tome test overwrite effect is executed with ponder substitution
    Then the tome test bearer should have 1 ponder stacks
    And the tome test overwrite result should be successful

  Scenario: Overwrite has range 1-6
    Given a tome test bearer at position 1,1 with 0 ponder stacks
    And a tome test monster at position 5,5 with bead bag
    When the tome test overwrite effect is executed targeting the monster
    Then the tome test overwrite result should be successful

  Scenario: Overwrite fails if target is out of range
    Given a tome test bearer at position 1,1 with 0 ponder stacks
    And a tome test monster at position 9,9 with bead bag
    When the tome test overwrite effect is executed targeting the monster
    Then the tome test overwrite result should fail
