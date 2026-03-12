Feature: Hatchet - Light Melee weapon with Chop and Throw
  As a fighter with a Hatchet
  I need to perform Chop strikes and throw the hatchet
  So that I can control the battlefield with flexible attack options

  Background:
    Given a hatchet test grid of 12x12
    And a hatchet test game context with the grid

  # Hatchet Equipment
  Scenario: Hatchet has power 1
    When I check the hatchet test equipment from YAML
    Then the hatchet test equipment power should be 1

  Scenario: Hatchet has agility 1
    When I check the hatchet test equipment from YAML
    Then the hatchet test equipment agility should be 1

  Scenario: Hatchet is one-handed
    When I check the hatchet test equipment from YAML
    Then the hatchet test equipment twoHanded should be false

  Scenario: Hatchet has throwable tag
    When I check the hatchet test equipment from YAML
    Then the hatchet test equipment should have tag "throwable"

  # Chop Modifier
  Scenario: Chop adds +1 damage modifier
    When I check the hatchet test chop modifier from YAML
    Then the hatchet test chop damage modifier should be 1

  Scenario: Chop reduces agility by 1
    When I check the hatchet test chop modifier from YAML
    Then the hatchet test chop agility modifier should be -1

  Scenario: Agility cannot go below 0 with Chop
    Given a hatchet test bearer at position 5,5 with agility 0
    When I check the hatchet test chop modifier from YAML
    And I apply the hatchet test chop agility modifier
    Then the hatchet test effective agility should be 0

  Scenario: Chop costs 1 red bead
    When I check the hatchet test chop action cost from YAML
    Then the hatchet test chop cost should have 1 red bead

  # Throw Hatchet Action
  Scenario: Throw hatchet costs 2 time and 1 green bead
    When I check the hatchet test throw hatchet action cost from YAML
    Then the hatchet test throw hatchet cost should have 2 time beads
    And the hatchet test throw hatchet cost should have 1 green bead

  Scenario: Throw hatchet has range 6
    When I check the hatchet test throw hatchet action from YAML
    Then the hatchet test throw hatchet range should be 6

  # Throw Effect
  Scenario: Throw effect executes successfully
    Given a hatchet test bearer at position 5,5
    And a hatchet test target "victim" at position 5,6
    When the hatchet test throw effect is triggered for "victim" with power 1 and agility 1
    Then the hatchet test throw effect result should be successful
    And the hatchet test throw effect should have weapon drop position at 5,6
