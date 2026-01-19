Feature: Wheel Display Count Indicators
  As a UI system
  I need to properly manage count text indicators on the action wheel
  So that stacked entity counts are accurate when entities move

  Background:
    Given a mock BattleUI with wheel display

  Scenario: Count text is created when more than 3 entities at position
    When I update the wheel with 5 entities at position 0
    Then 1 count text should exist
    And the count text should show "+2"

  Scenario: Count text is removed when entities leave position
    Given I update the wheel with 5 entities at position 0
    And 1 count text should exist
    When I update the wheel with 2 entities at position 0
    Then 0 count texts should exist

  Scenario: Count text is updated when count changes
    Given I update the wheel with 5 entities at position 0
    When I update the wheel with 6 entities at position 0
    Then 1 count text should exist
    And the count text should show "+3"

  Scenario: Multiple positions with many entities
    When I update the wheel with 4 entities at position 0 and 5 at position 3
    Then 2 count texts should exist

  Scenario: Count texts are cleared on each update
    Given I update the wheel with 5 entities at position 0
    And 1 count text should exist
    When I update the wheel with 5 entities at position 3
    Then 1 count text should exist
    And all previous count texts should be destroyed
