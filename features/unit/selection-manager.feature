Feature: Selection Manager
  As a UI system
  I need to manage character selection state and visual feedback
  So that the player knows which character is currently selected

  # FR-1: Selection State Management
  Scenario: Select a character updates selected ID
    Given a selection manager with visuals for "hero-1", "hero-2", and "monster"
    When I select character "hero-1"
    Then the selected character should be "hero-1"

  Scenario: Select a different character deselects previous selection
    Given a selection manager with visuals for "hero-1", "hero-2", and "monster"
    When I select character "hero-1"
    And I select character "hero-2"
    Then the selected character should be "hero-2"

  Scenario: Deselect clears selected ID
    Given a selection manager with visuals for "hero-1", "hero-2", and "monster"
    When I select character "hero-1"
    And I deselect
    Then the selected character should be null

  Scenario: Get selected returns current selection
    Given a selection manager with visuals for "hero-1" and "hero-2"
    When I select character "hero-1"
    Then getSelected should return "hero-1"

  Scenario: Get selected returns null when nothing selected
    Given a selection manager with visuals for "hero-1" and "hero-2"
    Then getSelected should return null

  # FR-2: Visual Feedback
  Scenario: Select calls setSelected(true) on visual
    Given a selection manager with visuals for "hero-1" and "hero-2"
    When I select character "hero-1"
    Then visual "hero-1" should have setSelected called with true

  Scenario: Select calls setSelected(false) on previous visual
    Given a selection manager with visuals for "hero-1" and "hero-2"
    When I select character "hero-1"
    And I select character "hero-2"
    Then visual "hero-1" should have setSelected called with false

  Scenario: Deselect calls setSelected(false) on current visual
    Given a selection manager with visuals for "hero-1" and "hero-2"
    When I select character "hero-1"
    And I deselect
    Then visual "hero-1" should have setSelected called with false

  # FR-3: Turn Validation
  Scenario: isCurrentActor returns true when IDs match
    Given a selection manager with visuals for "hero-1"
    When I check if "hero-1" is the current actor with currentActorId "hero-1"
    Then isCurrentActor should return true

  Scenario: isCurrentActor returns false when IDs don't match
    Given a selection manager with visuals for "hero-1" and "hero-2"
    When I check if "hero-1" is the current actor with currentActorId "hero-2"
    Then isCurrentActor should return false

  Scenario: isCurrentActor returns false when currentActorId is null
    Given a selection manager with visuals for "hero-1"
    When I check if "hero-1" is the current actor with currentActorId null
    Then isCurrentActor should return false

  Scenario: isCurrentActor returns false with different character ID
    Given a selection manager with visuals for "hero-1" and "monster"
    When I check if "hero-1" is the current actor with currentActorId "monster"
    Then isCurrentActor should return false
