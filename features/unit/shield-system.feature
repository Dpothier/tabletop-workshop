Feature: Shield System - Foundation for shield equipment and Block reaction
  As a defender with a shield
  I need Block as a defensive reaction and passive Guard from my shield
  So that I have additional protection in combat

  Background:
    Given a shield system test grid of 12x12
    And a shield system test game context with the grid

  Scenario: Block grants +1 Guard to the defender
    Given a shield system test bearer at position 5,5 with 0 guard
    When the shield system test block is triggered
    Then the shield system test block result should be successful
    And the shield system test bearer should have 1 guard

  Scenario: Block costs 1 bead of any color
    When I check the shield system test block action cost from YAML
    Then the shield system test block cost should have 1 anyColor bead

  Scenario: Block is only available if defender has shield with block modifier
    Given a shield system test bearer at position 5,5 with 0 guard
    And the shield system test bearer has no shield equipped
    When the shield system test block availability is checked
    Then the shield system test block should not be available

  Scenario: passiveGuard from shield is added to defense stats
    Given a shield system test character with shield equipped having passiveGuard 1
    Then the shield system test character defense guard should be 1

  Scenario: Two-handed weapon blocks off-hand shield equip
    Given a shield system test character with two-handed weapon equipped
    When the shield system test character tries to equip a shield
    Then the shield system test equip should have thrown an error

  Scenario: Shield does not provide attack modifiers
    When I check the shield system test shield equipment from YAML
    Then the shield system test shield should not have attack modifiers
