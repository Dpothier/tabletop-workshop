Feature: Option Selection UI
  UI component for selecting action enhancement options.
  Manages option selection, affordability checking, and multi-select behavior.

  Scenario: Display all options with labels
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 1 }       |
      | precision  | Precision Strike   | { green: 1 }      |
    When I show the UI with available beads "{ red: 2, blue: 2, green: 2, white: 0 }"
    Then all 3 options should be visible

  Scenario: Show cost per option
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1, blue: 2 } |
      | knockback  | Knockback          | { green: 3 }      |
    When I show the UI with available beads "{ red: 5, blue: 5, green: 5, white: 0 }"
    Then option "power" should show cost "{ red: 1, blue: 2 }"
    And option "knockback" should show cost "{ green: 3 }"

  Scenario: Gray out unaffordable options
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 5 }       |
    When I show the UI with available beads "{ red: 2, blue: 1, green: 0, white: 0 }"
    Then option "power" should be affordable
    And option "knockback" should NOT be affordable

  Scenario: Select affordable option
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 1 }       |
    And single-select mode
    When I show the UI with available beads "{ red: 2, blue: 2, green: 0, white: 0 }"
    And I select option "power"
    Then option "power" should be selected
    And selected options should be "power"

  Scenario: Cannot select unaffordable option
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 5 }       |
    And single-select mode
    When I show the UI with available beads "{ red: 2, blue: 1, green: 0, white: 0 }"
    And I attempt to select option "knockback"
    Then option "knockback" should NOT be selected
    And selected options should be empty

  Scenario: Multi-select allows multiple options
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 1 }       |
      | precision  | Precision Strike   | { green: 1 }      |
    And multi-select mode
    When I show the UI with available beads "{ red: 2, blue: 2, green: 2, white: 0 }"
    And I select option "power"
    And I select option "knockback"
    Then option "power" should be selected
    And option "knockback" should be selected
    And selected options should be "power,knockback"

  Scenario: Single-select deselects previous selection
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 1 }       |
    And single-select mode
    When I show the UI with available beads "{ red: 2, blue: 2, green: 0, white: 0 }"
    And I select option "power"
    And I select option "knockback"
    Then option "power" should NOT be selected
    And option "knockback" should be selected
    And selected options should be "knockback"

  Scenario: Deselect option in multi-select
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 1 }       |
    And multi-select mode
    When I show the UI with available beads "{ red: 2, blue: 2, green: 0, white: 0 }"
    And I select option "power"
    And I select option "knockback"
    And I deselect option "power"
    Then option "power" should NOT be selected
    And option "knockback" should be selected
    And selected options should be "knockback"

  Scenario: Confirm returns selected option ids
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 1 }       |
    And multi-select mode
    When I show the UI with available beads "{ red: 2, blue: 2, green: 0, white: 0 }"
    And I select option "power"
    And I select option "knockback"
    And I confirm the selection
    Then the confirm callback should receive "power,knockback"

  Scenario: Cancel clears selection
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | power      | Power Attack       | { red: 1 }        |
      | knockback  | Knockback          | { blue: 1 }       |
    And single-select mode
    When I show the UI with available beads "{ red: 2, blue: 2, green: 0, white: 0 }"
    And I select option "power"
    And I cancel the selection
    Then the cancel callback should have been called
    And selected options should be empty

  Scenario: Zero-cost options are always selectable
    Given an OptionSelectionUI instance
    And options with labels:
      | id         | label              | cost              |
      | free       | Free Option        |                   |
      | costly     | Costly Option      | { red: 5 }        |
    And single-select mode
    When I show the UI with available beads "{ red: 1, blue: 0, green: 0, white: 0 }"
    Then option "free" should be affordable
    And option "costly" should NOT be affordable
    And I can select option "free"

  Scenario: Selecting option reduces remaining beads for other options
    Given an OptionSelectionUI instance
    And options with labels:
      | id     | label    | cost       |
      | opt_a  | Option A | { red: 1 } |
      | opt_b  | Option B | { red: 1 } |
    And multi-select mode
    When I show the UI with available beads "{ red: 1, blue: 0, green: 0, white: 0 }"
    Then option "opt_a" should be affordable
    And option "opt_b" should be affordable
    When I select option "opt_a"
    Then option "opt_b" should NOT be affordable

  Scenario: Deselecting option restores beads for other options
    Given an OptionSelectionUI instance
    And options with labels:
      | id     | label    | cost       |
      | opt_a  | Option A | { red: 1 } |
      | opt_b  | Option B | { red: 1 } |
    And multi-select mode
    When I show the UI with available beads "{ red: 1, blue: 0, green: 0, white: 0 }"
    And I select option "opt_a"
    Then option "opt_b" should NOT be affordable
    When I deselect option "opt_a"
    Then option "opt_b" should be affordable

  Scenario: Multiple selections accumulate costs
    Given an OptionSelectionUI instance
    And options with labels:
      | id     | label    | cost        |
      | opt_a  | Option A | { red: 1 }  |
      | opt_b  | Option B | { blue: 1 } |
      | opt_c  | Option C | { red: 1 }  |
    And multi-select mode
    When I show the UI with available beads "{ red: 1, blue: 1, green: 0, white: 0 }"
    And I select option "opt_a"
    And I select option "opt_b"
    Then option "opt_c" should NOT be affordable

  Scenario: Get total cost of selected options
    Given an OptionSelectionUI instance
    And options with labels:
      | id     | label    | cost                 |
      | opt_a  | Option A | { red: 1 }           |
      | opt_b  | Option B | { blue: 1, green: 1 }|
    And multi-select mode
    When I show the UI with available beads "{ red: 2, blue: 2, green: 2, white: 0 }"
    And I select option "opt_a"
    And I select option "opt_b"
    Then the total selected cost should be "{ red: 1, blue: 1, green: 1 }"
