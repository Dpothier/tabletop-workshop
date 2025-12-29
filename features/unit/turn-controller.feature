Feature: Turn Controller
  As a battle system
  I need to manage turn order and track battle state
  So that the game can determine when to progress turns and declare victory/defeat

  # FR-2.1: Victory condition
  Scenario: Check victory returns true when monster is dead
    Given a turn controller with a dead monster and 2 alive characters
    When I check victory
    Then victory should be true

  Scenario: Check victory returns false when monster is alive
    Given a turn controller with an alive monster and 2 alive characters
    When I check victory
    Then victory should be false

  # FR-2.2: Defeat condition
  Scenario: Check defeat returns true when all characters are dead
    Given a turn controller with an alive monster and 0 alive characters
    When I check defeat
    Then defeat should be true

  Scenario: Check defeat returns true when some characters are dead
    Given a turn controller with an alive monster and 1 alive character
    When I check defeat
    Then defeat should be false

  Scenario: Check defeat returns false when all characters are alive
    Given a turn controller with an alive monster and 3 alive characters
    When I check defeat
    Then defeat should be false

  # FR-2.3: Next actor delegation
  Scenario: Get next actor delegates to action wheel
    Given a turn controller with entities on the wheel:
      | id      | position |
      | hero-1  | 2        |
      | monster | 0        |
    When I get the next actor from turn controller
    Then the next actor from turn controller should be "monster"

  Scenario: Get next actor returns null when wheel is empty
    Given a turn controller with an empty wheel
    When I get the next actor from turn controller
    Then the next actor from turn controller should be null

  # FR-2.4: Advance turn
  Scenario: Advance turn updates wheel position
    Given a turn controller with an entity "hero-1" at position 1
    When I advance turn for "hero-1" with cost 2
    Then "hero-1" should be at position 3 on the wheel

  # FR-2.5: Battle status
  Scenario: Returns 'ongoing' when monster alive and characters alive
    Given a turn controller with an alive monster and 2 alive characters
    When I get the battle status
    Then the battle status should be "ongoing"

  Scenario: Returns 'victory' when monster is dead
    Given a turn controller with a dead monster and 2 alive characters
    When I get the battle status
    Then the battle status should be "victory"

  Scenario: Returns 'defeat' when all characters are dead
    Given a turn controller with an alive monster and 0 alive characters
    When I get the battle status
    Then the battle status should be "defeat"
