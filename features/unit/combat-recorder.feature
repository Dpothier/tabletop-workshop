Feature: CombatRecorder Core Functionality
  As a battle system developer
  I need a CombatRecorder that tracks all combat events with sequential numbering
  So that I can maintain a chronological log for replay, analysis, and debugging

  Background:
    Given a new CombatRecorder

  # Sequence Auto-Increment Tests

  Scenario: First recorded entry receives seq 1
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    Then the recorded entry should have seq 1

  Scenario: Second entry receives seq 2
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record a turn-start entry for actor "hero-2" at wheel position 1
    Then the last recorded entry should have seq 2

  Scenario: Seq auto-increments without gaps
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record a turn-start entry for actor "hero-2" at wheel position 1
    And I record a turn-start entry for actor "hero-3" at wheel position 2
    Then the recorded entries should have seq "1, 2, 3"

  # Entry Retrieval Tests

  Scenario: getEntries returns all recorded entries
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record an action-selected entry for actor "hero-1" with action "attack"
    And I record a bead-spend entry for actor "hero-1" with reason "action-cost"
    Then getEntries should return 3 entries

  Scenario: getEntries returns entries in insertion order
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record a turn-start entry for actor "hero-2" at wheel position 1
    And I record a turn-start entry for actor "hero-3" at wheel position 2
    Then the entries in order should be from actors "hero-1, hero-2, hero-3"

  Scenario: getEntries returns entries with correct seq values
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record an action-selected entry for actor "hero-1" with action "attack"
    Then entry 0 should have seq 1
    And entry 1 should have seq 2

  # Clear/Reset Tests

  Scenario: clear() removes all entries
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record an action-selected entry for actor "hero-1" with action "attack"
    And I clear the recorder
    Then getEntries should return 0 entries

  Scenario: clear() resets seq counter to 0
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I clear the recorder
    And I record a turn-start entry for actor "hero-2" at wheel position 1
    Then the recorded entry should have seq 1

  Scenario: Multiple clear cycles work independently
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I clear the recorder
    And I record a turn-start entry for actor "hero-2" at wheel position 1
    And I record a turn-start entry for actor "hero-3" at wheel position 2
    And I clear the recorder
    And I record a turn-start entry for actor "hero-4" at wheel position 3
    Then the recorded entry should have seq 1

  # Entry Type Validation Tests

  Scenario: turn-start entry has all required fields
    When I record a turn-start entry for actor "hero-1" named "Archer" type "player" at wheel position 0
    Then the entry should have fields: "actorId, actorName, actorType, wheelPosition"

  Scenario: action-selected entry has all required fields
    When I record an action-selected entry for actor "hero-1" with action "attack" and modifier "feint" costing 2 beads
    Then the entry should have fields: "actorId, actorName, actionId, actionName, modifiers, beadCost"

  Scenario: bead-spend entry has all required fields
    When I record a bead-spend entry for actor "hero-1" with reason "action-cost" and hand "red:1 blue:1"
    Then the entry should have fields: "entityId, entityName, color, reason, handAfter"

  Scenario: bead-draw entry has all required fields
    When I record a bead-draw entry for actor "hero-1" with source "rest" and hand "red:2 blue:1"
    Then the entry should have fields: "entityId, entityName, colors, source, handAfter"

  Scenario: move entry has all required fields
    When I record a move entry from "hero-1" to position "5,5"
    Then the entry should have fields: "entityId, entityName, from, to"

  Scenario: attack-attempt entry has all required fields
    When I record an attack-attempt entry from "hero-1" to "monster-1" with power 5 agility 3
    Then the entry should have fields: "attackerId, attackerName, targetId, targetName, power, agility, modifiers"

  Scenario: defensive-reaction entry has all required fields
    When I record a defensive-reaction entry for actor "hero-1" type "guard" spending "red:1"
    Then the entry should have fields: "defenderId, defenderName, reactionType, beadsSpent"

  Scenario: combat-outcome entry has all required fields
    When I record a combat-outcome entry from "hero-1" to "monster-1" with outcome "hit" damage 3
    Then the entry should have fields: "attackerId, targetId, outcome, damage, blockedDamage, targetHealthAfter, targetMaxHealth"

  Scenario: state-change entry has all required fields
    When I record a state-change entry for actor "hero-1" type "buff-add" with stack "strength"
    Then the entry should have fields: "entityId, entityName, changeType, details"

  Scenario: monster-state-transition entry has all required fields
    When I record a monster-state-transition entry from "idle" to "attacking" with drawn bead "red"
    Then the entry should have fields: "fromState, toState, drawnBead"

  Scenario: wheel-advance entry has all required fields
    When I record a wheel-advance entry for actor "hero-1" costing 1 segment to position 3
    Then the entry should have fields: "entityId, entityName, cost, newPosition"

  Scenario: segment-change entry has all required fields
    When I record a segment-change entry from "action-selection" to "action-resolution"
    Then the entry should have fields: "previousSegment, newSegment"

  Scenario: round-end entry has all required fields
    When I record a round-end entry with entities "hero-1:100/100, monster-1:50/50"
    Then the entry should have fields: "entitySummaries"

  Scenario: battle-end entry has all required fields
    When I record a battle-end entry with outcome "victory"
    Then the entry should have fields: "outcome"

  # JSON Serialization Tests

  Scenario: Entries are plain JSON-serializable objects
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    Then the entry should serialize to valid JSON

  Scenario: Entries contain no class instances
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record a bead-spend entry for actor "hero-1" with reason "action-cost" and hand "red:2 blue:1"
    Then all entries should be plain objects with no class instances

  Scenario: Entries contain no circular references
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record an action-selected entry for actor "hero-1" with action "attack" and modifier "heavy" costing 3 beads
    Then entries should have no circular references

  # Round/Turn Derivation Tests

  Scenario: Round number is derivable by counting round-end entries
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record a round-end entry with entities "hero-1:100/100"
    And I record a turn-start entry for actor "hero-2" at wheel position 0
    And I record a round-end entry with entities "hero-2:100/100"
    Then round number 1 should be derivable from entries
    And round number 2 should be derivable from entries

  Scenario: Turn number is derivable by counting turn-start entries
    When I record a turn-start entry for actor "hero-1" at wheel position 0
    And I record a turn-start entry for actor "hero-2" at wheel position 1
    And I record a turn-start entry for actor "hero-3" at wheel position 2
    Then turn number 1 should be derivable from entries
    And turn number 2 should be derivable from entries
    And turn number 3 should be derivable from entries
