Feature: Battle Grid
  As a position management system
  I need to track entity positions on the grid
  So that movement and distance calculations have a single source of truth

  Background:
    Given a battle grid of size 9x9

  # Registration and Position Queries

  Scenario: Register entity at a position
    When I register entity "hero-0" at position 3,4
    Then entity "hero-0" should be at position 3,4

  Scenario: Get position of unregistered entity returns null
    Then getting position of "unknown" should return null

  Scenario: Get entity at occupied position
    Given entity "hero-0" is registered at position 3,4
    Then the entity at position 3,4 should be "hero-0"

  Scenario: Get entity at empty position returns null
    Then the entity at position 5,5 should be null

  Scenario: Register multiple entities at different positions
    When I register entity "hero-0" at position 1,1
    And I register entity "hero-1" at position 2,2
    And I register entity "monster" at position 5,5
    Then entity "hero-0" should be at position 1,1
    And entity "hero-1" should be at position 2,2
    And entity "monster" should be at position 5,5

  # Movement

  Scenario: Move entity to valid empty position
    Given entity "hero-0" is registered at position 3,3
    When I move entity "hero-0" to position 4,4
    Then the move result should be successful
    And entity "hero-0" should be at position 4,4
    And the entity at position 3,3 should be null

  Scenario: Reject move to out-of-bounds position (too high)
    Given entity "hero-0" is registered at position 8,8
    When I move entity "hero-0" to position 9,8
    Then the move result should fail with reason "out of bounds"
    And entity "hero-0" should be at position 8,8

  Scenario: Reject move to out-of-bounds position (negative)
    Given entity "hero-0" is registered at position 0,0
    When I move entity "hero-0" to position -1,0
    Then the move result should fail with reason "out of bounds"
    And entity "hero-0" should be at position 0,0

  Scenario: Reject move to occupied position
    Given entity "hero-0" is registered at position 3,3
    And entity "monster" is registered at position 4,4
    When I move entity "hero-0" to position 4,4
    Then the move result should fail with reason "occupied"
    And entity "hero-0" should be at position 3,3

  # Distance Calculations

  Scenario: Calculate Manhattan distance between adjacent entities
    Given entity "hero-0" is registered at position 3,3
    And entity "monster" is registered at position 4,3
    Then the distance between "hero-0" and "monster" should be 1

  Scenario: Calculate Manhattan distance between diagonal entities
    Given entity "hero-0" is registered at position 3,3
    And entity "monster" is registered at position 5,5
    Then the distance between "hero-0" and "monster" should be 4

  Scenario: Calculate distance to self is zero
    Given entity "hero-0" is registered at position 3,3
    Then the distance between "hero-0" and "hero-0" should be 0

  # Adjacency

  Scenario: Horizontally adjacent entities are adjacent
    Given entity "hero-0" is registered at position 3,3
    And entity "monster" is registered at position 4,3
    Then "hero-0" and "monster" should be adjacent

  Scenario: Vertically adjacent entities are adjacent
    Given entity "hero-0" is registered at position 3,3
    And entity "monster" is registered at position 3,4
    Then "hero-0" and "monster" should be adjacent

  Scenario: Diagonal entities are not adjacent
    Given entity "hero-0" is registered at position 3,3
    And entity "monster" is registered at position 4,4
    Then "hero-0" and "monster" should not be adjacent

  Scenario: Entities 2 tiles apart are not adjacent
    Given entity "hero-0" is registered at position 3,3
    And entity "monster" is registered at position 5,3
    Then "hero-0" and "monster" should not be adjacent

  # Valid Moves

  Scenario: Get valid moves with range 1
    Given entity "hero-0" is registered at position 3,3
    When I get valid moves for "hero-0" with range 1
    Then the valid moves should contain position 3,4
    And the valid moves should contain position 4,3
    And the valid moves should contain position 3,2
    And the valid moves should contain position 2,3
    And the valid moves should not contain position 3,3
    And the valid moves should not contain position 4,4

  Scenario: Valid moves exclude occupied positions
    Given entity "hero-0" is registered at position 3,3
    And entity "monster" is registered at position 4,3
    When I get valid moves for "hero-0" with range 1
    Then the valid moves should not contain position 4,3
    And the valid moves should contain position 3,4

  Scenario: Valid moves respect grid boundaries
    Given entity "hero-0" is registered at position 0,0
    When I get valid moves for "hero-0" with range 1
    Then the valid moves should contain position 1,0
    And the valid moves should contain position 0,1
    And the valid moves should not contain position -1,0
    And the valid moves should not contain position 0,-1

  Scenario: Get valid moves with range 2
    Given entity "hero-0" is registered at position 3,3
    When I get valid moves for "hero-0" with range 2
    Then the valid moves should contain position 5,3
    And the valid moves should contain position 4,4
    And the valid moves should contain position 3,5
    And the valid moves should not contain position 5,5

  # Bounds Checking

  Scenario: Position at origin is in bounds
    Then position 0,0 should be in bounds

  Scenario: Position at max boundary is in bounds
    Then position 8,8 should be in bounds

  Scenario: Position beyond max is out of bounds
    Then position 9,0 should be out of bounds

  Scenario: Negative position is out of bounds
    Then position -1,3 should be out of bounds

  # Unregister

  Scenario: Unregister entity removes it from grid
    Given entity "hero-0" is registered at position 3,3
    When I unregister entity "hero-0"
    Then getting position of "hero-0" should return null
    And the entity at position 3,3 should be null

  Scenario: Unregister non-existent entity does not error
    When I unregister entity "unknown"
    Then no error should be thrown
