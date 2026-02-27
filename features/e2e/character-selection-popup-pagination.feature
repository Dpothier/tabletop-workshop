Feature: Character Selection Popup Pagination
  As a player
  I want to browse characters across multiple pages
  So that I can find and select characters even when there are many

  Background:
    Given I am on the main menu

  Scenario: No pagination with 4 or fewer characters
    When I click character slot 1
    Then the character selection popup should be visible
    And the popup should not show pagination controls

  Scenario: Pagination appears with more than 4 characters
    Given there are 6 custom characters in storage
    When I click character slot 1
    Then the character selection popup should be visible
    And the popup should show pagination controls
    And the popup should display "Page 1/3"
    And the popup should display 4 characters on the current page

  Scenario: Next page shows remaining characters
    Given there are 6 custom characters in storage
    When I click character slot 1
    And I click the Next page button in the popup
    Then the popup should display "Page 2/3"
    And the popup should display 4 characters on the current page

  Scenario: Previous page returns to first page
    Given there are 6 custom characters in storage
    When I click character slot 1
    And I click the Next page button in the popup
    And I click the Prev page button in the popup
    Then the popup should display "Page 1/3"
    And the popup should display 4 characters on the current page

  Scenario: Selecting character on page 2 works
    Given there are 6 custom characters in storage
    When I click character slot 1
    And I click the Remove button in the popup
    When I click character slot 1
    And I click the Next page button in the popup
    And I click the first character on the current page
    Then the popup should close
    And slot 1 should not be empty

  Scenario: Last page shows correct count
    Given there are 2 custom characters in storage
    When I click character slot 1
    And I click the Next page button in the popup
    Then the popup should display "Page 2/2"
    And the popup should display 2 characters on the current page
