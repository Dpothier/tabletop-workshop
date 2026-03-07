Feature: Weapon Attack via Action Pipeline
  As a game designer
  I need weapon stats to flow through the action pipeline
  So that weapon power and agility determine attack outcomes

  Background:
    Given a weapon pipeline grid of 9x9
    And a weapon pipeline game context with the grid
    And a weapon pipeline mock BattleAdapter

  Scenario: Weapon power determines damage dealt
    Given a weapon pipeline attacker at 0,0
    And a weapon pipeline target at 1,0 with 20 health and 0 armor 0 guard 0 evasion
    When I execute a weapon attack with power 3 and agility 5
    Then the weapon pipeline result should succeed
    And the weapon pipeline target health should be less than 20

  Scenario: High evasion target can dodge low agility attack
    Given a weapon pipeline attacker at 0,0
    And a weapon pipeline target at 1,0 with 20 health and 0 armor 0 guard 5 evasion
    When I execute a weapon attack with power 3 and agility 1
    Then the weapon pipeline result should succeed
    And the weapon pipeline outcome should be "dodged"

  Scenario: High guard reduces damage from attack
    Given a weapon pipeline attacker at 0,0
    And a weapon pipeline target at 1,0 with 20 health and 0 armor 3 guard 0 evasion
    When I execute a weapon attack with power 2 and agility 5
    Then the weapon pipeline result should succeed
    And the weapon pipeline outcome should be "guarded"

  Scenario: Power exceeding armor deals full damage
    Given a weapon pipeline attacker at 0,0
    And a weapon pipeline target at 1,0 with 20 health and 2 armor 0 guard 0 evasion
    When I execute a weapon attack with power 5 and agility 5
    Then the weapon pipeline result should succeed
    And the weapon pipeline outcome should be "hit"
    And the weapon pipeline target health should be less than 20

  Scenario: Zero power attack deals no damage on hit
    Given a weapon pipeline attacker at 0,0
    And a weapon pipeline target at 1,0 with 20 health and 0 armor 0 guard 0 evasion
    When I execute a weapon attack with power 0 and agility 5
    Then the weapon pipeline result should succeed
    And the weapon pipeline target should have 20 health

  Scenario: Weapon attack fails against non-adjacent target
    Given a weapon pipeline attacker at 0,0
    And a weapon pipeline target at 3,0 with 20 health and 0 armor 0 guard 0 evasion
    When I execute a weapon attack with power 3 and agility 3
    Then the weapon pipeline result should fail

  Scenario: Weapon attack returns animation events
    Given a weapon pipeline attacker at 0,0
    And a weapon pipeline target at 1,0 with 20 health and 0 armor 0 guard 0 evasion
    When I execute a weapon attack with power 3 and agility 5
    Then the weapon pipeline result should have animation events
