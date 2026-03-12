Feature: Combat Instrumentation Integration
  As a logging system
  I need to record the complete flow of combat actions through production code
  So that all combat events are captured with correct sequence and data

  Scenario: A complete player turn produces expected log entry sequence
    Given integration instrumentation battle with recorder
    When integration instrumentation player executes move and attack
    Then integration instrumentation recorder should contain action-selected entry
    And integration instrumentation recorder should contain move entry
    And integration instrumentation recorder should contain attack-attempt entry
    And integration instrumentation recorder should contain combat-outcome entry
    And integration instrumentation entries should be in correct order

  Scenario: A complete monster turn produces turn-start, monster-state-transition, action events, wheel-advance
    Given integration instrumentation battle with recorder and monster with state machine
    When integration instrumentation monster executes turn
    Then integration instrumentation recorder should contain turn-start entry type monster
    And integration instrumentation recorder should contain monster-state-transition entry
    And integration instrumentation recorder should contain wheel-advance entry
    And integration instrumentation monster action events should be recorded

  Scenario: Round boundary produces round-end with correct entity summaries
    Given integration instrumentation battle with recorder and multiple entities
    When integration instrumentation round ends
    Then integration instrumentation recorder should contain round-end entry
    And integration instrumentation round-end should have all entity summaries
    And integration instrumentation entity summaries should include characters and monster
