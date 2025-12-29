Feature: Action business object
  As a game developer
  I need Action to be a complete business object with hydrated effects
  So that action execution is decoupled from EffectRegistry lookups

  # Step 3.2: parametrize() tests

  Scenario: Action yields parameter prompts from definition
    Given an action definition with parameters:
      | key    | type   |
      | target | tile   |
      | power  | option |
    And an Action created from the definition
    When I iterate over the action parametrize generator
    Then I receive 2 prompts
    And prompt 1 has key "target" and type "tile"
    And prompt 2 has key "power" and type "option"

  Scenario: Action with no parameters yields nothing
    Given an action definition with no parameters
    And an Action created from the definition
    When I iterate over the action parametrize generator
    Then I receive 0 prompts

  Scenario: Parameters are yielded in definition order
    Given an action definition with parameters in order:
      | key | type   |
      | a   | tile   |
      | b   | entity |
      | c   | option |
    And an Action created from the definition
    When I iterate over the action parametrize generator
    Then I receive 3 prompts
    And prompt 1 has type "tile"
    And prompt 2 has type "entity"
    And prompt 3 has type "option"

  # Step 3.3: applyEffects() - single effect tests

  Scenario: Single effect executes and returns events
    Given a battle grid of size 9x9
    And an entity "hero-0" with 10 health registered at position 3,3
    And a game context with the grid and actor "hero-0"
    And an action with a move effect to position 4,4
    When I call applyEffects with empty params
    Then the effect result is successful
    And the effect result contains animation events
    And entity "hero-0" is at position 4,4

  Scenario: Effect failure returns unsuccessful result
    Given a battle grid of size 9x9
    And an entity "hero-0" with 10 health registered at position 3,3
    And an entity "blocker" with 10 health registered at position 4,4
    And a game context with the grid and actor "hero-0"
    And an action with a move effect to position 4,4
    When I call applyEffects with empty params
    Then the effect result is not successful

  # Step 3.4: applyEffects() - effect chaining tests

  Scenario: Parameter references are resolved from params Map
    Given a battle grid of size 9x9
    And an entity "hero-0" with 10 health registered at position 3,3
    And a game context with the grid and actor "hero-0"
    And an action with a move effect using parameter reference "$target"
    When I call applyEffects with params:
      | key    | value |
      | target | 5,5   |
    Then the effect result is successful
    And entity "hero-0" is at position 5,5

  Scenario: Effect chain references are resolved from previous results
    Given a battle grid of size 9x9
    And an entity "hero-0" with 10 health registered at position 3,3
    And a game context with the grid and actor "hero-0"
    And an action with two move effects where second uses "$move1.destination"
    When I call applyEffects with empty params
    Then the effect result is successful
    And entity "hero-0" is at position 5,5

  # Step 3.5: applyEffects() - early termination tests

  Scenario: Effect chain stops on first failure
    Given a battle grid of size 9x9
    And an entity "hero-0" with 10 health registered at position 3,3
    And an entity "blocker" with 10 health registered at position 4,4
    And a game context with the grid and actor "hero-0"
    And an action with two effects where first fails
    When I call applyEffects with empty params
    Then the effect result is not successful
    And entity "hero-0" is at position 3,3

  Scenario: All effects execute when all succeed
    Given a battle grid of size 9x9
    And an entity "hero-0" with 10 health registered at position 3,3
    And a game context with the grid and actor "hero-0"
    And an action with two successful move effects to 4,4 then 5,5
    When I call applyEffects with empty params
    Then the effect result is successful
    And entity "hero-0" is at position 5,5
    And the effect result contains 2 move events
