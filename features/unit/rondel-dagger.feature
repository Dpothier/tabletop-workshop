Feature: Rondel Dagger - Light Melee weapon with Percer and Parade
  As a fighter with a Rondel Dagger
  I need to pierce through armor and parry attacks effectively
  So that I can control the battlefield with precision and defense

  Background:
    Given a rondel-dagger test grid of 12x12
    And a rondel-dagger test game context with the grid

  # Equipment Properties - Load from YAML
  Scenario: Rondel Dagger has power 1
    When I check the rondel-dagger test equipment from YAML
    Then the rondel-dagger test equipment power should be 1

  Scenario: Rondel Dagger has agility 1
    When I check the rondel-dagger test equipment from YAML
    Then the rondel-dagger test equipment agility should be 1

  Scenario: Rondel Dagger is one-handed
    When I check the rondel-dagger test equipment from YAML
    Then the rondel-dagger test equipment twoHanded should be false

  Scenario: Rondel Dagger has Percer in granted modifiers
    When I check the rondel-dagger test equipment from YAML
    Then the rondel-dagger test equipment should have granted modifier "percer"

  Scenario: Rondel Dagger has Parade in granted modifiers
    When I check the rondel-dagger test equipment from YAML
    Then the rondel-dagger test equipment should have granted modifier "parade"

  # Percer via CombatResolver - Tests the actual combat system
  Scenario: Percer ignores Armor when Guard=0 and Evasion=0
    When the rondel-dagger test combat resolves with percer against guard 0, evasion 0, armor 3
    Then the rondel-dagger test combat outcome should be "hit"
    And the rondel-dagger test combat damage should be 1

  Scenario: Percer does NOT ignore Armor when Guard > 0
    When the rondel-dagger test combat resolves with percer against guard 2, evasion 0, armor 3
    Then the rondel-dagger test combat outcome should be "guarded"
    And the rondel-dagger test combat damage should be 0

  Scenario: Percer does NOT ignore Armor when Evasion > 0
    When the rondel-dagger test combat resolves with percer against guard 0, evasion 1, armor 3
    Then the rondel-dagger test combat outcome should be "dodged"
    And the rondel-dagger test combat damage should be 0

  Scenario: Percer with multiple defense layers - armor only
    When the rondel-dagger test combat resolves with percer against guard 0, evasion 0, armor 1
    Then the rondel-dagger test combat outcome should be "hit"
    And the rondel-dagger test combat damage should be 1

  # Percer YAML - Verify action properties
  Scenario: Percer costs 1 green bead
    When I check the rondel-dagger test percer action cost from YAML
    Then the rondel-dagger test percer cost should have 1 green bead

  Scenario: Percer condition requires light weapon tag
    When I check the rondel-dagger test percer action from YAML
    Then the rondel-dagger test percer condition should require weaponTag "light"

  # Parade via AttackResolvers - Tests defensive options building
  Scenario: Parade available when defender has parade modifier and red bead
    When the rondel-dagger test defensive options are built with 1 red bead and modifier "parade"
    Then the rondel-dagger test defensive options should include "parade-1"

  Scenario: Parade NOT available without parade modifier even with red bead
    When the rondel-dagger test defensive options are built with 1 red bead and no equipment modifiers
    Then the rondel-dagger test defensive options should not include "parade-1"

  Scenario: Parade NOT available with parade modifier but no red bead
    When the rondel-dagger test defensive options are built with 0 red beads and modifier "parade"
    Then the rondel-dagger test defensive options should not include "parade-1"

  # Parade YAML - Verify action properties
  Scenario: Parade costs 1 red bead
    When I check the rondel-dagger test parade action cost from YAML
    Then the rondel-dagger test parade cost should have 1 red bead

  Scenario: Parade grants +1 guard
    When I check the rondel-dagger test parade modifier from YAML
    Then the rondel-dagger test parade guard modifier should be 1
