Feature: Magical Combat Resolution
  As a game designer
  I need an Intensity vs Ward system for magical effects
  So that spells can be resisted by targets with sufficient magical defense

  # Base Intensity Mechanics

  Scenario: Base intensity 1 manifests against ward 0
    Given a magical effect with intensity 1
    And the magical target has ward 0
    And the magical target is an enemy
    When I resolve the magical effect
    Then the magical effect should manifest
    And the magical intensity should be 1
    And the magical ward should be 0

  Scenario: Higher intensity manifests against lower ward
    Given a magical effect with intensity 5
    And the magical target has ward 2
    And the magical target is an enemy
    When I resolve the magical effect
    Then the magical effect should manifest
    And the magical intensity should be 5
    And the magical ward should be 2

  Scenario: Intensity equal to ward does not manifest (strictly greater)
    Given a magical effect with intensity 3
    And the magical target has ward 3
    And the magical target is an enemy
    When I resolve the magical effect
    Then the magical effect should not manifest
    And the magical intensity should be 3
    And the magical ward should be 3

  Scenario: Intensity less than ward does not manifest
    Given a magical effect with intensity 2
    And the magical target has ward 4
    And the magical target is an enemy
    When I resolve the magical effect
    Then the magical effect should not manifest
    And the magical intensity should be 2
    And the magical ward should be 4

  # Bead Enhancement Mechanics

  Scenario: Extra beads increase intensity
    Given a magical effect with intensity 1
    And 2 extra beads of the spell color
    And the magical target has ward 0
    And the magical target is an enemy
    When I resolve the magical effect
    Then the magical effect should manifest
    And the magical intensity should be 3
    And the magical ward should be 0

  Scenario: High ward blocks even boosted intensity
    Given a magical effect with intensity 1
    And 3 extra beads of the spell color
    And the magical target has ward 10
    And the magical target is an enemy
    When I resolve the magical effect
    Then the magical effect should not manifest
    And the magical intensity should be 4
    And the magical ward should be 10

  # Ally Target Mechanics

  Scenario: Ally target accepts - effect manifests regardless of ward
    Given a magical effect with intensity 2
    And the magical target has ward 5
    And the magical target is an ally who accepts
    When I resolve the magical effect
    Then the magical effect should manifest
    And the magical intensity should be 2
    And the magical ward should be 5

  Scenario: Ally target resists - effect does not manifest
    Given a magical effect with intensity 2
    And the magical target has ward 0
    And the magical target is an ally who resists
    When I resolve the magical effect
    Then the magical effect should not manifest
    And the magical intensity should be 2
    And the magical ward should be 0

  Scenario: Ally with high ward accepts - still manifests (ward bypassed)
    Given a magical effect with intensity 1
    And the magical target has ward 10
    And the magical target is an ally who accepts
    When I resolve the magical effect
    Then the magical effect should manifest
    And the magical intensity should be 1
    And the magical ward should be 10

  Scenario: Zero intensity against zero ward does not manifest
    Given a magical effect with intensity 0
    And the magical target has ward 0
    And the magical target is an enemy
    When I resolve the magical effect
    Then the magical effect should not manifest
    And the magical intensity should be 0
    And the magical ward should be 0
