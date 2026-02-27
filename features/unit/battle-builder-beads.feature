Feature: Battle Builder Beads Integration
  As a battle system
  I need to create player characters with bead bags based on their attributes
  So that character stats directly determine bead composition STR to red, DEX to green, MND to blue, SPR to white

  # Scenario 1: Custom character attributes map to bead counts
  Scenario: Character with custom attributes has matching bead bag
    Given battle test data is loaded
    And character data with name "Warrior" and attributes STR=5, DEX=2, MND=2, SPR=3
    When the battle builder creates a battle with custom character data
    Then the character hand should have 3 beads
    And the bag plus hand total should be 5 red, 2 green, 2 blue, 3 white totaling 12

  # Scenario 2: Default characters have generic 3-3-3-3 beads
  Scenario: Default characters without CharacterData have 3-3-3-3 beads
    Given battle test data is loaded
    When the battle builder creates a battle without character data
    And each character hand should have 3 beads
    And each character bag plus hand total should be 3 red, 3 green, 3 blue, 3 white totaling 12

  # Scenario 3: Character name is preserved on entity
  Scenario: Character name from CharacterData is preserved on entity
    Given battle test data is loaded
    And character data with name "Paladin" and attributes STR=4, DEX=3, MND=4, SPR=4
    When the battle builder creates a battle with custom character data
    Then the character entity should have name "Paladin"

  # Scenario 4: Character attributes are preserved on entity
  Scenario: Character attributes from CharacterData are preserved on entity
    Given battle test data is loaded
    And character data with name "Rogue" and attributes STR=2, DEX=5, MND=3, SPR=3
    When the battle builder creates a battle with custom character data
    Then the character attributes should be STR=2, DEX=5, MND=3, SPR=3

  # Scenario 5: 3 beads drawn at battle start (unchanged behavior)
  Scenario: 3 beads are drawn to hand at battle start
    Given battle test data is loaded
    And character data with name "Knight" and attributes STR=4, DEX=2, MND=3, SPR=4
    When the battle builder creates a battle with custom character data
    Then the character hand should have 3 beads
    And the character bead bag should have 10 remaining beads out of 13 total

  # Scenario 6: Party of 2 characters with individual bags
  Scenario: Party of 2 characters each have correct individual bead bags
    Given battle test data is loaded
    And character data with name "Hero1" and attributes STR=4, DEX=2, MND=2, SPR=3
    And character data with name "Hero2" and attributes STR=2, DEX=4, MND=3, SPR=2
    When the battle builder creates a battle with 2 custom characters
    Then character "Hero1" entity should exist with name "Hero1"
    And character "Hero1" bag plus hand total should be 4 red, 2 green, 2 blue, 3 white totaling 11
    And character "Hero2" entity should exist with name "Hero2"
    And character "Hero2" bag plus hand total should be 2 red, 4 green, 3 blue, 2 white totaling 11
