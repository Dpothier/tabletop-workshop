Feature: Character Names Display
  As a player
  I want to see character names in the battle UI
  So that I can identify my heroes by name instead of numbers

  Background:
    Given I have started a battle with bead system

  Scenario: Hero cards display character names
    Then each hero card should have a name
    And hero card names should not be empty

  Scenario: Selected hero panel displays character name
    Given the first hero is the current actor
    When I click the first hero card in the bar
    Then the selected hero panel should show a hero name

  Scenario: Hero card names match default characters
    Then the hero card names should be Warrior, Mage, Rogue, Cleric

  Scenario: Selected hero panel name matches selected hero
    Given the first hero is the current actor
    When I click the first hero card in the bar
    Then the selected hero panel hero name should match the first hero card name
