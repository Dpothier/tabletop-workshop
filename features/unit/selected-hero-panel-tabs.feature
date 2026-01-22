Feature: Selected Hero Panel Tab Persistence
  The panel should manage tab state correctly when showing and hiding
  Specifically, tabs should persist within the same hero but reset when switching heroes

  Scenario: Tab persists when showing panel for same hero
    Given a selected hero panel with movement and attack actions
    When I select the attack tab
    And the panel is shown again for the same hero
    Then the attack tab should still be active
    And attack actions should be displayed

  Scenario: Tab resets when showing panel for different hero
    Given a selected hero panel with movement and attack actions
    When I select the attack tab
    And the panel is shown for a different hero
    Then the movement tab should be active
    And movement actions should be displayed

  Scenario: Tab persists through affordability update
    Given a selected hero panel with movement and attack actions
    When I select the attack tab
    And the affordability is updated for the current hero
    Then the attack tab should still be active

  Scenario: Multiple tab switching within same hero
    Given a selected hero panel with movement, attack and other actions
    When I select the other tab
    And I select the attack tab
    And I select the movement tab
    Then the movement tab should be active

  Scenario: Switching heroes resets to movement tab
    Given a selected hero panel with movement and attack actions
    When I select the attack tab
    And the panel is shown for a different hero
    And I select the other tab
    And the panel is shown for the first hero again
    Then the movement tab should be active
