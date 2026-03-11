Feature: Equipment Data System
  As a game designer
  I want to load and manage equipment data from YAML
  So that equipment can be configured without code changes

  # EquipmentLoader Scenarios

  Scenario: EquipmentLoader loads equipment definitions from YAML
    Given an EquipmentLoader with YAML equipment data
    When I load equipment definitions
    Then I should get a list of equipment definitions

  Scenario: EquipmentLoader returns equipment by ID
    Given an EquipmentLoader with YAML equipment data
    When I load equipment definitions
    And I retrieve equipment by ID "sword"
    Then I should get equipment with name "Sword"
    And the equipment should have power 1
    And the equipment should not be two-handed

  Scenario: EquipmentLoader fails gracefully for missing ID
    Given an EquipmentLoader with YAML equipment data
    When I load equipment definitions
    And I attempt to retrieve equipment by ID "nonexistent"
    Then an error should be thrown with message containing "not found"

  # Character Equipment Integration

  Scenario: Equipped character sees granted actions in available action IDs
    Given a battle grid of size 9x9
    And the equipment test character "hero-0" with 10 health at position 3,3
    And equipment "sword" with name "Sword" that grants action "attack"
    When the character equips equipment "sword"
    And I get the character's available action IDs
    Then the action IDs should include "attack"

  Scenario: Character with multiple equipped items sees all granted actions
    Given a battle grid of size 9x9
    And the equipment test character "hero-0" with 10 health at position 3,3
    And equipment "sword" with name "Sword" that grants action "attack"
    And equipment "shield" with name "Shield" that grants action "guard-stance"
    When the character equips equipment "sword"
    And the character equips equipment "shield"
    And I get the character's available action IDs
    Then the action IDs should include "attack"
    And the action IDs should include "guard-stance"

  # ModifierSourcing Integration

  Scenario: Modifier sourcing reads directly from EquipmentDefinition
    Given an EquipmentLoader with YAML equipment data
    When I load equipment definitions
    And I retrieve equipment by ID "sword"
    Then the equipment should have granted modifiers: "strength, quickStrike"
    And the equipment should have tags: "melee, light"

  Scenario: Two-handed weapon prevents off-hand equipment
    Given a battle grid of size 9x9
    And the equipment test character "hero-0" with 10 health at position 3,3
    And equipment "greatsword" with name "Greatsword" that is two-handed
    And equipment "sword" with name "Sword" that is not two-handed
    When the character equips equipment "greatsword" to main-hand
    And I attempt to equip equipment "sword" to off-hand
    Then the equip should fail with message "Cannot equip off-hand while wielding two-handed weapon"

  # Passive Stats Application

  Scenario: Shield passive stats are applied to character defense stats
    Given a battle grid of size 9x9
    And the equipment test character "hero-0" with 10 health at position 3,3
    And equipment "shield" with name "Shield" that has passive guard 1
    When the character equips equipment "shield"
    Then the character's guard should be 1

  Scenario: Multiple passive stats are applied correctly
    Given a battle grid of size 9x9
    And the equipment test character "hero-0" with 10 health at position 3,3
    And equipment "shield" with name "Shield" that has passive guard 1
    And equipment "armor" with name "Plate Armor" that has passive armor 2
    When the character equips equipment "shield"
    And the character equips equipment "armor"
    Then the character's guard should be 1
    And the character's armor should be 2

  # Equipment Tags and Filtering

  Scenario: Equipment tags are used for conditional option filtering
    Given an action with option "heavy-strike" that requires weaponTag "heavy"
    And equipment "greatsword" with name "Greatsword" that has tags: "melee, heavy"
    And the equipment grants modifier "heavy-strike"
    When I resolve sourced options for the equipment
    Then the option "heavy-strike" should be available

  Scenario: Missing weaponTag prevents option availability
    Given an action with option "heavy-strike" that requires weaponTag "heavy"
    And equipment "sword" with name "Sword" that has tags: "melee, light"
    And the equipment grants modifier "heavy-strike"
    When I resolve sourced options for the equipment
    Then the option "heavy-strike" should not be available

  # Equipment Loader and Character Integration

  Scenario: EquipmentLoader provides equipment for character equipping by weaponId
    Given an EquipmentLoader with YAML equipment data
    When I load equipment definitions
    And I retrieve equipment by ID "sword"
    And the equipment test character "hero-0" with 10 health at position 3,3
    And the character equips the retrieved equipment
    Then the character should have equipment in slot "main-hand"
    And the action IDs should include "attack"

  # Weapon Actions YAML

  Scenario: Weapon-specific actions exist in weapons.yaml
    Given a weapons action YAML file exists
    When I load weapon actions from the YAML
    Then I should get at least one action definition
    And the action should have an id property
