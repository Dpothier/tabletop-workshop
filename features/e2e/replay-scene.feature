Feature: ReplayScene Visual Replay
  As a game designer
  I want to visually replay a recorded combat step-by-step
  So that I can observe the battle flow and validate game balance

  Scenario: replay ReplayScene loads and displays initial entity positions from snapshot
    Given a replay recording with 2 characters and 1 monster
    When the ReplayScene loads with the recording
    Then entity visuals should be displayed at their snapshot positions

  Scenario: replay ReplayScene starts in step-by-step mode paused
    Given a replay recording loaded in ReplayScene
    Then the scene should be in paused state
    And the Next button should be visible

  Scenario: replay clicking Next plays one complete actor turn then pauses
    Given a replay recording loaded in ReplayScene with 3 steps
    When I click the Next button
    Then one complete turn of animations should play
    And the scene should return to paused state

  Scenario: replay after step including round-end burn damage animations are included
    Given a replay recording with a step that includes round-end with burn damage
    When I advance to that step
    Then burn damage animations should be played

  Scenario: replay clicking Auto starts continuous playback
    Given a replay recording loaded in ReplayScene
    When I click the Auto button
    Then the scene should be in auto-play mode
    And steps should advance automatically

  Scenario: replay clicking Pause stops auto-play
    Given a replay recording in auto-play mode
    When I click the Pause button
    Then the scene should return to paused state

  Scenario: replay keyboard right-arrow triggers next step
    Given a replay recording loaded in ReplayScene
    When I press the right arrow key
    Then one step should advance

  Scenario: replay keyboard space toggles auto and pause
    Given a replay recording loaded in ReplayScene
    When I press the space key
    Then the scene should toggle to auto-play mode
    When I press the space key again
    Then the scene should toggle to paused mode

  Scenario: replay progress indicator shows current step and round
    Given a replay recording loaded in ReplayScene with 5 steps
    When I advance 2 steps
    Then the progress indicator should show step 3 of 5

  Scenario: replay retour au menu button navigates back
    Given a replay recording loaded in ReplayScene
    When I click the retour au menu button
    Then the scene should transition to MenuScene

  @wip
  Scenario: replay ReplayScene shows character names not P-indices
    Given a replay recording with 2 characters named "Warrior" and "Mage"
    When the ReplayScene loads with the recording
    Then character visuals should display name initials "W" and "M" not "P1" and "P2"

  Scenario: replay ReplayScene shows error message for empty recording
    Given a replay recording with empty entries
    When the ReplayScene loads with the empty recording
    Then an error message "No combat data to replay" should be displayed
    And the Next button should not be interactive
    And the Auto button should not be interactive
    And the Menu button should still be visible
