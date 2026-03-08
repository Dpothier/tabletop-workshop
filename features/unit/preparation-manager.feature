Feature: PreparationManager via Entity Buffs
  As a game systems designer
  I need PreparationManager to manage preparation stacks through Entity.buffs
  So that preparation effects are properly tracked and enforced with max stack limits

  Scenario: Add preparation stacks stores them on entity buffs
    Given a prep manager grid and entity
    And the prep entity has 0 stacks of "aim"
    When I add 2 stacks of "aim" to the entity via prep manager
    Then the prep entity should have 2 stacks of "aim"

  Scenario: Preparation stacks respect max stacks cap
    Given a prep manager grid and entity
    And the prep entity has 0 stacks of "windup"
    When I add 5 stacks of "windup" to the entity via prep manager
    Then the prep entity should have 1 stacks of "windup"

  Scenario: Get preparation stacks reads from entity buffs
    Given a prep manager grid and entity
    And the prep entity has 2 stacks of "ponder"
    When I query preparation stacks of "ponder" via prep manager
    Then the queried preparation stacks should be 2

  Scenario: Clear specific preparation type removes from entity buffs
    Given a prep manager grid and entity
    And the prep entity has 3 stacks of "aim"
    And the prep entity has 2 stacks of "channel"
    When I clear preparation "aim" via prep manager
    Then the prep entity should have 0 stacks of "aim"
    And the prep entity should have 2 stacks of "channel"

  Scenario: Interruption via damage taken clears all preparations
    Given a prep manager grid and entity
    And the prep entity has 2 stacks of "aim"
    And the prep entity has 1 stacks of "channel"
    When I interrupt all preparations via prep manager
    Then the prep entity should have 0 stacks of "aim"
    And the prep entity should have 0 stacks of "channel"

  Scenario: Paired action validation succeeds when stacks present
    Given a prep manager grid and entity
    And the prep entity has 1 stacks of "windup"
    When I check if entity has paired stacks for "windup" via prep manager
    Then the paired check should succeed

  Scenario: Paired action validation fails when no stacks
    Given a prep manager grid and entity
    And the prep entity has 0 stacks of "windup"
    When I check if entity has paired stacks for "windup" via prep manager
    Then the paired check should fail
