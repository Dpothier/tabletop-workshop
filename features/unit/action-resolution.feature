Feature: Action Resolution System
  As a game developer
  I need to resolve actions by collecting parameters, applying modifiers, and executing effects
  So that actions can be fully data-driven from YAML definitions

  Background:
    Given a battle grid of size 9x9
    And a game context with the grid
    And an effect registry

  # parametrize generator tests

  Scenario: Generator yields prompts in order from action definition
    Given an action definition with parameters:
      | key         | type   | required |
      | target      | tile   | true     |
      | enhancement | option | false    |
    When I create an ActionResolution for the action
    And I iterate through parametrize
    Then I should receive 2 prompts
    And prompt 1 should be for parameter "target" with type "tile"
    And prompt 2 should be for parameter "enhancement" with type "option"

  Scenario: Generator yields no prompts for action with empty parameters
    Given an action definition with parameters: <empty>
    When I create an ActionResolution for the action
    And I iterate through parametrize
    Then I should receive 0 prompts

  Scenario: Yields correct prompt type for tile parameter
    Given an action definition with a tile parameter "destination" and prompt "Select target tile"
    When I create an ActionResolution for the action
    And I iterate through parametrize
    Then the first prompt should have type "tile"
    And the first prompt should have key "destination"
    And the first prompt should have text "Select target tile"

  Scenario: Yields correct prompt type for entity parameter
    Given an action definition with an entity parameter "victim" and prompt "Select target"
    When I create an ActionResolution for the action
    And I iterate through parametrize
    Then the first prompt should have type "entity"
    And the first prompt should have key "victim"

  Scenario: Yields correct prompt type for option parameter
    Given an action definition with an option parameter "enhancements" with 2 options
    When I create an ActionResolution for the action
    And I iterate through parametrize
    Then the first prompt should have type "option"
    And the first prompt should have key "enhancements"

  # provideValue() tests

  Scenario: Accepts valid tile parameter
    Given an action definition with a tile parameter "target"
    And an ActionResolution for the action
    When I provide value for "target" with position 4,4
    Then the value should be accepted
    And the reason should be empty

  Scenario: Accepts valid entity parameter
    Given an action definition with an entity parameter "victim"
    And an entity "goblin" with 5 health registered at position 4,3
    And an ActionResolution for the action
    When I provide value for "victim" with entity ID "goblin"
    Then the value should be accepted
    And the reason should be empty

  Scenario: Accepts valid option selections
    Given an action definition with an option parameter "enhancements" with options:
      | id     | label | cost  |
      | extra  | +1    | red:1 |
      | pierce | +2    | blue:1 |
    And an ActionResolution for the action
    When I provide value for "enhancements" with option IDs: "extra, pierce"
    Then the value should be accepted
    And the reason should be empty

  Scenario: Rejects value for unknown parameter key
    Given an action definition with a tile parameter "target"
    And an ActionResolution for the action
    When I provide value for "unknown_param" with position 5,5
    Then the value should be rejected
    And the reason should contain "unknown_param"

  Scenario: Can provide values in any order
    Given an action definition with parameters:
      | key   | type   |
      | p1    | tile   |
      | p2    | entity |
      | p3    | option |
    And an entity "enemy" with 10 health registered at position 5,5
    And an ActionResolution for the action
    When I provide value for "p3" with option IDs: "opt1"
    And I provide value for "p1" with position 3,3
    And I provide value for "p2" with entity ID "enemy"
    Then all values should be accepted
    And the value for "p1" should be position 3,3
    And the value for "p2" should be entity ID "enemy"

  # skip() tests

  Scenario: Accepts skip for optional parameter
    Given an action definition with an optional parameter "enhancement"
    And an ActionResolution for the action
    When I skip parameter "enhancement"
    Then the skip should be accepted
    And the reason should be empty

  Scenario: Rejects skip for required parameter
    Given an action definition with a required parameter "target"
    And an ActionResolution for the action
    When I skip parameter "target"
    Then the skip should be rejected
    And the reason should contain "required"

  # getTotalCost() tests

  Scenario: Returns base cost when no options selected
    Given an action definition with cost "{ time: 2, red: 1 }"
    And an ActionResolution for the action
    When I get the total cost
    Then the cost should have time: 2
    And the cost should have red: 1

  Scenario: Adds option costs to base cost
    Given an action definition with cost "{ time: 1 }" and option "option1" with cost "{ red: 1 }"
    And an ActionResolution for the action
    And I provide value for "options" with option IDs: "option1"
    When I get the total cost
    Then the cost should have time: 1
    And the cost should have red: 1

  Scenario: Returns correct total with multiple options selected
    Given an action definition with cost "{ time: 2, green: 1 }" and options:
      | id   | cost         |
      | opt1 | red: 1       |
      | opt2 | blue: 1      |
    And an ActionResolution for the action
    And I provide value for "options" with option IDs: "opt1, opt2"
    When I get the total cost
    Then the cost should have time: 2
    And the cost should have green: 1
    And the cost should have red: 1
    And the cost should have blue: 1

  # resolve() tests

  Scenario: Executes single effect successfully
    Given an action definition with effects:
      | id         | type | params                |
      | moveToGoal | move | destination: {4,4}    |
    And an entity "hero-0" with 10 health registered at position 3,3
    And an ActionResolution for the action
    When I resolve the action
    Then the action should succeed
    And the entity "hero-0" should be at position 4,4
    And the result should contain 1 animation event

  Scenario: Executes multiple effects in sequence
    Given an action definition with effects:
      | id        | type   | params              |
      | movement  | move   | destination: {4,4}  |
      | baseAttack| attack | targetEntity: goblin, damage: 2 |
    And an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 5,4
    And an ActionResolution for the action
    When I resolve the action
    Then the action should succeed
    And the entity "hero-0" should be at position 4,4
    And entity "goblin" should have 3 health
    And the result should contain 3 animation events

  Scenario: Applies modifiers from selected options to effects
    Given an action definition with effects:
      | id         | type   | params              |
      | attackGoal | attack | targetEntity: goblin, damage: 1 |
    And an action with option "extra_damage" that modifies effect "attackGoal" with "damage: +1"
    And an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 4,3
    And an ActionResolution for the action
    And I provide value for "options" with option IDs: "extra_damage"
    When I resolve the action
    Then the action should succeed
    And entity "goblin" should have 3 health

  Scenario: Passes chain results to subsequent effects
    Given an action definition with effects:
      | id         | type   | params              |
      | firstAttack| attack | targetEntity: goblin, damage: 2 |
      | secondAttack| attack | targetEntity: goblin, damage: 1 |
    And an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 10 health registered at position 4,3
    And an ActionResolution for the action
    When I resolve the action
    Then the action should succeed
    And entity "goblin" should have 7 health

  Scenario: Stops execution on effect failure
    Given an action definition with effects:
      | id        | type   | params              |
      | movement  | move   | destination: {5,5}  |
      | attack    | attack | targetEntity: goblin, damage: 2 |
    And an entity "hero-0" with 10 health registered at position 3,3
    And an entity "monster" with 20 health registered at position 5,5
    And an ActionResolution for the action
    When I resolve the action
    Then the action should fail
    And the entity "hero-0" should be at position 3,3
    And the result should contain only the failed move event

  Scenario: Returns all animation events from effects
    Given an action definition with effects:
      | id        | type | params             |
      | movement  | move | destination: {4,4} |
      | attack    | attack | targetEntity: goblin, damage: 1 |
    And an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 5 health registered at position 5,4
    And an ActionResolution for the action
    When I resolve the action
    Then the result should contain all animation events from all effects

  Scenario: Resolves $parameter references in effect params
    Given an action definition with a tile parameter "target"
    And an action definition with effects:
      | id     | type | params              |
      | moveIt | move | destination: $target |
    And an entity "hero-0" with 10 health registered at position 3,3
    And an ActionResolution for the action
    And I provide value for "target" with position 5,5
    When I resolve the action
    Then the action should succeed
    And the entity "hero-0" should be at position 5,5

  Scenario: Resolves $effectId.field chain references in effect params
    Given an action definition with effects:
      | id       | type   | params              |
      | scan     | attack | targetEntity: goblin, damage: 1 |
      | followup | attack | targetEntity: goblin, damage: 1 |
    And an entity "hero-0" with 10 health registered at position 3,3
    And an entity "goblin" with 10 health registered at position 4,3
    And an ActionResolution for the action
    When I resolve the action
    Then the action should succeed
    And entity "goblin" should have 8 health

  # Integration test

  Scenario: Full flow: parametrize → provide values → resolve
    Given an action definition with:
      | key       | type   | required |
      | target    | tile   | true     |
      | enhance   | option | false    |
    And effects:
      | id | type | params           |
      | m  | move | destination: $target |
    And an entity "hero-0" with 10 health registered at position 2,2
    And an ActionResolution for the action
    When I iterate through parametrize
    And I collect all prompts
    And I provide value for "target" with position 4,4
    And I skip parameter "enhance"
    And I resolve the action
    Then I should have collected 2 prompts
    And the action should succeed
    And the entity "hero-0" should be at position 4,4
