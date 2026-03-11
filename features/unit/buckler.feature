Feature: Buckler - Small shield with Block and Riposte reactions
  As a defensive character with a Buckler
  I need to block attacks and counter-attack with Riposte
  So that I can defend myself and punish attackers

  Background:
    Given a buckler test grid of 12x12
    And a buckler test game context with the grid

  # Buckler Equipment
  Scenario: Buckler has passiveGuard 0
    When I check the buckler test equipment from YAML
    Then the buckler test equipment passiveGuard should be 0

  Scenario: Buckler has Block in granted modifiers
    When I check the buckler test equipment from YAML
    Then the buckler test equipment should have modifier "block"

  Scenario: Buckler has Riposte in granted modifiers
    When I check the buckler test equipment from YAML
    Then the buckler test equipment should have modifier "riposte"

  Scenario: Buckler is off-hand shield item
    When I check the buckler test equipment from YAML
    Then the buckler test equipment slot should be "off-hand"
    And the buckler test equipment category should be "shield"

  Scenario: Buckler has 1 inventory slot
    When I check the buckler test equipment from YAML
    Then the buckler test equipment inventorySlots should be 1

  # Riposte - Counter-attack after Block
  Scenario: Riposte inflicts 1 direct damage to attacker
    Given a buckler test bearer at position 5,5 with bead hand having 0 green
    And a buckler test attacker "enemy" at position 5,6 with 30 health
    When the buckler test riposte is triggered for "enemy" with guard outcome "guarded"
    Then the buckler test riposte result should be successful
    And the buckler test attacker "enemy" should have 29 health

  Scenario: Riposte costs 1 green bead
    When I check the buckler test riposte action cost from YAML
    Then the buckler test riposte cost should have 1 green bead

  Scenario: Riposte only available after successful Block - when guardOutcome is guarded
    Given a buckler test bearer at position 5,5 with bead hand having 1 green
    And a buckler test attacker "enemy" at position 5,6 with 30 health
    When the buckler test riposte is triggered for "enemy" with guard outcome "guarded"
    Then the buckler test riposte result should be successful

  Scenario: Riposte not available if attack was hit (not guarded)
    Given a buckler test bearer at position 5,5 with bead hand having 1 green
    And a buckler test attacker "enemy" at position 5,6 with 30 health
    When the buckler test riposte is triggered for "enemy" with guard outcome "hit"
    Then the buckler test riposte result should have failed

  Scenario: Riposte not available if attack was dodged (not guarded)
    Given a buckler test bearer at position 5,5 with bead hand having 1 green
    And a buckler test attacker "enemy" at position 5,6 with 30 health
    When the buckler test riposte is triggered for "enemy" with guard outcome "dodged"
    Then the buckler test riposte result should have failed
