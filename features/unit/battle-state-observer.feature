Feature: Battle State Observer
  As a UI system
  I need a central event hub for state changes
  So that UI components can react to game state updates

  # FR-1: Basic subscription and event emission
  Scenario: Subscribe and receive actorChanged event
    Given a battle state observer
    And I have subscribed to actorChanged events
    When the current actor changes to "hero-1"
    Then I should receive an actorChanged event for "hero-1"

  Scenario: Subscribe and receive actorChanged event with null
    Given a battle state observer
    And I have subscribed to actorChanged events
    When the current actor changes to null
    Then I should receive an actorChanged event for null

  # FR-2: Multiple subscribers
  Scenario: Multiple subscribers receive same event
    Given a battle state observer
    And I have subscribed to actorChanged events as subscriber 1
    And I have subscribed to actorChanged events as subscriber 2
    When the current actor changes to "hero-1"
    Then subscriber 1 should receive an actorChanged event for "hero-1"
    And subscriber 2 should receive an actorChanged event for "hero-1"

  Scenario: Multiple different subscribers receive different events
    Given a battle state observer
    And I have subscribed to actorChanged events as subscriber 1
    And I have subscribed to selectionChanged events as subscriber 2
    When the current actor changes to "hero-1"
    And a character "hero-2" is selected
    Then subscriber 1 should receive an actorChanged event for "hero-1"
    And subscriber 2 should receive a selectionChanged event for "hero-2"

  # FR-3: Partial subscribers ignore unsubscribed events
  Scenario: Partial subscriber ignores unsubscribed events
    Given a battle state observer
    And I have subscribed to actorChanged events
    When the current actor changes to "hero-1"
    And a character "hero-2" is selected
    Then I should receive an actorChanged event for "hero-1"
    And I should not receive a selectionChanged event

  Scenario: Partial subscriber with multiple events
    Given a battle state observer
    And I have subscribed to actorChanged and selectionChanged events
    When the current actor changes to "hero-1"
    And a character "hero-2" is selected
    And a monster health changes to current 15 and max 20
    Then I should receive an actorChanged event for "hero-1"
    And I should receive a selectionChanged event for "hero-2"
    And I should not receive a monsterHealthChanged event

  # FR-4: Unsubscribe functionality
  Scenario: Unsubscribe stops receiving events
    Given a battle state observer
    And I have subscribed to actorChanged events
    When I unsubscribe from actorChanged events
    And the current actor changes to "hero-1"
    Then I should not receive an actorChanged event

  Scenario: Unsubscribe doesn't affect other subscribers
    Given a battle state observer
    And I have subscribed to actorChanged events as subscriber 1
    And I have subscribed to actorChanged events as subscriber 2
    When I unsubscribe subscriber 1 from actorChanged events
    And the current actor changes to "hero-1"
    Then subscriber 1 should not receive an actorChanged event
    And subscriber 2 should receive an actorChanged event for "hero-1"

  # FR-5: Health change events
  Scenario: Test heroHealthChanged event with parameters
    Given a battle state observer
    And I have subscribed to heroHealthChanged events
    When hero "hero-1" health changes to current 18 and max 20
    Then I should receive a heroHealthChanged event for hero "hero-1" with health 18 out of 20

  Scenario: Multiple hero health change events
    Given a battle state observer
    And I have subscribed to heroHealthChanged events
    When hero "hero-1" health changes to current 18 and max 20
    And hero "hero-2" health changes to current 10 and max 15
    Then I should receive a heroHealthChanged event for hero "hero-1" with health 18 out of 20
    And I should receive a heroHealthChanged event for hero "hero-2" with health 10 out of 15

  # FR-6: Bead change events
  Scenario: Test heroBeadsChanged event with BeadCounts
    Given a battle state observer
    And I have subscribed to heroBeadsChanged events
    When hero "hero-1" beads change to red 2, blue 1, green 0, white 3
    Then I should receive a heroBeadsChanged event for hero "hero-1" with beads red=2 blue=1 green=0 white=3

  Scenario: Monster beads changed event
    Given a battle state observer
    And I have subscribed to monsterBeadsChanged events
    When monster beads change to red 1, blue 2, green 1, white 0
    Then I should receive a monsterBeadsChanged event with beads red=1 blue=2 green=1 white=0

  Scenario: Monster beads cleared
    Given a battle state observer
    And I have subscribed to monsterBeadsChanged events
    When monster beads change to null
    Then I should receive a monsterBeadsChanged event with null beads

  # FR-7: Wheel advancement events
  Scenario: Test wheelAdvanced event
    Given a battle state observer
    And I have subscribed to wheelAdvanced events
    When entity "hero-1" advances on the wheel to position 3
    Then I should receive a wheelAdvanced event for entity "hero-1" at position 3

  Scenario: Multiple wheel advancement events
    Given a battle state observer
    And I have subscribed to wheelAdvanced events
    When entity "hero-1" advances on the wheel to position 3
    And entity "monster" advances on the wheel to position 5
    Then I should receive a wheelAdvanced event for entity "hero-1" at position 3
    And I should receive a wheelAdvanced event for entity "monster" at position 5

  # FR-8: Complex scenarios
  Scenario: Full battle turn sequence with multiple events
    Given a battle state observer
    And subscriber 1 subscribes to actorChanged and wheelAdvanced events
    And subscriber 2 subscribes to heroHealthChanged events
    When the current actor changes to "hero-1"
    And entity "hero-1" advances on the wheel to position 1
    And hero "monster" health changes to current 15 and max 20
    Then subscriber 1 should receive an actorChanged event for "hero-1"
    And subscriber 1 should receive a wheelAdvanced event for entity "hero-1" at position 1
    And subscriber 2 should receive a heroHealthChanged event for hero "monster" with health 15 out of 20
    And subscriber 1 should not receive a heroHealthChanged event
