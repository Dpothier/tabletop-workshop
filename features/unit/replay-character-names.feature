Feature: ReplayScene character names
  As a player watching a replay
  I want to see character names, not generic labels
  So that I can identify who is who

  Scenario: Label shows first letter of character name when character is provided
    Given a character with getName returning "Warrior"
    And the character index is 0
    When the CharacterVisual label initial is computed
    Then the label should be "W"

  Scenario: Label shows first letter for different character name
    Given a character with getName returning "Mage"
    And the character index is 1
    When the CharacterVisual label initial is computed
    Then the label should be "M"

  Scenario: Label falls back to P-index when no character is provided
    Given no character object is provided
    And the character index is 0
    When the CharacterVisual label initial is computed
    Then the label should be "P1"

  Scenario: Label falls back to correct P-index for second character
    Given no character object is provided
    And the character index is 2
    When the CharacterVisual label initial is computed
    Then the label should be "P3"
