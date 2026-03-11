Feature: Censer - Support item with Bless and Renew
  As a support character with a Censer
  I need to grant gold beads to allies and boost their rest recovery
  So that I can enhance team resource management

  Background:
    Given a censer test grid of 12x12
    And a censer test game context with the grid

  # Bless - Gold Bead Creation
  Scenario: Bless creates 1 gold bead in the targeted ally's hand
    Given a censer test caster at position 5,5
    And a censer test ally "healer" at position 5,6 with bead hand
    When the censer test bless effect is executed targeting "healer"
    Then the censer test ally "healer" should have 1 gold bead

  # Bless - Cost
  Scenario: Bless costs 1 windup + 1 white bead
    When I check the censer test bless action cost from YAML
    Then the censer test bless cost should have 1 windup
    And the censer test bless cost should have 1 white bead

  # Bless - Range
  Scenario: Bless has range 1-6
    Given a censer test caster at position 1,1
    And a censer test ally "far-ally" at position 5,5 with bead hand
    When the censer test bless effect is executed targeting "far-ally"
    Then the censer test ally "far-ally" should have 1 gold bead

  # Bless - Range Limit
  Scenario: Bless fails if target is out of range
    Given a censer test caster at position 1,1
    And a censer test ally "far-ally" at position 9,9 with bead hand
    When the censer test bless effect is executed targeting "far-ally"
    Then the censer test result should have failed

  # Gold Bead - Spend as Red
  Scenario: A gold bead can be spent as 1 red bead
    Given a censer test bead hand with 0 red and 1 gold
    When the censer test player spends gold
    Then the censer test bead hand should have 0 gold beads
    And the censer test spend result should be successful

  # Gold Bead - Spend as Blue
  Scenario: A gold bead can be spent as 1 blue bead
    Given a censer test bead hand with 0 blue and 1 gold
    When the censer test player spends gold
    Then the censer test bead hand should have 0 gold beads
    And the censer test spend result should be successful

  # Gold Bead - canAfford with Gold
  Scenario: canAfford returns true if gold can cover a missing color
    Given a censer test bead hand with 0 red and 1 gold
    When the censer test player checks afford for 1 red bead
    Then the censer test afford result should be true

  # Gold Bead - canAfford multiple missing colors
  Scenario: canAfford returns false if gold cannot cover multiple missing colors
    Given a censer test bead hand with 0 red 0 blue and 1 gold
    When the censer test player checks afford for 1 red and 1 blue
    Then the censer test afford result should be false

  # Renew - Extra Draw
  Scenario: Renew makes the ally draw 1 extra bead during Rest
    Given a censer test caster at position 5,5
    And a censer test ally "rester" at position 5,6 with bead hand containing 3 red 3 blue 3 green 3 white in bag
    When the censer test renew effect is executed targeting "rester"
    Then the censer test ally "rester" should have drawn 1 bead

  # Renew - Cost
  Scenario: Renew costs 1 white bead
    When I check the censer test renew action cost from YAML
    Then the censer test renew cost should have 1 white bead

  # Renew - Range
  Scenario: Renew has range 1-6
    Given a censer test caster at position 1,1
    And a censer test ally "far-rester" at position 5,5 with bead hand containing 3 red 3 blue 3 green 3 white in bag
    When the censer test renew effect is executed targeting "far-rester"
    Then the censer test ally "far-rester" should have drawn 1 bead

  # Renew - Range Limit
  Scenario: Renew fails if target is out of range
    Given a censer test caster at position 1,1
    And a censer test ally "far-rester" at position 9,9 with bead hand containing 3 red 3 blue 3 green 3 white in bag
    When the censer test renew effect is executed targeting "far-rester"
    Then the censer test result should have failed
