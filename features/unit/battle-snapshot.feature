Feature: Battle Snapshot
  As a battle recording system
  I need to capture a complete snapshot of battle state
  So that I can save and restore battle progress for async play or playback

  Background:
    Given a snapshot arena of 9x9 named "Test Arena"
    And a battle grid of size 9x9
    And a snapshot action wheel
    And a snapshot character "hero-0" at position 2,3 with 15 health
    And a snapshot character "hero-1" at position 4,3 with 12 health
    And a snapshot monster "boss" at position 5,5 with 30 health
    And snapshot character "hero-0" has equipment slot "weapon" with id "sword-1"
    And snapshot character "hero-1" has equipment slot "armor" with id "plate-1"
    And snapshot character "hero-0" has available actions: "move, attack, rest"
    And snapshot character "hero-1" has available actions: "move, run, attack"
    And snapshot character "hero-0" has bead hand with counts: "red=2, blue=1, green=0, white=1"
    And snapshot character "hero-1" has bead hand with counts: "red=1, blue=2, green=1, white=0"
    And snapshot monster "boss" has bead bag with counts: "red=3, blue=2, green=1, white=2"
    And snapshot monster "boss" has state machine with states: "patrol, chase, attack"
    And the snapshot wheel has entries: "hero-0 at position 0, hero-1 at position 2, boss at position 4"
    And the following snapshot action definitions exist:
      | id     | name   | cost |
      | move   | Move   | 1    |
      | attack | Attack | 2    |
      | rest   | Rest   | 2    |

  # Criterion 1: All character positions
  Scenario: Snapshot captures all character positions from BattleGrid
    When I create a battle snapshot
    Then the snapshot should contain character "hero-0" at position 2,3
    And the snapshot should contain character "hero-1" at position 4,3

  # Criterion 2: Monster position, health, and state machine config
  Scenario: Snapshot captures monster position, health, and state machine config
    When I create a battle snapshot
    Then the snapshot should contain monster "boss" at position 5,5
    And the snapshot should show monster "boss" has health 30
    And the snapshot should include monster state machine config with states: "patrol, chase, attack"

  # Criterion 3: Bead pools (hand, bag, discard) for each entity
  Scenario: Snapshot captures bead pool, hand, and discard counts for each entity
    When I create a battle snapshot
    Then the snapshot should show character "hero-0" hand beads as: "red=2, blue=1, green=0, white=1"
    And the snapshot should show character "hero-1" hand beads as: "red=1, blue=2, green=1, white=0"
    And the snapshot should show character "hero-0" pool beads as: "red=3, blue=3, green=3, white=3"
    And the snapshot should show character "hero-0" discard beads as: "red=0, blue=0, green=0, white=0"
    And the snapshot should show monster "boss" bag beads as: "red=3, blue=2, green=1, white=2"

  # Criterion 4: Wheel positions and arrival orders
  Scenario: Snapshot captures wheel positions and arrival orders for all entities
    When I create a battle snapshot
    Then the snapshot should show "hero-0" at wheel position 0 with arrival order 0
    And the snapshot should show "hero-1" at wheel position 2 with arrival order 1
    And the snapshot should show "boss" at wheel position 4 with arrival order 2

  # Criterion 5: Character equipment and available action IDs
  Scenario: Snapshot captures character equipment and available action IDs
    When I create a battle snapshot
    Then the snapshot should show character "hero-0" with equipment: "weapon=sword-1"
    And the snapshot should show character "hero-1" with equipment: "armor=plate-1"
    And the snapshot should show character "hero-0" available actions: "move, attack, rest"
    And the snapshot should show character "hero-1" available actions: "move, run, attack"

  # Criterion 6: Arena dimensions and entity names
  Scenario: Snapshot captures arena dimensions and monster/character names
    When I create a battle snapshot
    Then the snapshot should include arena named "Test Arena" with dimensions 9x9
    And the snapshot should include character names: "hero-0, hero-1"
    And the snapshot should include monster name: "boss"

  # Criterion 7: JSON serializability (deep equality)
  Scenario: Snapshot output is JSON-serializable (JSON.parse(JSON.stringify(snapshot)) deep-equals original)
    When I create a battle snapshot
    Then the snapshot should be JSON serializable
    And JSON stringified snapshot should deep-equal original snapshot

  # Criterion 8: Human-readable names alongside IDs
  Scenario: Snapshot includes human-readable names alongside IDs
    When I create a battle snapshot
    Then the snapshot should include character "hero-0" with human-readable name "hero-0"
    And the snapshot should include character "hero-1" with human-readable name "hero-1"
    And the snapshot should include monster "boss" with human-readable name "boss"
    And the snapshot should map entity IDs to display names: "hero-0, hero-1, boss"
