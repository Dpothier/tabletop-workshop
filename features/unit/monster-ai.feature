Feature: Monster AI
  As a game system
  I need monster AI to make tactical decisions
  So that combat is challenging and fair

  Background:
    Given a monster AI system

  Scenario: Find closest alive character
    Given a monster at grid position 5,5
    And characters at grid positions:
      | x | y | health |
      | 2 | 2 | 20     |
      | 4 | 5 | 15     |
      | 8 | 8 | 25     |
    When finding the closest target
    Then the closest target should be at 4,5

  Scenario: Ignore dead characters when targeting
    Given a monster at grid position 5,5
    And characters at grid positions:
      | x | y | health |
      | 4 | 5 | 0      |
      | 2 | 2 | 20     |
      | 8 | 8 | 25     |
    When finding the closest target
    Then the closest target should be at 2,2

  Scenario: No target when all characters are dead
    Given a monster at grid position 5,5
    And characters at grid positions:
      | x | y | health |
      | 2 | 2 | 0      |
      | 4 | 5 | 0      |
    When finding the closest target
    Then there should be no valid target

  Scenario: Select attack from current phase
    Given a monster with attacks:
      | key   | name  | damage | range |
      | slam  | Slam  | 2d6    | 1     |
      | stomp | Stomp | 3d4    | 1     |
    And the monster is in a phase with attacks "slam,stomp"
    When selecting an attack
    Then the selected attack should be one of "Slam,Stomp"

  Scenario: Select attack from all attacks when no phase
    Given a monster with attacks:
      | key   | name  | damage | range |
      | slam  | Slam  | 2d6    | 1     |
      | roar  | Roar  | 1d8    | 3     |
    And the monster has no phases
    When selecting an attack
    Then the selected attack should be one of "Slam,Roar"

  Scenario: Decide to attack when in range
    Given a monster at grid position 5,5
    And a character at grid position 5,6 with 20 health
    And the monster has melee attack with range 1
    When deciding monster action
    Then the action should be "attack"

  Scenario: Decide to move when out of range
    Given a monster at grid position 5,5
    And a character at grid position 5,8 with 20 health
    And the monster has melee attack with range 1
    When deciding monster action
    Then the action should be "move"

  Scenario: Calculate movement toward target
    Given a monster at grid position 5,5
    And a target at grid position 8,5
    When calculating movement with speed 2
    Then the destination should be 7,5

  Scenario: Movement respects arena bounds
    Given a monster at grid position 5,5
    And a target at grid position 10,5
    And arena bounds of 8x8
    When calculating movement with speed 3
    Then the destination should be within bounds

  Scenario: Movement avoids occupied tiles
    Given a monster at grid position 5,5
    And a target at grid position 8,5
    And a blocking token at position 6,5
    When calculating movement with speed 2
    Then the destination should not be 6,5
