Feature: Combat Resolution
  As a game system
  I need to calculate combat damage correctly
  So that battles are fair and predictable

  Scenario: Calculate damage with armor reduction
    Given an attacker deals 10 damage
    And the target has 3 armor
    When damage is calculated
    Then the final damage should be 7

  Scenario: Apply minimum damage of zero
    Given an attacker deals 2 damage
    And the target has 5 armor
    When damage is calculated
    Then the final damage should be 0

  Scenario: Monster selects attack from available options
    Given a monster with multiple attacks
    When the monster selects an attack
    Then the attack should be one of the monster's attacks

  Scenario: Target closest character
    Given characters at positions:
      | x | y |
      | 2 | 2 |
      | 5 | 5 |
      | 8 | 8 |
    And a monster at position 3,3
    When the monster finds the closest target
    Then the target should be the character at 2,2
