Feature: Bead Bag
  As a game system
  I need to manage monster bead bags for AI decisions
  So that monsters select attacks via bead draws

  # FR-2.1: BeadBag class to manage draw/discard/reshuffle
  Scenario: Initialize bead bag with counts
    Given a bead bag with 3 red, 2 blue, 2 green, 1 white beads
    Then the bag should have 8 total beads remaining
    And the bag should have 0 discarded beads

  Scenario: Draw a bead from bag
    Given a bead bag with 3 red, 2 blue, 2 green, 1 white beads
    When I draw a bead
    Then the bag should have 7 total beads remaining
    And the bag should have 1 discarded bead

  Scenario: Draw specific bead with deterministic random (first color)
    Given a bead bag with 3 red, 2 blue, 0 green, 0 white beads
    And random function returns 0
    When I draw a bead
    Then the drawn bead should be "red"

  Scenario: Draw specific bead with deterministic random (second color)
    Given a bead bag with 1 red, 1 blue, 0 green, 0 white beads
    And random function returns 0.6
    When I draw a bead
    Then the drawn bead should be "blue"

  Scenario: Draw all reds then get blue
    Given a bead bag with 2 red, 1 blue, 0 green, 0 white beads
    And random function returns sequence "0, 0, 0"
    When I draw 3 beads
    Then the last drawn bead should be "blue"

  # FR-2.2: Track remaining beads in bag
  Scenario: Get remaining bead counts
    Given a bead bag with 3 red, 2 blue, 2 green, 1 white beads
    When I draw 2 beads
    Then the remaining counts should sum to 6

  Scenario: Get individual remaining counts
    Given a bead bag with 3 red, 2 blue, 2 green, 1 white beads
    And random function returns sequence "0, 0, 0"
    When I draw 3 beads
    Then remaining red should be 0
    And remaining blue should be 2

  # FR-2.3: Track discarded beads
  Scenario: Track discarded beads
    Given a bead bag with 3 red, 2 blue, 2 green, 1 white beads
    And random function returns sequence "0, 0, 0"
    When I draw 3 beads
    Then discarded red should be 3

  Scenario: Discarded beads visible after draws
    Given a bead bag with 2 red, 1 blue, 0 green, 0 white beads
    And random function returns sequence "0, 0.8, 0"
    When I draw 3 beads
    Then discarded red should be 2
    And discarded blue should be 1

  # Reshuffle when empty
  Scenario: Automatic reshuffle when bag is empty
    Given a bead bag with 1 red, 0 blue, 0 green, 0 white beads
    And random function returns sequence "0, 0"
    When I draw 2 beads
    Then the bag should have reshuffled
    And the bag should have 0 total beads remaining

  Scenario: Reshuffle clears discards before new draw
    Given a bead bag with 1 red, 0 blue, 0 green, 0 white beads
    And random function returns sequence "0, 0"
    When I draw 2 beads
    Then discarded red should be 1

  Scenario: Cannot create bag with zero total beads
    When I try to create a bead bag with 0 red, 0 blue, 0 green, 0 white beads
    Then a bead bag error should be thrown with message "Cannot create empty bead bag"

  # isEmpty check
  Scenario: Bag is not empty when beads remain
    Given a bead bag with 3 red, 2 blue, 2 green, 1 white beads
    Then the bag should not be empty

  Scenario: Bag isEmpty reflects state after draw
    Given a bead bag with 1 red, 0 blue, 0 green, 0 white beads
    When I draw a bead
    Then the bag should be empty
