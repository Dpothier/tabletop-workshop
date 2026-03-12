Feature: Throwing Dagger - Light Melee weapon with Throw and Parade
  As a fighter with a Throwing Dagger
  I need to throw the dagger as a ranged attack and defend with Parade
  So that I can control the battlefield with flexible attack options

  Background:
    Given a throwing-dagger test grid of 12x12
    And a throwing-dagger test game context with the grid

  # Throwing Dagger Equipment
  Scenario: Throwing Dagger has power 1
    When I check the throwing-dagger test equipment from YAML
    Then the throwing-dagger test equipment power should be 1

  Scenario: Throwing Dagger has agility 1
    When I check the throwing-dagger test equipment from YAML
    Then the throwing-dagger test equipment agility should be 1

  Scenario: Throwing Dagger is one-handed
    When I check the throwing-dagger test equipment from YAML
    Then the throwing-dagger test equipment twoHanded should be false

  Scenario: Throwing Dagger has throwable tag
    When I check the throwing-dagger test equipment from YAML
    Then the throwing-dagger test equipment should have tag "throwable"

  Scenario: Throwing Dagger has Parade in granted modifiers
    When I check the throwing-dagger test equipment from YAML
    Then the throwing-dagger test equipment should have granted modifier "parade"

  # Throw Action
  Scenario: Throw action costs 2 time and 1 green bead
    When I check the throwing-dagger test throw action cost from YAML
    Then the throwing-dagger test throw cost should have 2 time beads
    And the throwing-dagger test throw cost should have 1 green bead

  Scenario: Throw action has range 6
    When I check the throwing-dagger test throw action from YAML
    Then the throwing-dagger test throw range should be 6

  # Throw Effect - Hit
  Scenario: Throw effect executes successfully
    Given a throwing-dagger test bearer at position 5,5
    And a throwing-dagger test target "victim" at position 5,6
    When the throwing-dagger test throw effect is triggered for "victim" with power 1 and agility 1
    Then the throwing-dagger test throw effect result should be successful
    And the throwing-dagger test throw effect should have weapon drop position at 5,6

  # Throw Effect - Dodge
  Scenario: Throw effect on dodge drops weapon at maximum trajectory position
    Given a throwing-dagger test bearer at position 5,5
    And a throwing-dagger test target "victim" at position 5,11
    When the throwing-dagger test throw effect is triggered for "victim" with hit outcome "dodge" at maximum range
    Then the throwing-dagger test throw effect result should be successful
    And the throwing-dagger test weapon should be dropped at trajectory end position

  # Weapon Dropped State
  Scenario: With weapon dropped, bearer loses attack action
    Given a throwing-dagger test bearer at position 5,5
    When the throwing-dagger test bearer has weapon dropped
    And I check throwing-dagger test available actions for bearer
    Then the throwing-dagger test available actions should not include "attack"

  Scenario: With weapon dropped, bearer loses quickStrike action
    Given a throwing-dagger test bearer at position 5,5
    When the throwing-dagger test bearer has weapon dropped
    And I check throwing-dagger test available actions for bearer
    Then the throwing-dagger test available actions should not include "quickStrike"

  Scenario: With weapon dropped, bearer loses parade action
    Given a throwing-dagger test bearer at position 5,5
    When the throwing-dagger test bearer has weapon dropped
    And I check throwing-dagger test available actions for bearer
    Then the throwing-dagger test available actions should not include "parade"

  Scenario: With weapon dropped, bearer keeps move action
    Given a throwing-dagger test bearer at position 5,5
    When the throwing-dagger test bearer has weapon dropped
    And I check throwing-dagger test available actions for bearer
    Then the throwing-dagger test available actions should include "move"

  Scenario: With weapon dropped, bearer keeps run action
    Given a throwing-dagger test bearer at position 5,5
    When the throwing-dagger test bearer has weapon dropped
    And I check throwing-dagger test available actions for bearer
    Then the throwing-dagger test available actions should include "run"

  Scenario: With weapon dropped, bearer keeps rest action
    Given a throwing-dagger test bearer at position 5,5
    When the throwing-dagger test bearer has weapon dropped
    And I check throwing-dagger test available actions for bearer
    Then the throwing-dagger test available actions should include "rest"

  # Auto-Recovery
  Scenario: Bearer auto-recovers weapon when moving to dropped tile
    Given a throwing-dagger test bearer at position 5,5
    And a throwing-dagger test weapon dropped at position 6,5
    When the throwing-dagger test bearer moves to position 6,5
    And I check throwing-dagger test weapon recovery status
    Then the throwing-dagger test weapon should be recovered
    And the throwing-dagger test dropped position should be null

  # After Recovery
  Scenario: After recovery, bearer regains attack action
    Given a throwing-dagger test bearer at position 5,5
    And a throwing-dagger test weapon dropped at position 6,5
    When the throwing-dagger test bearer moves to position 6,5
    And I check throwing-dagger test available actions for bearer
    Then the throwing-dagger test available actions should include "attack"

  Scenario: After recovery, bearer regains parade action
    Given a throwing-dagger test bearer at position 5,5
    And a throwing-dagger test weapon dropped at position 6,5
    When the throwing-dagger test bearer moves to position 6,5
    And I check throwing-dagger test available actions for bearer
    Then the throwing-dagger test available actions should include "parade"

  # Parade Modifier
  Scenario: Parade costs 1 red bead
    When I check the throwing-dagger test parade action cost from YAML
    Then the throwing-dagger test parade cost should have 1 red bead

  Scenario: Parade grants +1 guard modifier
    When I check the throwing-dagger test parade modifier from YAML
    Then the throwing-dagger test parade guard modifier should be 1
