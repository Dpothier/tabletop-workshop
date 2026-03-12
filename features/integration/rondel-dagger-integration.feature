Feature: Rondel Dagger Integration - Percer through combat pipeline and Parade as sourced reaction
  As a player using Rondel Dagger
  I need Percer to ignore armor in full combat and Parade to be equipment-sourced
  So that the piercing and defensive mechanics work end-to-end

  Background:
    Given a rondel-dagger integration grid of 12x12
    And a rondel-dagger integration game context with the grid
    And a rondel-dagger integration attacker at position 5,5
    And a rondel-dagger integration target "victim" at position 5,6 with 20 health

  Scenario: Full attack with Percer against defenseless target ignores armor for max damage
    Given the rondel-dagger integration target has defense stats guard 0, evasion 0, armor 3
    When the rondel-dagger integration attack resolves with percer modifier
    Then the rondel-dagger integration combat outcome should be "hit"
    And the rondel-dagger integration combat damage should be 1
    And the rondel-dagger integration target health should be 19

  Scenario: Percer against guarded target cannot pierce
    Given the rondel-dagger integration target has defense stats guard 1, evasion 0, armor 3
    When the rondel-dagger integration attack resolves with percer modifier
    Then the rondel-dagger integration combat outcome should be "guarded"
    And the rondel-dagger integration combat damage should be 0
    And the rondel-dagger integration target health should be 20

  Scenario: Parade sourced from equipment is available only to parade-equipped defenders
    Given the rondel-dagger integration defender has equipment modifiers "parade"
    And the rondel-dagger integration defender has 2 red beads
    When the rondel-dagger integration defensive options are checked for melee attack
    Then the rondel-dagger integration parade option should be available

  Scenario: Parade NOT available to defender without parade equipment
    Given the rondel-dagger integration defender has equipment modifiers ""
    And the rondel-dagger integration defender has 2 red beads
    When the rondel-dagger integration defensive options are checked for melee attack
    Then the rondel-dagger integration parade option should NOT be available
