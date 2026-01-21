Feature: Defensive Reactions in Combat
  As a player
  I want to see defensive options when attacked by a monster
  So that I can protect myself

  Background:
    Given I have started a battle with bead system

  Scenario: Defensive reaction system is available in battle
    Then the battle scene should have a defensive reaction panel
    And the panel should support guard and evasion options
