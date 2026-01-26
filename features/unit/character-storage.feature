Feature: Character Storage Service
  As a player
  I need to save, load, and manage character data
  So that I can create and reuse custom characters in battles

  # FR-8.1.1: CharacterData interface and default characters loading
  Scenario: Load four default characters at startup
    Given the character storage service is initialized
    When I get all characters
    Then the total character count should be 4
    And all loaded characters should have isDefault set to true
    And each character should have: id, name, attributes, weapon, createdAt, updatedAt

  # FR-8.1.2: Get all characters
  Scenario: Get all characters returns defaults and custom
    Given the character storage service is initialized
    And I save a custom character named "Barbarian" with attributes str=5, dex=1, mnd=1, spr=1
    When I get all characters
    Then the total character count should be 5
    And the custom character "Barbarian" should have isDefault set to false
    And the default characters should still be present

  # FR-8.1.3: Get character by ID
  Scenario: Get character by ID returns the correct character
    Given the character storage service is initialized
    And I save a custom character named "Sorcerer" with attributes str=1, dex=1, mnd=5, spr=1
    When I get the character by name "Sorcerer"
    Then the retrieved character should have name "Sorcerer"
    And the retrieved character mnd attribute should be 5
    And the retrieved character should have isDefault set to false

  Scenario: Get character by ID returns null for non-existent ID
    Given the character storage service is initialized
    When I try to get character by id "non-existent-id"
    Then the result should be null

  # FR-8.1.4: Save new character
  Scenario: Save a new character with auto-generated id
    Given the character storage service is initialized
    When I save a custom character named "Knight" with attributes str=4, dex=2, mnd=1, spr=1
    Then the saved character should have an auto-generated id
    And the saved character should have createdAt timestamp
    And the saved character should have updatedAt timestamp
    And the saved character should have isDefault set to false

  # FR-8.1.5: Update existing character
  Scenario: Update character modifies existing entry
    Given the character storage service is initialized
    And I save a custom character named "Ranger" with attributes str=2, dex=5, mnd=1, spr=1
    When I update the character "Ranger" to have str=3
    Then the character "Ranger" should now have str=3
    And the character "Ranger" should have the same id
    And the character "Ranger" createdAt should not change
    And the character "Ranger" updatedAt should be later than before

  # FR-8.1.6: Delete custom character
  Scenario: Delete custom character succeeds
    Given the character storage service is initialized
    And I save a custom character named "Paladin" with attributes str=3, dex=1, mnd=2, spr=2
    When I delete the character "Paladin"
    Then the character "Paladin" should no longer exist
    And the total character count should be 4

  # FR-8.1.7: Refuse to delete default characters
  Scenario: Delete default character throws error
    Given the character storage service is initialized
    When I try to delete a default character
    Then a storage error should be thrown with message "Cannot delete default character"

  # FR-8.1.8: Name uniqueness validation
  Scenario: Check if name is unique returns true for new name
    Given the character storage service is initialized
    When I check if "Barbarian" is a unique name
    Then the result should be true

  Scenario: Check if name is unique returns false for duplicate
    Given the character storage service is initialized
    And I save a custom character named "Rogue" with attributes str=2, dex=5, mnd=1, spr=1
    When I check if "Rogue" is a unique name
    Then the result should be false

  Scenario: Check name uniqueness with excludeId returns true
    Given the character storage service is initialized
    And I save a custom character named "Sorcerer" with attributes str=1, dex=1, mnd=5, spr=1
    When I check if "Sorcerer" is unique excluding its own id
    Then the result should be true

  Scenario: Check name uniqueness allows renaming if excluding own id
    Given the character storage service is initialized
    And I save a custom character named "Druid" with attributes str=1, dex=1, mnd=3, spr=3
    When I check if "Druid" is unique excluding the character's own id
    Then the result should be true
    And I can rename the character to "Druid" without conflict

  # FR-8.1.9: Maximum custom characters limit
  Scenario: Save up to 10 custom characters succeeds
    Given the character storage service is initialized
    When I save 10 custom characters
    Then all 10 custom characters should be saved
    And the total character count should be 14

  Scenario: Saving 11th custom character throws error
    Given the character storage service is initialized
    And I already have 10 custom characters
    When I try to save an 11th custom character
    Then a storage error should be thrown with message "Maximum 10 custom characters allowed"
    And the total character count should remain 14

  # FR-8.1.10: Character attributes structure
  Scenario: Character has all required attributes
    Given the character storage service is initialized
    When I save a custom character named "Cleric" with attributes str=2, dex=2, mnd=2, spr=2
    Then the saved character should have id
    Then the saved character should have name "Cleric"
    And the saved character should have str attribute = 2
    And the saved character should have dex attribute = 2
    And the saved character should have mnd attribute = 2
    And the saved character should have spr attribute = 2
    And the saved character should have weapon
    And the saved character should have isDefault = false
    And the saved character should have createdAt
    And the saved character should have updatedAt

  # FR-8.1.11: Storage persistence (localStorage)
  Scenario: Characters are persisted to localStorage
    Given the character storage service is initialized
    And I save a custom character named "Bard" with attributes str=1, dex=2, mnd=3, spr=2
    When I create a new service instance
    Then the new service should load the saved "Bard" character
    And the total character count should be 5

  # FR-8.1.12: Default characters loaded on fresh storage
  Scenario: Fresh storage loads all default characters
    Given a fresh character storage service with no prior data
    When I get all characters
    Then exactly 4 default characters should be loaded
    And each default character should have valid attributes
    And each default character should have a weapon assigned
