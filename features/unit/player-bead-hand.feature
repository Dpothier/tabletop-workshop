Feature: Player Bead Hand
  As a game system
  I need to manage player bead bags and hands
  So that players can draw and spend beads for actions

  # FR-3.1: PlayerBeadHand class with bag and hand management
  Scenario: Initialize with default bead counts
    Given a player bead hand with default beads
    Then the bag should have 12 total beads
    And the hand should have 0 beads
    And the bag should have 3 red, 3 blue, 3 green, 3 white beads

  Scenario: Initialize with custom bead counts
    Given a player bead hand with 2 red, 4 blue, 1 green, 3 white beads
    Then the bag should have 10 total beads
    And the hand should have 0 beads

  Scenario: Cannot create hand with zero total beads
    When I try to create a player bead hand with 0 red, 0 blue, 0 green, 0 white beads
    Then a player bead hand error should be thrown with message "Cannot create empty bead pool"

  # FR-3.2: Draw N beads from bag to hand
  Scenario: Draw beads to hand
    Given a player bead hand with default beads
    When I draw 3 beads to hand
    Then the hand should have 3 beads
    And the bag should have 9 total beads

  Scenario: Draw single bead to hand
    Given a player bead hand with default beads
    When I draw 1 bead to hand
    Then the hand should have 1 bead
    And the bag should have 11 total beads

  Scenario: Draw returns the colors drawn
    Given a player bead hand with 3 red, 0 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0, 0"
    When I draw 3 beads to hand
    Then all drawn beads should be "red"

  Scenario: Draw specific colors with deterministic random
    Given a player bead hand with 1 red, 1 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0.6"
    When I draw 2 beads to hand
    Then the drawn beads should include "red" and "blue"

  # FR-3.3: Spend specific colored bead from hand
  Scenario: Spend bead from hand successfully
    Given a player bead hand with 3 red, 0 blue, 0 green, 0 white beads
    And hand random function returns 0
    When I draw 1 bead to hand
    And I spend a "red" bead
    Then the spend should succeed
    And the hand should have 0 beads
    And player discarded red should be 1

  Scenario: Spend bead fails when not in hand
    Given a player bead hand with 3 red, 0 blue, 0 green, 0 white beads
    And hand random function returns 0
    When I draw 1 bead to hand
    And I spend a "blue" bead
    Then the spend should fail
    And the hand should have 1 bead

  Scenario: Spend multiple beads from hand
    Given a player bead hand with 3 red, 3 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0.6, 0, 0.6"
    When I draw 4 beads to hand
    And I spend a "red" bead
    And I spend a "blue" bead
    Then the hand should have 2 beads
    And player discarded red should be 1
    And player discarded blue should be 1

  # FR-3.4: Check if player can afford bead cost
  Scenario: Can afford single bead cost
    Given a player bead hand with 3 red, 3 blue, 0 green, 0 white beads
    And hand random function returns 0
    When I draw 2 beads to hand
    Then I should be able to afford 1 red bead
    And I should be able to afford 2 red beads
    And I should not be able to afford 3 red beads

  Scenario: Can afford multi-color cost
    Given a player bead hand with 2 red, 2 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0.6, 0, 0.6"
    When I draw 4 beads to hand
    Then I should be able to afford 1 red and 1 blue beads
    And I should be able to afford 2 red and 2 blue beads
    And I should not be able to afford 3 red beads

  Scenario: Can afford zero cost
    Given a player bead hand with default beads
    Then I should be able to afford 0 beads

  # FR-3.5: Reshuffle when bag is empty
  Scenario: Auto-reshuffle when bag is empty during draw
    Given a player bead hand with 2 red, 0 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0"
    When I draw 2 beads to hand
    And I spend a "red" bead
    And I spend a "red" bead
    And I draw 1 bead to hand
    Then the player bag should have reshuffled
    And the hand should have 1 bead

  Scenario: Reshuffle moves discards back to bag
    Given a player bead hand with 1 red, 1 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0.6, 0"
    When I draw 2 beads to hand
    And I spend a "red" bead
    And I spend a "blue" bead
    And I draw 1 bead to hand
    Then bag red should be 0
    And bag blue should be 1
    And player discarded red should be 0
    And player discarded blue should be 0
    And the hand should have 1 bead

  # Get counts
  Scenario: Get hand counts by color
    Given a player bead hand with 2 red, 2 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0.6"
    When I draw 2 beads to hand
    Then hand red should be 1
    And hand blue should be 1

  Scenario: Get bag counts by color
    Given a player bead hand with 3 red, 2 blue, 1 green, 0 white beads
    And hand random function returns sequence "0, 0"
    When I draw 2 beads to hand
    Then bag red should be 1
    And bag blue should be 2
    And bag green should be 1

  # Edge cases
  Scenario: Draw more beads than available triggers reshuffle mid-draw
    Given a player bead hand with 3 red, 0 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0, 0"
    When I draw 2 beads to hand
    And I spend a "red" bead
    And I spend a "red" bead
    And I draw 2 beads to hand
    Then the player bag should have reshuffled
    And the hand should have 2 beads

  Scenario: Bag is empty after drawing all beads
    Given a player bead hand with 2 red, 0 blue, 0 green, 0 white beads
    And hand random function returns sequence "0, 0"
    When I draw 2 beads to hand
    Then the player bag should be empty
