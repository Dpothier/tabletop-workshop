Feature: AnimationExecutor emits UI state events
  As a battle UI system
  I need AnimationExecutor to emit state change events to BattleStateObserver
  So that the UI automatically updates when animations execute

  # FR-1: Monster damage events
  Scenario: Monster damage event emits monsterHealthChanged
    Given an animation executor with a battle state observer
    And a subscriber listening to monsterHealthChanged events
    When the executor processes a damage event for monster with health 15 out of 20
    Then the subscriber should receive a monsterHealthChanged event with health 15 and max 20

  Scenario: Multiple monster damage events emit in sequence
    Given an animation executor with a battle state observer
    And a subscriber listening to monsterHealthChanged events
    When the executor processes a damage event for monster with health 18 out of 20
    And the executor processes a damage event for monster with health 12 out of 20
    Then the subscriber should receive a monsterHealthChanged event with health 18 and max 20
    And the subscriber should receive a monsterHealthChanged event with health 12 and max 20

  # FR-2: Hero damage events
  Scenario: Hero damage event emits heroHealthChanged
    Given an animation executor with a battle state observer
    And a subscriber listening to heroHealthChanged events
    When the executor processes a damage event for hero-1 with health 10 out of 15
    Then the subscriber should receive a heroHealthChanged event for hero-1 with health 10 and max 15

  Scenario: Multiple hero damage events with different heroes
    Given an animation executor with a battle state observer
    And a subscriber listening to heroHealthChanged events
    When the executor processes a damage event for hero-1 with health 8 out of 15
    And the executor processes a damage event for hero-2 with health 12 out of 20
    Then the subscriber should receive a heroHealthChanged event for hero-1 with health 8 and max 15
    And the subscriber should receive a heroHealthChanged event for hero-2 with health 12 and max 20

  Scenario: Hero takes multiple damage hits
    Given an animation executor with a battle state observer
    And a subscriber listening to heroHealthChanged events
    When the executor processes a damage event for hero-3 with health 20 out of 25
    And the executor processes a damage event for hero-3 with health 10 out of 25
    Then the subscriber should receive a heroHealthChanged event for hero-3 with health 20 and max 25
    And the subscriber should receive a heroHealthChanged event for hero-3 with health 10 and max 25

  # FR-3: Rest event bead changes
  Scenario: Rest event emits heroBeadsChanged with hero bead counts
    Given an animation executor with a battle state observer
    And a character with bead counts red=2 blue=1 green=3 white=0
    And a subscriber listening to heroBeadsChanged events
    When the executor processes a rest event for hero-1 with beads drawn
    Then the subscriber should receive a heroBeadsChanged event for hero-1 with beads red=2 blue=1 green=3 white=0

  Scenario: Rest event queries accessor for current bead state
    Given an animation executor with a battle state observer
    And hero-2 has bead counts red=1 blue=2 green=0 white=4
    And a subscriber listening to heroBeadsChanged events
    When the executor processes a rest event for hero-2 with beads drawn
    Then the subscriber should receive a heroBeadsChanged event for hero-2 with beads red=1 blue=2 green=0 white=4

  Scenario: Rest for different hero uses correct bead counts
    Given an animation executor with a battle state observer
    And hero-1 has bead counts red=3 blue=1 green=2 white=1
    And hero-2 has bead counts red=0 blue=0 green=1 white=5
    And a subscriber listening to heroBeadsChanged events
    When the executor processes a rest event for hero-1 with beads drawn
    And the executor processes a rest event for hero-2 with beads drawn
    Then the subscriber should receive a heroBeadsChanged event for hero-1 with beads red=3 blue=1 green=2 white=1
    And the subscriber should receive a heroBeadsChanged event for hero-2 with beads red=0 blue=0 green=1 white=5

  # FR-4: Bead draw event
  Scenario: Bead draw event emits monsterBeadsChanged with discarded counts
    Given an animation executor with a battle state observer
    And the monster has discarded bead counts red=1 blue=2 green=0 white=1
    And a subscriber listening to monsterBeadsChanged events
    When the executor processes a beadDraw event
    Then the subscriber should receive a monsterBeadsChanged event with beads red=1 blue=2 green=0 white=1

  Scenario: Multiple bead draw events emit in sequence
    Given an animation executor with a battle state observer
    And a subscriber listening to monsterBeadsChanged events
    And the monster has discarded bead counts red=2 blue=1 green=1 white=0
    When the executor processes a beadDraw event
    And the monster has discarded bead counts red=1 blue=0 green=2 white=1
    And the executor processes a beadDraw event
    Then the subscriber should receive 2 monsterBeadsChanged events

  # FR-5: Non-event-emitting animations
  Scenario: Move event does NOT emit state events
    Given an animation executor with a battle state observer
    And a subscriber listening to monsterHealthChanged and heroHealthChanged events
    When the executor processes a move event for hero-1
    Then the subscriber should not receive any state change events

  Scenario: Attack event does NOT emit state events
    Given an animation executor with a battle state observer
    And a subscriber listening to monsterHealthChanged and heroHealthChanged events
    When the executor processes an attack event
    Then the subscriber should not receive any state change events

  Scenario: StateChange event does NOT emit state events
    Given an animation executor with a battle state observer
    And a subscriber listening to monsterHealthChanged and heroHealthChanged events
    When the executor processes a stateChange event
    Then the subscriber should not receive any state change events

  # FR-6: Complex sequences
  Scenario: Mixed animation events emit correct events
    Given an animation executor with a battle state observer
    And a character with bead counts red=1 blue=1 green=1 white=1
    And the monster has discarded bead counts red=2 blue=0 green=1 white=2
    And a subscriber listening to all UI state events
    When the executor processes a move event for hero-1
    And the executor processes a damage event for hero-1 with health 5 out of 10
    And the executor processes an attack event
    And the executor processes a damage event for monster with health 8 out of 15
    And the executor processes a rest event for hero-1 with beads drawn
    And the executor processes a beadDraw event
    Then the subscriber should receive exactly 4 state change events
    And the subscriber should receive a heroHealthChanged event for hero-1 with health 5 and max 10
    And the subscriber should receive a monsterHealthChanged event with health 8 and max 15
    And the subscriber should receive a heroBeadsChanged event for hero-1 with beads red=1 blue=1 green=1 white=1
    And the subscriber should receive a monsterBeadsChanged event with beads red=2 blue=0 green=1 white=2
