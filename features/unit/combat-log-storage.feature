Feature: Combat Log Storage Service
  As a battle system
  I need to save, load, and manage battle recordings in localStorage
  So that players can persist and retrieve combat replays

  # FR-MFG-64.6: saveToLocalStorage and loadFromLocalStorage

  Scenario: storage saveToLocalStorage stores a recording with id key
    Given the storage service with mock localStorage
    And a recording with id "replay-001" with a snapshot and 2 entries
    When I save the recording with id "replay-001"
    Then the recording should be stored in localStorage
    And the stored key should be "combat-recording-replay-001"

  Scenario: storage loadFromLocalStorage retrieves a stored recording
    Given the storage service with mock localStorage
    And a recording with id "battle-001" is stored
    When I load the recording with id "battle-001"
    Then the result should not be null
    And the loaded data should be valid

  Scenario: storage loadFromLocalStorage returns null for non-existent recording
    Given the storage service with mock localStorage
    When I try to load a non-existent recording with id "missing"
    Then the storage result should be null

  Scenario: storage round-trips: saveToLocalStorage then loadFromLocalStorage preserves data
    Given the storage service with mock localStorage
    And a recording with id "replay-test" with a snapshot and 3 entries
    When I save the recording to localStorage
    And I load the recording from localStorage
    Then the loaded snapshot should deep-equal the original snapshot
    And the loaded entries should deep-equal the original entries
    And the loaded entries should have same count as original

  # FR-MFG-64.7: listRecordings

  Scenario: storage listRecordings returns empty list for fresh storage
    Given the storage service with mock localStorage
    When I list all recordings
    Then the result should be an empty array

  Scenario: storage listRecordings returns summary with id, date, monster name, outcome
    Given the storage service with mock localStorage
    And a recording with id "fight-001" outcome "victory" and monster name "Goblin"
    And a recording with id "fight-002" outcome "defeat" and monster name "Ogre"
    When I list all recordings
    Then the result should have 2 summaries
    And summary 0 should have id "fight-001"
    And summary 0 should have monsterName "Goblin"
    And summary 0 should have outcome "victory"
    And summary 0 should have a date field
    And summary 1 should have id "fight-002"
    And summary 1 should have monsterName "Ogre"
    And summary 1 should have outcome "defeat"

  Scenario: storage listRecordings includes date in summary
    Given the storage service with mock localStorage
    And a recording with id "dated-battle" saved at known timestamp
    When I list all recordings
    Then summary 0 should have a date field
    And the date should be a number or ISO string
    And the date should be recent

  Scenario: storage listRecordings returns correct outcome from battle-end entry
    Given the storage service with mock localStorage
    And recordings with outcomes: "victory, defeat, victory"
    When I list all recordings
    Then all 3 summaries should have outcome matching their battle-end entries

  Scenario: storage listRecordings returns correct monster name from snapshot
    Given the storage service with mock localStorage
    And recordings with monster names: "Dragon, Troll, Lich"
    When I list all recordings
    Then all 3 summaries should have monsterName from snapshot

  # FR-MFG-64.8: deleteRecording

  Scenario: storage deleteRecording removes a recording from localStorage
    Given the storage service with mock localStorage
    And recordings with ids: "battle-a, battle-b, battle-c"
    When I delete recording with id "battle-b"
    Then the recording "battle-b" should no longer exist
    And the key "combat-recording-battle-b" should not be in localStorage
    And recordings "battle-a" and "battle-c" should still exist

  Scenario: storage deleteRecording reduces recording count
    Given the storage service with mock localStorage
    And 3 stored recordings
    When I delete one recording
    And I list all recordings
    Then the result should have 2 summaries

  Scenario: storage deleteRecording succeeds silently for non-existent id
    Given the storage service with mock localStorage
    And 1 stored recordings
    When I delete a non-existent recording
    Then storage no error should be thrown
    And the existing recording should still exist

  # FR-MFG-64.9: Integration scenarios

  Scenario: storage full workflow: save, list, load, delete
    Given the storage service with mock localStorage
    And a recording with id "workflow-test" outcome "victory" and monster name "Boss"
    When I list all recordings
    Then the result should have 1 summaries
    When I load the recording with id "workflow-test"
    Then the loaded data should be valid
    When I delete recording with id "workflow-test"
    And I list all recordings
    Then the result should be an empty array

  Scenario: storage preserves multiple recordings independently
    Given the storage service with mock localStorage
    And 3 recordings with different data
    When I save all 3 recordings
    And I load recording 0
    Then it should match the original recording 0
    When I load recording 1
    Then it should match the original recording 1
    When I load recording 2
    Then it should match the original recording 2

  Scenario: storage list includes all saved recordings
    Given the storage service with mock localStorage
    And I save 5 recordings
    When I list all recordings
    Then the result should have 5 summaries
    And each summary should have unique id
    And each summary should have monsterName
    And each summary should have outcome
