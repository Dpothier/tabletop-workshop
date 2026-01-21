Feature: BattleUI Defense Stats Display
  As a battle UI system
  I need to display monster defense stats on the battle panel
  So that the player can see the monster's defensive capabilities (armor, guard, evasion)

  Background:
    Given a mock BattleUI with monster panel

  # Feature 1: Defense stats display exists
  Scenario: Defense stats display exists when BattleUI created
    When the monster has defense stats: armor 2, guard 1, evasion 3
    Then the defense stats text should be created
    And the defense stats text should contain armor value "2"
    And the defense stats text should contain guard value "1"
    And the defense stats text should contain evasion value "3"

  # Feature 2: Shows armor value with shield icon
  Scenario: Shows armor value with shield icon
    When the monster has defense stats: armor 5, guard 0, evasion 0
    Then the defense stats display should contain "🛡 5"

  # Feature 3: Shows guard value with icon
  Scenario: Shows guard value with icon
    When the monster has defense stats: armor 0, guard 3, evasion 0
    Then the defense stats display should contain "🔰 3"

  # Feature 4: Shows evasion value with icon
  Scenario: Shows evasion value with icon
    When the monster has defense stats: armor 0, guard 0, evasion 4
    Then the defense stats display should contain "💨 4"

  # Feature 5: All stats displayed together
  Scenario: All defense stats displayed together
    When the monster has defense stats: armor 2, guard 1, evasion 3
    Then the defense stats display should contain "🛡 2"
    And the defense stats display should contain "🔰 1"
    And the defense stats display should contain "💨 3"

  # Feature 6: Stats update when monster stats change
  Scenario: Defense stats update when armor changes
    Given the monster has defense stats: armor 2, guard 1, evasion 3
    When the monster armor is changed to 5
    Then the defense stats display should contain "🛡 5"
    And the defense stats display should contain "🔰 1"

  Scenario: Defense stats update when guard changes
    Given the monster has defense stats: armor 2, guard 1, evasion 3
    When the monster guard is changed to 4
    Then the defense stats display should contain "🛡 2"
    And the defense stats display should contain "🔰 4"

  Scenario: Defense stats update when evasion changes
    Given the monster has defense stats: armor 2, guard 1, evasion 3
    When the monster evasion is changed to 5
    Then the defense stats display should contain "💨 5"

  # Feature 7: Zero stats still displayed
  Scenario: Zero armor is still displayed
    When the monster has defense stats: armor 0, guard 2, evasion 3
    Then the defense stats display should contain "🛡 0"

  Scenario: Zero guard is still displayed
    When the monster has defense stats: armor 2, guard 0, evasion 3
    Then the defense stats display should contain "🔰 0"

  Scenario: Zero evasion is still displayed
    When the monster has defense stats: armor 2, guard 1, evasion 0
    Then the defense stats display should contain "💨 0"

  Scenario: All stats zero are displayed
    When the monster has defense stats: armor 0, guard 0, evasion 0
    Then the defense stats display should contain "🛡 0"
    And the defense stats display should contain "🔰 0"
    And the defense stats display should contain "💨 0"

  # Feature 8: Stats positioned above action wheel
  Scenario: Defense stats positioned above action wheel
    When the monster has defense stats: armor 2, guard 1, evasion 3
    Then the defense stats text Y position should be greater than 100
    And the defense stats text Y position should be less than 300
    And the defense stats text X position should be near 900

  # Integration scenarios
  Scenario: Display persists across multiple updates
    Given the monster has defense stats: armor 1, guard 1, evasion 1
    And the defense stats display should contain "🛡 1"
    When the monster armor is changed to 3
    And the monster armor is changed to 6
    Then the defense stats display should contain "🛡 6"
    And the defense stats display should contain "🔰 1"
    And the defense stats display should contain "💨 1"

  Scenario: High defense stats displayed correctly
    When the monster has defense stats: armor 10, guard 8, evasion 12
    Then the defense stats display should contain "🛡 10"
    And the defense stats display should contain "🔰 8"
    And the defense stats display should contain "💨 12"
