Feature: Banner - Support item with Rally and Inspire reactions
  As a support character with a Banner
  I need to protect ally preparation stacks with Rally and grant Guard with Inspire
  So that I can provide defensive support at range

  Background:
    Given a banner test grid of 12x12
    And a banner test game context with the grid

  # Rally - Prevents Preparation Interruption
  Scenario: Rally prevents interruption of ally's preparation stacks
    Given a banner test bearer at position 5,5 with bead hand having 3 white
    And a banner test ally "fighter" at position 5,6 with 2 windup stacks
    When the banner test rally is triggered for "fighter"
    Then the banner test rally result should be successful
    And the banner test ally "fighter" should still have 2 windup stacks

  Scenario: Rally costs 1 white bead
    When I check the banner test rally action cost from YAML
    Then the banner test rally cost should have 1 white bead

  Scenario: Rally has range 1-6
    Given a banner test bearer at position 1,1 with bead hand having 3 white
    And a banner test ally "far-ally" at position 5,5 with 2 windup stacks
    When the banner test rally is triggered for "far-ally"
    Then the banner test rally result should be successful

  Scenario: Rally does not trigger if ally is out of range
    Given a banner test bearer at position 1,1 with bead hand having 3 white
    And a banner test ally "distant" at position 9,9 with 2 windup stacks
    When the banner test rally is triggered for "distant"
    Then the banner test rally result should have failed

  # Inspire - Grants Guard
  Scenario: Inspire grants +1 Guard to an attacked ally in range
    Given a banner test bearer at position 5,5 with bead hand having 3 white
    And a banner test ally "fighter" at position 5,6 with 0 guard
    When the banner test inspire is triggered for "fighter"
    Then the banner test inspire result should be successful
    And the banner test ally "fighter" should have 1 guard

  Scenario: Inspire costs 1 white bead
    When I check the banner test inspire action cost from YAML
    Then the banner test inspire cost should have 1 white bead

  Scenario: Inspire has range 1-6
    Given a banner test bearer at position 1,1 with bead hand having 3 white
    And a banner test ally "far-ally" at position 5,5 with 0 guard
    When the banner test inspire is triggered for "far-ally"
    Then the banner test inspire result should be successful

  # Banner - Equipment Properties
  Scenario: Banner is an off-hand support item
    When I check the banner test equipment from YAML
    Then the banner test equipment slot should be "off-hand"
    And the banner test equipment category should be "support"
