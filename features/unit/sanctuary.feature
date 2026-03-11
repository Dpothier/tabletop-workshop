Feature: Sanctuary - Tear of Light zone spell
  As a caster
  I need to create protective sanctuary zones
  So that I can protect myself and control the battlefield

  Background:
    Given a sanctuary test grid of 9x9
    And a sanctuary test game context with the grid

  # Zone Creation and Size

  Scenario: Sanctuary creates a 3x3 zone centered on the caster
    Given a sanctuary caster at position 5,5
    When the sanctuary effect is executed with size 3
    Then a sanctuary zone should exist at center 5,5
    And the sanctuary zone should have size 3

  Scenario: Sanctuary enhancement Zone 5x5 extends the zone
    Given a sanctuary caster at position 5,5
    When the sanctuary effect is executed with size 5
    Then a sanctuary zone should exist at center 5,5
    And the sanctuary zone should have size 5

  Scenario: Sanctuary enhancement Zone 7x7 extends the zone further
    Given a sanctuary caster at position 5,5
    When the sanctuary effect is executed with size 7
    Then a sanctuary zone should exist at center 5,5
    And the sanctuary zone should have size 7

  Scenario: Zone 7x7 enhancement requires Zone 5x5 as prerequisite
    When I check the sanctuary enhancements from YAML
    Then the zone-7x7 enhancement should require zone-5x5

  # Cost

  Scenario: Sanctuary base cost is 2 windup + 1 white bead
    When I check the sanctuary action cost
    Then the cost should have 2 windup
    And the cost should have 1 white bead

  # Zone Mechanics - Enemy Pushing

  Scenario: Enemies in the zone are pushed to the nearest edge on creation
    Given a sanctuary caster at position 5,5
    And an enemy at position 5,5
    When the sanctuary effect is executed with size 3
    Then the enemy should be pushed to a sanctuary zone edge
    And the enemy should not be in the sanctuary zone

  Scenario: Enemy pushed against obstacle takes 1 collision damage
    Given a sanctuary caster at position 5,5
    And an enemy at position 5,6 with 10 health
    And an obstacle at position 5,7
    When the sanctuary effect is executed with size 3
    Then the enemy should have taken 1 collision damage
    And the enemy should have 9 health

  # Zone Entry Prevention

  Scenario: Enemies cannot enter the active sanctuary zone
    Given a sanctuary caster at position 5,5
    And an active sanctuary zone at center 5,5 with size 3
    And an enemy at position 4,4
    When the enemy tries to move to position 5,5
    Then the move should fail

  # Breach Mechanic

  Scenario: Zone owner can repel a breach by paying 2 (Channel + White)
    Given a sanctuary caster at position 5,5 with 3 channel stacks
    And an active sanctuary zone at center 5,5 with size 3
    And an enemy at position 6,6 trying to breach the zone
    When the caster repels the breach with 1 channel and 1 white bead
    Then the enemy should be pushed outside the zone
    And the caster should have 2 channel stacks remaining

  # Zone Persistence - Collapse Conditions

  Scenario: Zone disappears when caster has 0 Channel stacks
    Given a sanctuary caster at position 5,5 with 1 channel stacks
    And an active sanctuary zone at center 5,5 with size 3
    When the caster loses their last channel stack
    Then the sanctuary zone should be removed

  Scenario: Zone disappears if caster takes non-Channel action
    Given a sanctuary caster at position 5,5 with 1 channel stacks
    And an active sanctuary zone at center 5,5 with size 3
    When the caster performs a non-Channel action
    Then the sanctuary zone should be removed

  Scenario: Zone disappears if caster takes damage
    Given a sanctuary caster at position 5,5 with 2 channel stacks
    And an active sanctuary zone at center 5,5 with size 3
    When the caster takes 3 damage
    Then the sanctuary zone should be removed

  Scenario: Zone disappears if caster uses a defensive reaction
    Given a sanctuary caster at position 5,5 with 2 channel stacks
    And an active sanctuary zone at center 5,5 with size 3
    When the caster uses a defensive reaction
    Then the sanctuary zone should be removed

  # Zone Persistence - Positive Conditions

  Scenario: Caster can Channel while zone is active
    Given a sanctuary caster at position 5,5 with 1 channel stacks
    And an active sanctuary zone at center 5,5 with size 3
    When the caster uses Channel action
    Then the caster should now have 2 channel stacks
    And the sanctuary zone should still be active

  Scenario: Zone moves with caster if caster is moved by external effect
    Given a sanctuary caster at position 5,5
    And an active sanctuary zone at center 5,5 with size 3
    When the caster is moved to position 6,6 by an external effect
    Then the sanctuary zone should be centered at 6,6
