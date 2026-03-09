Feature: Strength modifier on Attack action
  As a player with a melee weapon
  I want to use the Strength modifier on the Attack action
  So that I can deal +1 Power on this attack

  Scenario: Strength adds +1 Power to a melee attack
    When I load the attack action definition from YAML
    Then the attack strength option should have modifier damage 1

  Scenario: Strength costs 1 Red bead
    When I load the attack action definition from YAML
    Then the attack strength option should have cost red 1

  Scenario: Strength can be paid with 1 Windup stack
    When I load the attack action definition from YAML
    Then the attack strength option should have alternativeCost windup 1

  Scenario: With 2 different sources, Strength can be used twice for +2 Power
    Given a strength modifier configured on effect "attack-1" with melee weapon condition
    And a main-hand weapon "Long Sword" that grants modifier "strength" with tags "melee"
    And an accessory "Magic Shield" that grants modifier "strength" with tags "melee"
    When I resolve sourced options with condition filtering
    Then I should get 2 sourced strength instances
    And strength instance 1 should be sourced from "Long Sword"
    And strength instance 2 should be sourced from "Magic Shield"

  Scenario: With 1 source, Strength can only be used once
    Given a strength modifier configured on effect "attack-1" with melee weapon condition
    And a main-hand weapon "Long Sword" that grants modifier "strength" with tags "melee"
    When I resolve sourced options with condition filtering
    Then I should get 1 sourced strength instance

  Scenario: Strength is not available for ranged weapons
    Given a strength modifier configured on effect "attack-1" with melee weapon condition
    And a main-hand weapon "Longbow" that grants modifier "strength" with tags "ranged"
    When I resolve sourced options with condition filtering
    Then I should get 0 sourced strength instances
