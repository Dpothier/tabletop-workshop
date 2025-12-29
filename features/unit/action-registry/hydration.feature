Feature: ActionRegistry hydrates actions

  As a game developer
  I need ActionRegistry to return hydrated Action instances with effects attached
  So that callers can directly use action.resolve() without manual EffectRegistry lookups

  Background:
    Given an EffectRegistry with "attack" and "move" effects registered
    And a context factory function

  Scenario: Registry returns Action with hydrated effects
    Given an ActionDefinition "strike" with effect type "attack"
    And an ActionRegistry with the EffectRegistry and context factory
    When I register the action definition
    And I call actionRegistry.get("strike")
    Then I receive an Action instance
    And the action has hydrated effects

  Scenario: Registry caches hydrated actions
    Given an ActionDefinition "strike" with effect type "attack"
    And an ActionRegistry with the EffectRegistry and context factory
    When I register the action definition
    And I call actionRegistry.get("strike") twice
    Then I receive the same Action instance both times

  Scenario: Unknown action returns undefined
    Given an ActionRegistry with the EffectRegistry and context factory
    When I call actionRegistry.get("unknown")
    Then I receive undefined

  Scenario: Registry hydrates multiple effects in an action
    Given an ActionDefinition "complex-move" with effects:
      | type | id   |
      | move | move1 |
      | move | move2 |
    And an ActionRegistry with the EffectRegistry and context factory
    When I register the action definition
    And I call actionRegistry.get("complex-move")
    Then I receive an Action instance
    And the action has 2 hydrated effects

  Scenario: Registry handles missing effect type gracefully
    Given an ActionDefinition "broken" with effect type "unknown-effect-type"
    And an ActionRegistry with the EffectRegistry and context factory
    When I register the action definition
    And I call actionRegistry.get("broken")
    Then I receive an error or undefined result
