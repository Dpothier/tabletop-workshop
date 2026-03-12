Feature: BattleBuilder wires CombatRecorder
  As a game system
  I want the battle state to include a working recorder
  So that combat events are captured for replay

  Scenario: BattleState has recorder when withRecorder is called
    Given battle recorder test data is loaded
    And a BattleBuilder configured with a CombatRecorder
    When the builder builds the battle state
    Then the battle state should have a defined recorder
    And the recorder should be able to record entries

  Scenario: BattleState has no recorder when withRecorder is not called
    Given battle recorder test data is loaded
    And a BattleBuilder configured without a recorder
    When the builder builds the battle state
    Then the battle state recorder should be undefined
