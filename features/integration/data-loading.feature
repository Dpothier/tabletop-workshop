Feature: Data Loading
  As a game system
  I need to load game data from YAML files
  So that content can be easily modified

  Scenario: Load character classes from YAML
    Given YAML data for character classes
    When I parse the character data
    Then I should have character classes with names and stats

  Scenario: Load monsters from YAML
    Given YAML data for monsters
    When I parse the monster data
    Then I should have monsters with attacks and phases

  Scenario: Load arenas from YAML
    Given YAML data for arenas
    When I parse the arena data
    Then I should have arenas with dimensions and terrain
