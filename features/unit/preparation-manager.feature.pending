Feature: PreparationManager via Entity Buffs
  As a game systems designer
  I need PreparationManager to manage preparation stacks through Entity.buffs
  So that preparation effects are properly tracked and enforced with max stack limits

  Scenario: Add preparation stacks stores them on entity buffs
    Given a prep manager grid and entity
    And the prep entity has 0 stacks of "focus"
    When I add 2 stacks of "focus" to the entity via prep manager
    Then the prep entity should have 2 stacks of "focus"

  Scenario: Preparation stacks respect max stacks cap
    Given a prep manager grid and entity
    And the prep entity has 0 stacks of "charge"
    When I add 5 stacks of "charge" to the entity via prep manager with max 3
    Then the prep entity should have 3 stacks of "charge"

  Scenario: Get preparation stacks reads from entity buffs
    Given a prep manager grid and entity
    And the prep entity has 2 stacks of "brace"
    When I query preparation stacks of "brace" via prep manager
    Then the queried preparation stacks should be 2

  Scenario: Clear specific preparation type removes from entity buffs
    Given a prep manager grid and entity
    And the prep entity has 3 stacks of "focus"
    And the prep entity has 2 stacks of "charge"
    When I clear preparation "focus" via prep manager
    Then the prep entity should have 0 stacks of "focus"
    And the prep entity should have 2 stacks of "charge"

  Scenario: Interruption via damage taken clears all preparations
    Given a prep manager grid and entity
    And the prep entity has 2 stacks of "focus"
    And the prep entity has 1 stacks of "charge"
    When I interrupt all preparations via prep manager
    Then the prep entity should have 0 stacks of "focus"
    And the prep entity should have 0 stacks of "charge"

  Scenario: Paired action validation succeeds when stacks present
    Given a prep manager grid and entity
    And the prep entity has 1 stacks of "paired-attack"
    When I check if entity has paired stacks for "paired-attack" via prep manager
    Then the paired check should succeed

  Scenario: Paired action validation fails when no stacks
    Given a prep manager grid and entity
    And the prep entity has 0 stacks of "paired-attack"
    When I check if entity has paired stacks for "paired-attack" via prep manager
    Then the paired check should fail
