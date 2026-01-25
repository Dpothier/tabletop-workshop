Feature: Action Resolution Entity Parameter Execution
  As a game developer
  I need ActionResolution to handle entity parameters during execution
  So that players can select targets for attack actions

  Background:
    Given a battle grid of size 9x9
    And a game context with the grid
    And an effect registry
    And a mock BattleAdapter with entity prompt support

  Scenario: Execute prompts for entity parameter via adapter
    Given an action with entity parameter "target" with filter "enemy"
    And hero "hero-0" at position 3,3
    And monster "goblin" at position 4,3
    And adapter.promptEntity will return entity "goblin" when prompted
    When I execute the action resolution
    Then the adapter should have been prompted for entity selection
    And the prompt should have filter "enemy"

  Scenario: Execute uses selected entity in effect
    Given an action with entity parameter "target" with filter "enemy"
    And the action has effects:
      | id     | type   | params                      |
      | attack | attack | targetEntity: $target, damage: 2 |
    And hero "hero-0" with 10 health at position 3,3
    And monster "goblin" with 10 health at position 4,3
    And adapter.promptEntity will return entity "goblin" when prompted
    When I execute the action resolution
    Then result.success is true
    And entity "goblin" has 8 health remaining

  Scenario: Execute cancels when entity prompt returns null
    Given an action with entity parameter "target" with filter "enemy"
    And hero "hero-0" at position 3,3
    And monster "goblin" at position 4,3
    And adapter.promptEntity will return null when prompted for entity
    When I execute the action resolution
    Then result.cancelled is true
    And adapter.animate is not called

  Scenario: Entity prompt includes range constraint
    Given an action with entity parameter "target" with filter "enemy" and range 2
    And hero "hero-0" at position 3,3
    And monster "goblin" at position 4,3
    And adapter.promptEntity will return entity "goblin" when prompted
    When I execute the action resolution
    Then adapter.promptEntity is called with filter "enemy" and range 2

  Scenario: Entity prompt includes filter for ally
    Given an action with entity parameter "ally_target" with filter "ally"
    And hero "hero-0" at position 3,3
    And hero "hero-1" at position 4,3
    And adapter.promptEntity will return entity "hero-1" when prompted
    When I execute the action resolution
    Then the adapter should have been prompted for entity selection
    And the prompt should have filter "ally"

  Scenario: Entity parameter is passed to effect with correct entity reference
    Given an action with entity parameter "target" with filter "enemy"
    And hero "hero-0" at position 3,3
    And monster "goblin" at position 4,3
    And adapter.promptEntity will return entity "goblin" when prompted
    When I execute the action resolution
    Then result.cancelled is false
    And the adapter should have been prompted for entity selection

  Scenario: Multiple entity parameters are handled in sequence
    Given an action with two entity parameters:
      | key    | filter |
      | source | ally   |
      | target | enemy  |
    And hero "hero-0" at position 3,3
    And hero "hero-1" at position 4,3
    And monster "goblin" at position 5,3
    And adapter.promptEntity will return entity "hero-0" then entity "goblin" when prompted
    When I execute the action resolution
    Then adapter.promptEntity is called twice
    And result.cancelled is false

  Scenario: Entity selection with range constraint filters valid targets
    Given an action with entity parameter "target" with filter "enemy" and range 1
    And hero "hero-0" at position 3,3
    And monster "goblin" at position 4,3
    And monster "far-away" at position 8,8
    And adapter.promptEntity will return entity "goblin" when prompted
    When I execute the action resolution
    Then the prompt should have range 1
    And result.cancelled is false
