Feature: Combat System Instrumentation (MFG-63)
  As a battle system developer
  I need recorder?.record() calls throughout the combat system
  So that I can capture all combat events for logging, replay, and analysis

  # TurnFlowController Scenarios

  Scenario: instrumentation - TurnFlowController records turn-start with actor name and type
    Given instrumentation combat setup with a recorder
    When instrumentation TurnFlowController starts a turn for actor "hero-0" named "Archer" type "player"
    Then instrumentation recorder should have captured a turn-start entry with actor "Archer" type "player"

  Scenario: instrumentation - TurnFlowController records wheel-advance with cost and new position
    Given instrumentation combat setup with a recorder
    When instrumentation TurnFlowController advances wheel for actor "hero-0" with cost 2 to position 5
    Then instrumentation recorder should have captured a wheel-advance entry with cost 2 newPosition 5

  Scenario: instrumentation - TurnFlowController records segment-change when segment differs
    Given instrumentation combat setup with a recorder
    When instrumentation TurnFlowController changes active segment from "action-selection" to "action-resolution"
    Then instrumentation recorder should have captured a segment-change entry from "action-selection" to "action-resolution"

  Scenario: instrumentation - TurnFlowController does not record segment-change when segment unchanged
    Given instrumentation combat setup with a recorder
    When instrumentation TurnFlowController tries to change active segment from "action-selection" to "action-selection"
    Then instrumentation recorder should not have captured any segment-change entries

  Scenario: instrumentation - TurnFlowController records round-end with entity health summaries
    Given instrumentation combat setup with 2 heroes and 1 monster with a recorder
    When instrumentation TurnFlowController ends the round
    Then instrumentation recorder should have captured a round-end entry with entities

  Scenario: instrumentation - TurnFlowController records battle-end with victory outcome
    Given instrumentation combat setup with a recorder and monster alive
    When instrumentation TurnFlowController ends battle with outcome "victory"
    Then instrumentation recorder should have captured a battle-end entry with outcome "victory"

  # ActionResolution Scenarios

  Scenario: instrumentation - ActionResolution records action-selected with name and modifiers
    Given instrumentation combat setup with a recorder
    When instrumentation ActionResolution executes action "melee-attack" with modifier "heavy"
    Then instrumentation recorder should have captured an action-selected entry with actionName "melee-attack"

  Scenario: instrumentation - ActionResolution records bead-spend for each color
    Given instrumentation combat setup with a recorder and player beads "red:3 blue:2"
    When instrumentation ActionResolution spends beads "red:1 blue:1" for action cost
    Then instrumentation recorder should have captured bead-spend entries with colors "red, blue"

  # AttackEffect Scenarios

  Scenario: instrumentation - AttackEffect records attack-attempt with power and agility
    Given instrumentation attack effect setup with attacker "hero-0" target "monster-0" and recorder
    When instrumentation AttackEffect executes with power 5 agility 2 modifier "feint"
    Then instrumentation recorder should have captured an attack-attempt entry with power 5 agility 2 modifiers "feint"

  Scenario: instrumentation - AttackEffect records combat-outcome with hit result and damage
    Given instrumentation attack effect setup with attacker "hero-0" target "monster-0" and recorder
    When instrumentation AttackEffect executes and hits with damage 3
    Then instrumentation recorder should have captured a combat-outcome entry with outcome "hit" damage 3

  # MoveEffect Scenario

  Scenario: instrumentation - MoveEffect records move with from and to positions
    Given instrumentation move effect setup with actor "hero-0" at "3,4" and recorder
    When instrumentation MoveEffect executes move to "5,6"
    Then instrumentation recorder should have captured a move entry from "3,4" to "5,6"

  # DrawBeadsEffect Scenario

  Scenario: instrumentation - DrawBeadsEffect records bead-draw with colors and hand state
    Given instrumentation draw-beads effect setup with actor "hero-0" and recorder
    When instrumentation DrawBeadsEffect draws 3 beads from pile
    Then instrumentation recorder should have captured a bead-draw entry with colors drawn

  # PrepareEffect Scenario

  Scenario: instrumentation - PrepareEffect records state-change with buff-add for preparation
    Given instrumentation prepare effect setup with actor "hero-0" and recorder
    When instrumentation PrepareEffect adds 2 preparation stacks
    Then instrumentation recorder should have captured a state-change entry with changeType "buff-add"

  # CoordinateEffect Scenario

  Scenario: instrumentation - CoordinateEffect records state-change with buff-add for coordinate
    Given instrumentation coordinate effect setup with actor "hero-0" and recorder
    When instrumentation CoordinateEffect adds 1 coordinate stack
    Then instrumentation recorder should have captured a state-change entry with changeType "buff-add" stack "coordinated"

  # AssessEffect Scenario

  Scenario: instrumentation - AssessEffect records state-change for monster information reveal
    Given instrumentation assess effect setup with actor "hero-0" targeting "monster-0" and recorder
    When instrumentation AssessEffect executes
    Then instrumentation recorder should have captured a state-change entry for monster assessment

  # ActionPipeline (Defensive Reaction) Scenario

  Scenario: instrumentation - ActionPipeline records defensive-reaction with type and beads
    Given instrumentation defensive reaction setup with defender "hero-0" and recorder
    When instrumentation ActionPipeline applies "guard" reaction spending "red:1"
    Then instrumentation recorder should have captured a defensive-reaction entry with reactionType "guard"

  # MonsterEntity Scenario

  Scenario: instrumentation - MonsterEntity records monster-state-transition with drawn bead
    Given instrumentation monster entity setup with recorder
    When instrumentation MonsterEntity transitions from state "idle" to "attacking" with drawn bead "red"
    Then instrumentation recorder should have captured a monster-state-transition entry with drawnBead "red"

  # Defensive None Scenario

  Scenario: instrumentation - recorder is optional and system works without it
    Given instrumentation combat setup without a recorder
    When instrumentation TurnFlowController starts a turn for actor "hero-0"
    And instrumentation AttackEffect executes with power 3 agility 1
    Then no errors should occur during execution
