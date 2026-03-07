Feature: Entity Unified Buffs Map
  As a game designer
  I need entities to own a unified buffs map for all status effects and preparations
  So that new effects only need a resolution rule, not new maps or dedicated methods

  Scenario: Entity starts with empty buffs map
    Given a buffs entity "hero" with 10 health
    Then the buffs entity should have 0 stacks of "burn"
    And the buffs entity should have 0 stacks of "windup"

  Scenario: Add stacks to entity buffs map
    Given a buffs entity "hero" with 10 health
    When I add 3 stacks of "burn" to the buffs entity
    Then the buffs entity should have 3 stacks of "burn"

  Scenario: Add stacks accumulates with existing stacks
    Given a buffs entity "hero" with 10 health
    And the buffs entity has 2 stacks of "windup"
    When I add 1 stacks of "windup" to the buffs entity
    Then the buffs entity should have 3 stacks of "windup"

  Scenario: Clear stacks removes specific effect
    Given a buffs entity "hero" with 10 health
    And the buffs entity has 3 stacks of "burn"
    And the buffs entity has 2 stacks of "poison"
    When I clear stacks of "burn" on the buffs entity
    Then the buffs entity should have 0 stacks of "burn"
    And the buffs entity should have 2 stacks of "poison"

  Scenario: Clear all removes all effects
    Given a buffs entity "hero" with 10 health
    And the buffs entity has 3 stacks of "burn"
    And the buffs entity has 2 stacks of "windup"
    When I clear all stacks on the buffs entity
    Then the buffs entity should have 0 stacks of "burn"
    And the buffs entity should have 0 stacks of "windup"

  Scenario: Get stacks returns 0 for unknown effects
    Given a buffs entity "hero" with 10 health
    When I query stacks of "bleed" on the buffs entity
    Then the buffs entity should have 0 stacks of "bleed"

  Scenario: PreparationManager enforces max stacks via entity buffs
    Given a buffs entity "warrior" with 10 health
    And a preparation manager with max 3 stacks for "windup"
    When I add 5 windup stacks via the preparation manager
    Then the buffs entity should have 3 stacks of "windup"

  Scenario: StatusEffectManager applies end-of-round burn damage via entity buffs
    Given a buffs entity "hero" with 10 health
    And the buffs entity has 2 stacks of "burn"
    And a status effect manager
    When the status effect manager resolves end of round
    Then the buffs entity should have 8 health
    And the buffs entity should have 1 stacks of "burn"
