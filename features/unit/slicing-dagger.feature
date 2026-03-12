Feature: Slicing Dagger - Light Melee weapon with Lacerate and Slash
  As a fighter with a Slicing Dagger
  I need to apply Bleed status effects with Lacerate and gain agility with Slash
  So that I can control the battlefield with precision cutting attacks

  Background:
    Given a slicing-dagger test grid of 12x12
    And a slicing-dagger test game context with the grid

  # Slicing Dagger Equipment
  Scenario: Slicing Dagger has power 1
    When I check the slicing-dagger test equipment from YAML
    Then the slicing-dagger test equipment power should be 1

  Scenario: Slicing Dagger has agility 1
    When I check the slicing-dagger test equipment from YAML
    Then the slicing-dagger test equipment agility should be 1

  Scenario: Slicing Dagger is one-handed
    When I check the slicing-dagger test equipment from YAML
    Then the slicing-dagger test equipment twoHanded should be false

  # Lacerate Modifier
  Scenario: Slicing Dagger has Lacerate in granted modifiers
    When I check the slicing-dagger test equipment from YAML
    Then the slicing-dagger test equipment should have granted modifier "lacerate"

  Scenario: Slash modifier adds +1 agility
    When I check the slicing-dagger test slash modifier from YAML
    Then the slicing-dagger test slash agility modifier should be 1

  Scenario: Slash costs 1 red bead
    When I check the slicing-dagger test slash action cost from YAML
    Then the slicing-dagger test slash cost should have 1 red bead

  # Lacerate Action
  Scenario: Lacerate costs 1 green bead
    When I check the slicing-dagger test lacerate action cost from YAML
    Then the slicing-dagger test lacerate cost should have 1 green bead

  # Lacerate Effect
  Scenario: Lacerate applies Bleed on hit
    Given a slicing-dagger test bearer at position 5,5
    And a slicing-dagger test target "victim" at position 5,6
    When the slicing-dagger test lacerate effect is triggered for "victim" with hit outcome "hit"
    Then the slicing-dagger test bleed should be applied
    And the slicing-dagger test target should have 1 bleed stack

  Scenario: Lacerate does not apply Bleed on miss
    Given a slicing-dagger test bearer at position 5,5
    And a slicing-dagger test target "victim" at position 5,6
    When the slicing-dagger test lacerate effect is triggered for "victim" with hit outcome "miss"
    Then the slicing-dagger test bleed should not be applied
    And the slicing-dagger test target should have 0 bleed stacks

  Scenario: Lacerate does not apply Bleed on guard
    Given a slicing-dagger test bearer at position 5,5
    And a slicing-dagger test target "victim" at position 5,6
    When the slicing-dagger test lacerate effect is triggered for "victim" with hit outcome "guarded"
    Then the slicing-dagger test bleed should not be applied
    And the slicing-dagger test target should have 0 bleed stacks

  # Bleed Status Effect
  Scenario: Bleed deals 1 damage per stack at end of round
    Given a slicing-dagger test grid of 12x12
    And a slicing-dagger test game context with the grid
    And a slicing-dagger test entity "target" at position 5,5 with 10 health
    When entity "target" has 1 bleed stack applied
    And end of round is resolved for slicing-dagger test
    Then the slicing-dagger test end-of-round results should show 1 damage to "target"

  Scenario: Bleed is stackable - 2 stacks deal 2 damage at end of round
    Given a slicing-dagger test grid of 12x12
    And a slicing-dagger test game context with the grid
    And a slicing-dagger test entity "target" at position 5,5 with 10 health
    When entity "target" has 2 bleed stacks applied
    And end of round is resolved for slicing-dagger test
    Then the slicing-dagger test end-of-round results should show 2 damage to "target"

  # Slash Modifier
  Scenario: Slicing Dagger has Slash in granted modifiers
    When I check the slicing-dagger test equipment from YAML
    Then the slicing-dagger test equipment should have granted modifier "slash"
