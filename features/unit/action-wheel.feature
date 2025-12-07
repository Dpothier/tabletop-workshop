Feature: Action Wheel
  As a game system
  I need to track creature positions on an 8-segment wheel
  So that turn order is determined by wheel position and FIFO arrival

  # FR-1.1: Track position (0-7) for each entity
  Scenario: Add entity to wheel
    Given an empty action wheel
    When I add entity "hero-1" at position 0
    Then entity "hero-1" should be at position 0
    And the wheel should have 1 entity

  Scenario: Add multiple entities at different positions
    Given an empty action wheel
    When I add entity "hero-1" at position 0
    And I add entity "hero-2" at position 2
    And I add entity "monster" at position 5
    Then the wheel should have 3 entities
    And entity "hero-1" should be at position 0
    And entity "hero-2" should be at position 2
    And entity "monster" should be at position 5

  Scenario: Cannot add entity with duplicate ID
    Given an action wheel with entity "hero-1" at position 0
    When I try to add entity "hero-1" at position 3
    Then an error should be thrown

  # FR-1.2: Track arrival order for FIFO tie-breaking
  Scenario: Track arrival order when adding entities
    Given an empty action wheel
    When I add entity "hero-1" at position 0
    And I add entity "hero-2" at position 0
    Then entity "hero-1" should have lower arrival order than "hero-2"

  # FR-1.3: Move entity forward by N steps with wrap-around
  Scenario: Advance entity by cost
    Given an action wheel with entity "hero-1" at position 2
    When entity "hero-1" takes action with cost 3
    Then entity "hero-1" should be at position 5

  Scenario: Advance entity with wrap-around
    Given an action wheel with entity "hero-1" at position 6
    When entity "hero-1" takes action with cost 3
    Then entity "hero-1" should be at position 1

  Scenario: Advance entity exactly to segment 7
    Given an action wheel with entity "hero-1" at position 4
    When entity "hero-1" takes action with cost 3
    Then entity "hero-1" should be at position 7

  Scenario: Advance entity from segment 7 wraps to 0
    Given an action wheel with entity "hero-1" at position 7
    When entity "hero-1" takes action with cost 1
    Then entity "hero-1" should be at position 0

  Scenario: Advance updates arrival order
    Given an action wheel with entities:
      | id      | position |
      | hero-1  | 0        |
      | hero-2  | 0        |
    When entity "hero-1" takes action with cost 0
    Then entity "hero-1" should have higher arrival order than "hero-2"

  # FR-1.4: Determine next actor (lowest position, FIFO on ties)
  Scenario: Next actor is entity at lowest position
    Given an action wheel with entities:
      | id      | position |
      | hero-1  | 3        |
      | hero-2  | 1        |
      | monster | 5        |
    When I get the next actor
    Then the next actor should be "hero-2"

  Scenario: Ties broken by FIFO arrival order
    Given an empty action wheel
    When I add entity "hero-1" at position 2
    And I add entity "hero-2" at position 2
    And I add entity "hero-3" at position 2
    And I get the next actor
    Then the next actor should be "hero-1"

  Scenario: Next actor returns null for empty wheel
    Given an empty action wheel
    When I get the next actor
    Then the next actor should be null

  # FR-1.5: Add/remove entities from wheel
  Scenario: Remove entity from wheel
    Given an action wheel with entities:
      | id      | position |
      | hero-1  | 0        |
      | hero-2  | 2        |
    When I remove entity "hero-1"
    Then the wheel should have 1 entity
    And entity "hero-1" should not exist on the wheel

  Scenario: Remove non-existent entity does nothing
    Given an action wheel with entity "hero-1" at position 0
    When I remove entity "hero-2"
    Then the wheel should have 1 entity

  # Query methods
  Scenario: Get entities at specific position
    Given an action wheel with entities:
      | id      | position |
      | hero-1  | 2        |
      | hero-2  | 2        |
      | hero-3  | 5        |
    When I get entities at position 2
    Then I should get 2 entities at that position

  Scenario: Advance non-existent entity throws error
    Given an action wheel with entity "hero-1" at position 0
    When I try to advance entity "hero-2" with cost 1
    Then an error should be thrown

  # PRD example flow
  Scenario: PRD example flow
    Given an empty action wheel
    # Initial: Hero A at 0, Hero B at 0, Monster at 2
    When I add entity "hero-a" at position 0
    And I add entity "hero-b" at position 0
    And I add entity "monster" at position 2
    # Hero A acts first (arrived first at position 0)
    Then the next actor should be "hero-a"
    # Hero A takes Move (cost 1)
    When entity "hero-a" takes action with cost 1
    # Hero A now at 1, Hero B at 0, Monster at 2
    Then entity "hero-a" should be at position 1
    And the next actor should be "hero-b"
    # Hero B takes Attack (cost 2)
    When entity "hero-b" takes action with cost 2
    # Hero A at 1, Hero B at 2, Monster at 2
    Then entity "hero-b" should be at position 2
    And the next actor should be "hero-a"
    # Hero A takes Attack (cost 2)
    When entity "hero-a" takes action with cost 2
    # Hero A at 3, Hero B at 2, Monster at 2
    Then entity "hero-a" should be at position 3
    # Hero B and Monster tied at 2, but Monster arrived before Hero B moved there
    And the next actor should be "monster"
