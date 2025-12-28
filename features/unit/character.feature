Feature: Character Action Resolution
  As a player character
  I need to resolve actions by ID
  So that the UI can dispatch actions generically

  Background:
    Given a battle grid of size 9x9
    And a character "hero-0" with 10 health at position 3,3

  # Move Action

  Scenario: Character resolves move action
    When the character resolves action "move" with target position 4,3
    Then the action result should be successful
    And the action result wheel cost should be 1
    And the character should be at position 4,3

  Scenario: Move action fails for out of bounds
    Given a character "hero-1" with 10 health at position 8,8
    When character "hero-1" resolves action "move" with target position 9,8
    Then the action result should fail with reason "Effect movement failed"
    And character "hero-1" should be at position 8,8

  Scenario: Move action fails for occupied tile
    Given a monster entity "monster" with 20 health at position 4,3
    When the character resolves action "move" with target position 4,3
    Then the action result should fail with reason "Effect movement failed"
    And the character should be at position 3,3

  # Run Action

  Scenario: Character resolves run action
    When the character resolves action "run" with target position 5,3
    Then the action result should be successful
    And the action result wheel cost should be 2
    And the character should be at position 5,3

  # Attack Action

  Scenario: Character resolves attack action on adjacent target
    Given a monster entity "monster" with 20 health at position 4,3
    When the character resolves action "attack" with target entity "monster"
    Then the action result should be successful
    And the action result wheel cost should be 2
    And monster "monster" should have 19 health

  Scenario: Attack action fails for non-adjacent target
    Given a monster entity "monster" with 20 health at position 6,3
    When the character resolves action "attack" with target entity "monster"
    Then the action result should fail with reason "Effect baseAttack failed"
    And monster "monster" should have 20 health

  # Rest Action

  Scenario: Character resolves rest action
    Given the character has a bead hand
    When the character resolves action "rest"
    Then the action result should be successful
    And the action result wheel cost should be 2
    And the character should have drawn beads

  # Invalid Actions

  Scenario: Unknown action throws error
    When the character attempts to resolve action "fireball"
    Then an error should be thrown with message "Unknown action: fireball"

  # Available Actions

  Scenario: Character has standard actions available
    Then the character should have actions available: move, run, attack, rest

  # Wheel Cost Verification

  Scenario Outline: Each action has correct wheel cost
    When I check the wheel cost of action "<action>"
    Then the wheel cost should be <cost>

    Examples:
      | action | cost |
      | move   | 1    |
      | run    | 2    |
      | attack | 2    |
      | rest   | 2    |
