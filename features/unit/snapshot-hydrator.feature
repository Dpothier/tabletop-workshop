Feature: Snapshot Hydrator
  As a replay system
  I need to extract entity positions from a battle snapshot
  So that the replay can reconstruct the initial visual state

  Scenario: hydrator extracts entity positions from snapshot correctly
    Given a hydrator battle snapshot with 2 characters and 1 monster
    When I hydrator extract entity positions from the snapshot
    Then the hydrator positions map should have 3 entries
    And the hydrator position for "hero-0" should match the snapshot
    And the hydrator position for "monster" should match the snapshot
