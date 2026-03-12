Feature: Longbow - Ranged weapon with Strong Draw modifier
  As a character with a Longbow
  I want to use a two-handed ranged weapon with Strong Draw penetration modifier
  So that I can improve penetration while managing red bead costs

  Background:
    Given a longbow test grid of 12x12
    And a longbow test game context with the grid

  # Equipment Definition
  Scenario: Longbow has penetration 0
    When I check the longbow test equipment from YAML
    Then the longbow test equipment penetration should be 0

  Scenario: Longbow is two-handed
    When I check the longbow test equipment from YAML
    Then the longbow test equipment twoHanded should be true

  Scenario: Longbow has 2 inventory slots
    When I check the longbow test equipment from YAML
    Then the longbow test equipment inventorySlots should be 2

  # Strong Draw Modifier
  Scenario: Strong Draw adds +1 penetration
    When I check the longbow test strong draw modifier from YAML
    Then the longbow test strong draw modifier penetration should be 1

  Scenario: Strong Draw costs 1 red bead
    When I check the longbow test strong draw modifier from YAML
    Then the longbow test strong draw cost should have red 1

  # Range Bands
  Scenario: Range band short (1-6) applies +1 modifier
    When I check the longbow test range bands from YAML
    Then the longbow test range band short should apply modifier 1

  Scenario: Range band medium (7-12) applies +0 modifier
    When I check the longbow test range bands from YAML
    Then the longbow test range band medium should apply modifier 0

  Scenario: Range band long (13-18) applies -2 modifier
    When I check the longbow test range bands from YAML
    Then the longbow test range band long should apply modifier -2

  # Range Limit
  Scenario: Longbow has maximum range of 18
    When I check the longbow test maximum range from YAML
    Then the longbow test maximum range should be 18
