Feature: Async ActionResolution execution
  As a game developer
  I need ActionResolution to execute actions asynchronously with a BattleAdapter
  So that I can animate effects and handle failures properly

  Background:
    Given a mock BattleAdapter
    And a battle grid of size 9x9
    And a game context with the grid
    And an entity "actor" with 10 health registered at position 5,5

  Scenario: Action with no parameters executes immediately
    Given an action with no parameters
    And the action has effects that return animation events
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then adapter.animate is called with the events
    And result.cancelled is false
    And result.success is true
    And result.events contains the animation events

  Scenario: Action with no parameters and no events skips animation
    Given an action with no parameters
    And the action has effects that return no events
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then adapter.animate is not called
    And result.cancelled is false
    And result.success is true

  Scenario: Failed effect returns unsuccessful result
    Given an action with no parameters
    And the action has an effect that fails with reason "Target blocked"
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then adapter.animate is not called
    And result.cancelled is false
    And result.success is false
    And result.reason is "Target blocked"

  Scenario: Tile parameter prompts via adapter
    Given an action with a tile parameter with range 3
    And adapter.promptTile will return position 2,1
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then adapter.promptTile is called with range 3
    And the effect receives target parameter as position 2,1
    And result.success is true

  Scenario: Multiple tile parameters prompt in order
    Given an action with tile parameters "start" with range 2 and "end" with range 4
    And adapter.promptTile will return position 0,0 then position 3,3
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then adapter.promptTile is called twice
    And the effect receives "start" parameter as position 0,0
    And the effect receives "end" parameter as position 3,3

  Scenario: Option parameter prompts via adapter
    Given an action with an option parameter
    And adapter.promptOptions will return "power"
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then adapter.promptOptions is called with the prompt
    And the effect receives "modifiers" parameter including "power"
    And result.success is true

  Scenario: Multiple option selections passed to effect
    Given an action with a multi-select option parameter
    And adapter.promptOptions will return "power" and "speed"
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then the effect receives "modifiers" parameter including "power" and "speed"
    And result.success is true

  Scenario: User cancels during tile parameter
    Given an action with a tile parameter with range 3
    And adapter.promptTile will return null
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then result.cancelled is true
    And result.success is false
    And adapter.animate is not called

  Scenario: User cancels during option parameter
    Given an action with an option parameter
    And adapter.promptOptions will return null
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then result.cancelled is true
    And result.success is false
    And adapter.animate is not called

  Scenario: Cancellation after first parameter stops collection
    Given an action with tile parameters "start" with range 2 and "end" with range 4
    And adapter.promptTile will return position 1,1 then null
    And an ActionResolution with the action and adapter
    When I call resolution.execute()
    Then result.cancelled is true
    And adapter.promptTile is called twice
