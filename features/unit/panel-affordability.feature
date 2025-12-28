Feature: Panel Affordability Checking
  Utility to verify if an action button is affordable based on available beads and time
  Focusing on the beadCountsToActionCost helper and full affordability checks

  Scenario: Action affordable when exact beads available
    Given available beads "{ red: 1, blue: 0, green: 0, white: 0 }"
    And available time "2"
    And an action with cost "{ time: 2, red: 1 }"
    When I check if the action is affordable
    Then the action should be affordable

  Scenario: Action NOT affordable when specific color missing
    Given available beads "{ red: 0, blue: 2, green: 0, white: 0 }"
    And available time "2"
    And an action with cost "{ time: 2, red: 1 }"
    When I check if the action is affordable
    Then the action should NOT be affordable

  Scenario: Action affordable with excess beads
    Given available beads "{ red: 3, blue: 2, green: 1, white: 1 }"
    And available time "5"
    And an action with cost "{ time: 2, red: 1 }"
    When I check if the action is affordable
    Then the action should be affordable

  Scenario: Action NOT affordable when time insufficient
    Given available beads "{ red: 2, blue: 0, green: 0, white: 0 }"
    And available time "1"
    And an action with cost "{ time: 2, red: 1 }"
    When I check if the action is affordable
    Then the action should NOT be affordable

  Scenario: Time-only action needs only time check
    Given available beads "{ red: 0, blue: 0, green: 0, white: 0 }"
    And available time "3"
    And an action with cost "{ time: 3 }"
    When I check if the action is affordable
    Then the action should be affordable

  Scenario: Action with multiple colored costs requires all colors
    Given available beads "{ red: 1, blue: 1, green: 0, white: 0 }"
    And available time "2"
    And an action with cost "{ time: 2, red: 1, blue: 1, green: 1 }"
    When I check if the action is affordable
    Then the action should NOT be affordable

  Scenario: Action with multiple colored costs - all available
    Given available beads "{ red: 1, blue: 1, green: 1, white: 0 }"
    And available time "2"
    And an action with cost "{ time: 2, red: 1, blue: 1, green: 1 }"
    When I check if the action is affordable
    Then the action should be affordable

  Scenario: Zero cost action is always affordable
    Given available beads "{ red: 0, blue: 0, green: 0, white: 0 }"
    And available time "0"
    And an action with cost "{ time: 0 }"
    When I check if the action is affordable
    Then the action should be affordable

  Scenario: beadCountsToActionCost converts beads to ActionCost
    Given a BeadCounts with "{ red: 2, blue: 1, green: 3, white: 0 }"
    And an available time "5"
    When I convert bead counts to ActionCost with time
    Then the resulting ActionCost should have time: 5
    And the resulting ActionCost should have red: 2
    And the resulting ActionCost should have blue: 1
    And the resulting ActionCost should have green: 3
    And the resulting ActionCost should have white: 0
