Feature: Player Defensive Reactions During Combat
  As a player
  I need to defend against monster attacks by spending beads
  So that I can reduce incoming damage by boosting my guard or evasion

  Background:
    Given an attacking monster "goblin" at position 4,3
    And a defending player "hero-0" at position 3,3
    And the player has beads in hand

  # Scenario 1: Player prompted for defense when attacked
  Scenario: Player prompted for defense when attacked
    Given the player has 1 red bead and 1 green bead in hand
    When the monster attacks the player
    Then the player should be prompted for defensive reactions
    And the prompt should offer red and green bead options

  # Scenario 2: Spending red bead increases guard by 1
  Scenario: Spending red bead increases guard by 1
    Given the player has 1 red bead in hand
    When the monster attacks with power 5, agility 2
    And the player spends 1 red bead for defense
    Then the player guard should be increased by 1 before attack resolves
    And the player should have 0 red beads in hand

  # Scenario 3: Spending green bead increases evasion by 1
  Scenario: Spending green bead increases evasion by 1
    Given the player has 1 green bead in hand
    When the monster attacks with power 5, agility 2
    And the player spends 1 green bead for defense
    Then the player evasion should be increased by 1 before attack resolves
    And the player should have 0 green beads in hand

  # Scenario 4: Multiple red beads stack guard
  Scenario: Multiple red beads stack guard
    Given the player has 2 red beads in hand
    When the monster attacks with power 5, agility 2
    And the player spends 2 red beads for defense
    Then the player guard should be increased by 2 before attack resolves
    And the player should have 0 red beads in hand

  # Scenario 5: Multiple green beads stack evasion
  Scenario: Multiple green beads stack evasion
    Given the player has 2 green beads in hand
    When the monster attacks with power 5, agility 2
    And the player spends 2 green beads for defense
    Then the player evasion should be increased by 2 before attack resolves
    And the player should have 0 green beads in hand

  # Scenario 6: Can combine red and green beads
  Scenario: Can combine red and green beads
    Given the player has 1 red bead and 1 green bead in hand
    When the monster attacks with power 5, agility 2
    And the player spends 1 red bead and 1 green bead for defense
    Then the player guard should be increased by 1 before attack resolves
    And the player evasion should be increased by 1 before attack resolves
    And the player should have 0 red beads and 0 green beads in hand

  # Scenario 7: No prompt when player has no red or green beads
  Scenario: No prompt when player has no red or green beads
    Given the player has 0 red beads and 0 green beads in hand
    When the monster attacks the player
    Then the player should not be prompted for defensive reactions
    And the attack should resolve immediately

  # Scenario 8: Player can pass without spending
  Scenario: Player can pass without spending beads
    Given the player has 2 red beads in hand
    When the monster attacks with power 5, agility 2
    And the player chooses to pass without spending beads
    Then the player should have 2 red beads in hand
    And the attack should resolve immediately

  # Scenario 9: Defense boost only applies to current attack
  Scenario: Defense boost only applies to current attack
    Given the player has 1 red bead in hand
    When the monster attacks with power 5, agility 2
    And the player spends 1 red bead for defense
    Then the player guard should be increased by 1 before first attack resolves
    When the monster attacks again
    Then the player guard should be 0 before second attack resolves

  # Scenario 10: Monster attacking monster has no reaction prompt
  Scenario: Monster attacking monster has no reaction prompt
    Given a target monster "orc" at position 4,2
    When the goblin attacks the orc
    Then no defensive reaction prompt should be issued
    And the attack should resolve immediately
