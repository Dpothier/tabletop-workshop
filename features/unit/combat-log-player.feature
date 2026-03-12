Feature: Combat Log Player
  As a replay system
  I need to group combat log entries into replay steps and convert them to animation events
  So that combat recordings can be replayed visually step-by-step

  # FR-MFG-65: buildSteps()

  Scenario: player buildSteps groups entries between turn-start markers into distinct ReplaySteps
    Given a player combat log with 3 turn-start entries and interleaved events
    When I player build steps from the log
    Then the player result should have 3 replay steps

  Scenario: player buildSteps attaches round-end entries to the last step of the round
    Given a player combat log with 2 turns and a round-end after the second turn
    When I player build steps from the log
    Then the player last step should include the round-end entry
    And the player last step includesRoundEnd should be true

  Scenario: player buildSteps sets actorId and actorName from turn-start entry
    Given a player combat log with a turn-start for actor "hero-0" named "Warrior"
    When I player build steps from the log
    Then player step 0 should have actorId "hero-0"
    And player step 0 should have actorName "Warrior"

  # FR-MFG-65: nextStep() and isComplete()

  Scenario: player nextStep returns the current step and advances the index
    Given a player with 3 built steps
    When I player call nextStep
    Then the player returned step should be step 0
    When I player call nextStep again
    Then the player returned step should be step 1

  Scenario: player isComplete returns true after all steps consumed
    Given a player with 2 built steps
    When I player consume all steps
    Then player isComplete should be true

  # FR-MFG-65: toAnimationEvents()

  Scenario: player toAnimationEvents converts move entry to MoveEvent
    Given a player replay step with a move entry from "1,1" to "2,2"
    When I player convert the step to animation events
    Then the player events should contain a MoveEvent from "1,1" to "2,2"

  Scenario: player toAnimationEvents converts combat-outcome hit to HitEvent and DamageEvent
    Given a player replay step with a combat-outcome hit entry dealing 3 damage
    When I player convert the step to animation events
    Then the player events should contain a HitEvent
    And the player events should contain a DamageEvent with newHealth after 3 damage

  Scenario: player toAnimationEvents converts combat-outcome dodged to DodgeEvent
    Given a player replay step with a combat-outcome dodged entry
    When I player convert the step to animation events
    Then the player events should contain a DodgeEvent

  Scenario: player toAnimationEvents converts combat-outcome guarded to GuardedEvent
    Given a player replay step with a combat-outcome guarded entry blocking 2 damage
    When I player convert the step to animation events
    Then the player events should contain a GuardedEvent with blockedDamage 2

  Scenario: player toAnimationEvents converts bead-draw to RestEvent
    Given a player replay step with a bead-draw entry with colors "red,blue"
    When I player convert the step to animation events
    Then the player events should contain a RestEvent with beadsDrawn "red,blue"

  Scenario: player toAnimationEvents converts monster-state-transition to BeadDrawEvent and StateChangeEvent
    Given a player replay step with a monster-state-transition from "idle" to "attack" with bead "red"
    When I player convert the step to animation events
    Then the player events should contain a BeadDrawEvent with color "red"
    And the player events should contain a StateChangeEvent from "idle" to "attack"

  Scenario: player toAnimationEvents produces events for all entries in order
    Given a player replay step with move then combat-outcome entries
    When I player convert the step to animation events
    Then the player MoveEvent should come before the player combat events
