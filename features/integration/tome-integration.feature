Feature: Tome Full Flow Integration
  As a game system
  I need to handle the complete Tome Bestiary and Overwrite flow
  So that tactical intelligence support works correctly

  Scenario: Bearer with Ponder - ally Assess - Cunning surcharge reduced by 1
    Given a tome integration grid of 12x12
    And a tome integration game context with the grid
    And a tome integration bearer at position 5,5 with 2 ponder stacks
    And a tome integration passive aura system with bestiary
    And a tome integration ally "scout" at position 5,8
    And a tome integration monster at position 9,9
    When the tome integration ally "scout" assesses the monster with cunning 3
    Then the tome integration assess cunning surcharge should be 2

  Scenario: Bearer Assess does not consume Ponder
    Given a tome integration grid of 12x12
    And a tome integration game context with the grid
    And a tome integration bearer at position 5,5 with 3 ponder stacks
    And a tome integration passive aura system with bestiary
    And a tome integration monster at position 5,6
    When the tome integration bearer assesses the monster
    Then the tome integration bearer should have 3 ponder stacks

  Scenario: Monster draws bead - Overwrite - bead returned - new draw
    Given a tome integration grid of 12x12
    And a tome integration game context with the grid
    And a tome integration bearer at position 5,5 with 0 ponder stacks
    And a tome integration monster at position 5,6 with bead bag
    When the tome integration monster draws a bead
    And the tome integration overwrite is cast on the monster
    Then the tome integration monster should have redrawn
