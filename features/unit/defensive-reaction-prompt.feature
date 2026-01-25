Feature: Defensive Reaction Prompt Displays Attack Stats
  As a player
  I need to see the incoming attack's power and agility in the defensive reaction prompt
  So that I can make informed decisions about how much to defend

  Background:
    Given an attacking monster "goblin" at position 4,3
    And a defending player "hero-0" at position 3,3
    And the player has 2 red beads in hand
    And the player has 2 green beads in hand

  Scenario: Prompt includes attack power value
    When the monster attacks with power 3, agility 2
    Then the player should be prompted for defensive reactions
    And the defensive reaction prompt should contain the attack power value "3"

  Scenario: Prompt includes attack agility value
    When the monster attacks with power 3, agility 2
    Then the player should be prompted for defensive reactions
    And the defensive reaction prompt should contain the attack agility value "2"

  Scenario: Prompt displays both power and agility together
    When the monster attacks with power 5, agility 4
    Then the player should be prompted for defensive reactions
    And the defensive reaction prompt should contain "Power 5" and "Agility 4"

  Scenario: Prompt shows different power values
    When the monster attacks with power 7, agility 1
    Then the player should be prompted for defensive reactions
    And the defensive reaction prompt should contain the attack power value "7"
    And the defensive reaction prompt should contain the attack agility value "1"

  Scenario: Prompt shows different agility values
    When the monster attacks with power 2, agility 6
    Then the player should be prompted for defensive reactions
    And the defensive reaction prompt should contain the attack power value "2"
    And the defensive reaction prompt should contain the attack agility value "6"

  Scenario: Low power attack shows in prompt
    When the monster attacks with power 1, agility 1
    Then the player should be prompted for defensive reactions
    And the defensive reaction prompt should contain the attack power value "1"
    And the defensive reaction prompt should contain the attack agility value "1"

  Scenario: High power attack shows in prompt
    When the monster attacks with power 10, agility 8
    Then the player should be prompted for defensive reactions
    And the defensive reaction prompt should contain the attack power value "10"
    And the defensive reaction prompt should contain the attack agility value "8"
