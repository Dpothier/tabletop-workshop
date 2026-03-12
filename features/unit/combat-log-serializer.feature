Feature: Combat Log JSONL Serialization
  As a battle recording system
  I need to serialize and deserialize combat logs to/from JSONL format
  So that I can save, load, and replay battle data

  # FR-MFG-64.1: toJSONL produces snapshot as first line

  Scenario: toJSONL produces first line as snapshot with type and version
    Given a serializer with a battle snapshot and entries
    When I serialize to JSONL
    Then the first line should be a snapshot JSON object
    And the snapshot line should have type "snapshot"
    And the snapshot line should have version 1
    And the snapshot line should contain arena name "Test"

  Scenario: toJSONL produces one CombatLogEntry per subsequent line
    Given a serializer with a battle snapshot and 3 entries
    When I serialize to JSONL
    Then the output should have 4 total lines
    And line 1 should be the snapshot
    And lines 2-4 should be combat log entries
    And each entry line should be valid JSON

  # FR-MFG-64.2: fromJSONL parses snapshot correctly

  Scenario: fromJSONL parses snapshot from first line correctly
    Given a serializer with a serialized JSONL battle
    When I deserialize the JSONL
    Then the result should have a snapshot object
    And the snapshot should have arena with name "Test"
    And the snapshot should have 2 characters
    And the snapshot should have 1 monster

  Scenario: fromJSONL parses all entries preserving types and field values
    Given a serializer with a serialized JSONL with mixed entry types
    When I deserialize the JSONL
    Then the result should have 4 entries
    And entry 0 should have type "turn-start"
    And parsed entry 0 should have seq 1
    And entry 0 should have actorId "hero-0"
    And entry 1 should have type "action-selected"
    And entry 1 should have actionId "attack"
    And entry 2 should have type "bead-spend"
    And entry 2 should have color "red"
    And entry 3 should have type "battle-end"
    And entry 3 should have outcome "victory"

  # FR-MFG-64.3: Round-trip serialization

  Scenario: fromJSONL round-trips: fromJSONL(toJSONL(data)) deep-equals original data
    Given a serializer with a battle snapshot and 5 entries
    When I serialize to JSONL
    And I deserialize the JSONL
    Then the round-tripped snapshot should deep-equal the original snapshot
    And the round-tripped entries should have same count as original
    And round-tripped entry 0 should deep-equal original entry 0
    And round-tripped entry 4 should deep-equal original entry 4

  Scenario: fromJSONL round-trips with complex entry data
    Given a serializer with entries containing nested objects
    When I serialize to JSONL
    And I deserialize the JSONL
    Then the round-tripped entries should preserve all nested field values
    And the round-tripped entries should have matching seq numbers

  # FR-MFG-64.4: Whitespace and empty lines

  Scenario: fromJSONL ignores empty lines
    Given a serializer with JSONL containing empty lines between entries
    When I deserialize the JSONL
    Then the result should have 3 entries
    And empty lines should be skipped
    And all parsed entries should be valid

  Scenario: fromJSONL handles trailing newlines
    Given a serializer with JSONL ending with multiple newlines
    When I deserialize the JSONL
    Then the result should have 2 entries
    And trailing newlines should not cause parsing errors

  # FR-MFG-64.5: Error handling

  Scenario: fromJSONL throws descriptive error if first line is not a snapshot
    Given a serializer with JSONL starting with regular entry
    When I try to deserialize the JSONL
    Then a serializer error should be thrown
    And the error message should mention "snapshot"
    And the error message should mention "first line"

  Scenario: fromJSONL throws error for invalid JSON line
    Given a serializer with JSONL containing malformed JSON
    When I try to deserialize the JSONL
    Then a serializer error should be thrown
    And the error should be descriptive

  Scenario: fromJSONL throws error if version mismatch
    Given a serializer with JSONL snapshot having version 2
    When I try to deserialize the JSONL
    Then a serializer error should be thrown
    And the error message should mention "version"
