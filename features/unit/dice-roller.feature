Feature: Dice Roller
  As a game system
  I need to parse and roll dice notation
  So that combat damage can be calculated

  Background:
    Given a dice roller is initialized

  Scenario: Roll standard dice notation
    When I roll "2d6"
    Then the result should be between 2 and 12

  Scenario: Roll with positive modifier
    When I roll "1d8+3"
    Then the result should be between 4 and 11

  Scenario: Roll with negative modifier
    When I roll "1d6-2"
    Then the result should be between 0 and 4

  Scenario: Handle plain number as notation
    When I roll "5"
    Then the result should be exactly 5

  Scenario: Handle invalid notation
    When I roll "invalid"
    Then the result should be exactly 0

  Scenario Outline: Various dice combinations
    When I roll "<notation>"
    Then the result should be between <min> and <max>

    Examples:
      | notation | min | max |
      | 1d4      | 1   | 4   |
      | 3d6      | 3   | 18  |
      | 1d20     | 1   | 20  |
      | 2d10+5   | 7   | 25  |
      | 1d4-1    | 0   | 3   |

  Scenario: Detailed roll returns individual dice
    When I roll detailed "3d6"
    Then I should get 3 individual dice results
    And each die should be between 1 and 6
