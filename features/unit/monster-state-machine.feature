Feature: Monster State Machine
  As a game system
  I need to track monster state and transitions
  So that bead draws determine monster attacks

  # FR-2.4: Monster state machine with current state tracking
  Scenario: Initialize state machine with start state
    Given a state machine with states:
      | name       | damage | wheel_cost | range |
      | idle       |        |            |       |
      | stone_slam | 2      | 3          | 1     |
    And start state is "idle"
    Then current state should be "idle"

  Scenario: Get current state info with damage
    Given a state machine starting at "stone_slam" with states:
      | name       | damage | wheel_cost | range |
      | idle       |        |            |       |
      | stone_slam | 2      | 3          | 1     |
    Then current state damage should be 2
    And current state wheel_cost should be 3
    And current state range should be 1

  Scenario: Idle state has no damage
    Given a state machine starting at "idle" with states:
      | name       | damage | wheel_cost | range |
      | idle       |        |            |       |
      | stone_slam | 2      | 3          | 1     |
    Then current state should have no damage

  # FR-2.5: Transition logic based on drawn bead color
  Scenario: Transition to new state on red bead
    Given a state machine starting at "idle" with states:
      | name       | damage | wheel_cost | range |
      | idle       |        |            |       |
      | stone_slam | 2      | 3          | 1     |
    And state "idle" has transitions:
      | color | target      |
      | red   | stone_slam  |
      | blue  | idle        |
      | green | idle        |
      | white | idle        |
    When I transition with "red" bead
    Then current state should be "stone_slam"

  Scenario: Transition can loop back to same state
    Given a state machine starting at "stone_slam" with states:
      | name       | damage | wheel_cost | range |
      | stone_slam | 2      | 3          | 1     |
    And state "stone_slam" has transitions:
      | color | target      |
      | red   | stone_slam  |
      | blue  | stone_slam  |
      | green | stone_slam  |
      | white | stone_slam  |
    When I transition with "red" bead
    Then current state should be "stone_slam"

  Scenario: Different colors lead to different states
    Given a state machine starting at "idle" with states:
      | name         | damage | wheel_cost | range | area     |
      | idle         |        |            |       |          |
      | stone_slam   | 2      | 3          | 1     |          |
      | ground_pound | 1      | 2          |       | radius 2 |
      | earthquake   | 3      | 4          |       | all      |
    And state "idle" has transitions:
      | color | target       |
      | red   | stone_slam   |
      | blue  | ground_pound |
      | green | idle         |
      | white | earthquake   |
    When I transition with "blue" bead
    Then current state should be "ground_pound"
    And current state damage should be 1
    And current state wheel_cost should be 2
    And current state area should be "radius 2"

  Scenario: State machine returns new state on transition
    Given a state machine starting at "idle" with states:
      | name       | damage | wheel_cost | range |
      | idle       |        |            |       |
      | stone_slam | 2      | 3          | 1     |
    And state "idle" has transitions:
      | color | target      |
      | red   | stone_slam  |
      | blue  | idle        |
      | green | idle        |
      | white | idle        |
    When I transition with "red" bead
    Then the returned state should have damage 2

  Scenario: Reset state machine to start state
    Given a state machine starting at "idle" with states:
      | name       | damage | wheel_cost | range |
      | idle       |        |            |       |
      | stone_slam | 2      | 3          | 1     |
    And state "idle" has transitions:
      | color | target      |
      | red   | stone_slam  |
      | blue  | idle        |
      | green | idle        |
      | white | idle        |
    When I transition with "red" bead
    And I reset the state machine
    Then current state should be "idle"

  Scenario: Constructor throws error for invalid start state
    When I try to create a state machine with invalid start state "unknown"
    Then a state machine error should be thrown with message containing "Invalid start state"

  Scenario: Transition throws error for missing transition
    Given a state machine starting at "idle" with states:
      | name | damage | wheel_cost | range |
      | idle |        |            |       |
    And state "idle" has transitions:
      | color | target |
      | red   | idle   |
    When I try to transition with "blue" bead
    Then a state machine error should be thrown with message containing "no transition for blue"

  # PRD example flow
  Scenario: PRD Stone Guardian flow
    Given a state machine starting at "idle" with states:
      | name         | damage | wheel_cost | range | area     |
      | idle         |        |            |       |          |
      | stone_slam   | 2      | 3          | 1     |          |
      | ground_pound | 1      | 2          |       | radius 2 |
      | earthquake   | 3      | 4          |       | all      |
    And all states have standard transitions:
      | color | target       |
      | red   | stone_slam   |
      | blue  | ground_pound |
      | green | idle         |
      | white | earthquake   |
    # Monster starts idle
    Then current state should be "idle"
    # Draw red -> stone_slam
    When I transition with "red" bead
    Then current state should be "stone_slam"
    And current state damage should be 2
    And current state wheel_cost should be 3
    # Draw blue -> ground_pound
    When I transition with "blue" bead
    Then current state should be "ground_pound"
    And current state area should be "radius 2"
    # Draw white -> earthquake
    When I transition with "white" bead
    Then current state should be "earthquake"
    And current state damage should be 3
    And current state area should be "all"
    # Draw green -> back to idle
    When I transition with "green" bead
    Then current state should be "idle"
    And current state should have no damage
