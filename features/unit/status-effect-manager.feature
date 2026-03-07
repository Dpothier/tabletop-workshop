Feature: StatusEffectManager via Entity Buffs
  As a game systems designer
  I need StatusEffectManager to manage status effects through Entity.buffs
  So that status effects like burn are properly applied and resolved each round

  Scenario: Apply burn stacks stores them on entity buffs
    Given a status effect manager grid and entity
    And the status entity has 0 stacks of "burn"
    When I apply 2 stacks of burn to the entity via status manager
    Then the status entity should have 2 stacks of "burn"

  Scenario: Burn stacks accumulate on entity buffs
    Given a status effect manager grid and entity
    And the status entity has 1 stacks of "burn"
    When I apply 2 stacks of burn to the entity via status manager
    Then the status entity should have 3 stacks of "burn"

  Scenario: End-of-round burn deals damage equal to stacks and decrements by 1
    Given a status effect manager grid and entity with 10 health
    And the status entity has 3 stacks of "burn"
    When I resolve end of round burn via status manager
    Then the status entity should have 7 health
    And the status entity should have 2 stacks of "burn"

  Scenario: End-of-round burn at 1 stack deals 1 damage and removes burn
    Given a status effect manager grid and entity with 10 health
    And the status entity has 1 stacks of "burn"
    When I resolve end of round burn via status manager
    Then the status entity should have 9 health
    And the status entity should have 0 stacks of "burn"

  Scenario: Get burn stacks reads from entity buffs
    Given a status effect manager grid and entity
    And the status entity has 2 stacks of "burn"
    When I query burn stacks via status manager
    Then the queried burn stacks should be 2

  Scenario: Clear burn stacks removes from entity buffs
    Given a status effect manager grid and entity
    And the status entity has 3 stacks of "burn"
    When I clear burn stacks via status manager
    Then the status entity should have 0 stacks of "burn"
