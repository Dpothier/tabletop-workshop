Feature: Option Selection Panel
  UI component wrapper for selecting action enhancement options.
  Tests the Phaser-based OptionSelectionPanel which wraps OptionSelectionUI.

  Scenario: Single-select prompt auto-confirms on click
    Given an option selection prompt with multiSelect false
    And option "pass" exists and is affordable
    When I click option "pass"
    Then onConfirm should be called with pass selected
