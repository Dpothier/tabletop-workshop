Feature: Pistol - Ranged firearm weapon
  As a character with a Pistol
  I want to manage ammunition loading and fire a light ranged weapon
  So that I can use a practical one-handed ranged weapon effectively

  Background:
    Given a pistol test grid of 12x12
    And a pistol test game context with the grid

  # Equipment Definition
  Scenario: Pistol has penetration 1
    When I check the pistol test equipment from YAML
    Then the pistol test equipment penetration should be 1

  Scenario: Pistol starts loaded
    When I check the pistol test equipment from YAML
    Then the pistol test equipment startsLoaded should be true

  Scenario: Pistol has 1 inventory slot
    When I check the pistol test equipment from YAML
    Then the pistol test equipment inventorySlots should be 1

  Scenario: Pistol is one-handed
    When I check the pistol test equipment from YAML
    Then the pistol test equipment twoHanded should be false

  # Reload Action
  Scenario: Reload costs 2w (time cost 2)
    When I check the pistol test reload action cost from YAML
    Then the pistol test reload cost should have time 2

  Scenario: Reload sets weapon loaded
    Given a pistol test entity at position 5,5
    When the pistol test load effect is executed
    Then the pistol test entity should have loaded stacks 1

  # Loaded State Management
  Scenario: After shot, pistol is unloaded (loaded stacks go to 0)
    Given a pistol test entity at position 5,5
    When the pistol test load effect is executed
    And the pistol test shot removes loaded stack
    Then the pistol test entity should have loaded stacks 0

  Scenario: Shoot fails if unloaded (loaded stacks = 0)
    Given a pistol test entity at position 5,5
    When the pistol test entity is checked with loaded stacks 0
    Then the pistol test entity cannot shoot due to unloaded state

  # Range Bands
  Scenario: Range band short (1-4) applies +1 modifier
    When I check the pistol test range bands from YAML
    Then the pistol test range band short should apply modifier 1

  Scenario: Range band medium (5-8) applies +0 modifier
    When I check the pistol test range bands from YAML
    Then the pistol test range band medium should apply modifier 0

  Scenario: Range band long (9-12) applies -2 modifier
    When I check the pistol test range bands from YAML
    Then the pistol test range band long should apply modifier -2
