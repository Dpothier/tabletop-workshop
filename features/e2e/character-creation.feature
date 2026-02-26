Feature: Character Creation Scene
  As a player
  I want to create a new character with a unique name
  So that I can customize my party for battle

  Scenario: Navigate to character creation from menu
    Given I am on the main menu
    When I click the Create Character button
    Then I should see the character creation scene
    And the name input field should be focused
    And the character name field should be empty

  @wip
  Scenario: Enter a valid character name and see preview
    Given I am on the character creation scene
    When I type "Archer" into the name field
    Then the name field should contain "Archer"
    And the token preview should show "A" as the first letter
    And the preview icon should be visible

  Scenario: Character name cannot exceed 20 characters
    Given I am on the character creation scene
    When I type "ThisNameIsWayTooLongToBeValid" into the name field
    Then the name field should contain exactly 20 characters
    And the remaining characters display should show "0"

  Scenario: Real-time character count shows remaining characters
    Given I am on the character creation scene
    When I type "Alice" into the name field
    Then the remaining characters display should show "15"
    When I clear the name field
    Then the remaining characters display should show "20"

  @wip
  Scenario: Empty name shows error when trying to proceed
    Given I am on the character creation scene
    And the name field is empty
    When I click the Continue button
    Then an error message should appear saying "Name is required"
    And I should remain on the character creation scene

  @wip
  Scenario: Duplicate name shows error when trying to proceed
    Given there is a character named "Barbarian" in storage
    And I am on the character creation scene
    When I type "Barbarian" into the name field
    And I click the Continue button
    Then an error message should appear saying "Name already taken"
    And I should remain on the character creation scene

  Scenario: Cancel button returns to menu
    Given I am on the character creation scene
    When I type "Wizard" into the name field
    And I click the Cancel button
    Then I should see the main menu

  @wip
  Scenario: Clear name clears the preview
    Given I am on the character creation scene
    When I type "Warrior" into the name field
    And the token preview should show "W" as the first letter
    And I clear the name field
    Then the token preview should be empty or hidden
    And the preview should reset

  @wip
  Scenario: Multiple valid character names with different first letters
    Given I am on the character creation scene
    When I type "Paladin" into the name field
    Then the token preview should show "P" as the first letter
    When I clear the name field
    And I type "Rogue" into the name field
    Then the token preview should show "R" as the first letter
    When I clear the name field
    And I type "Mage" into the name field
    Then the token preview should show "M" as the first letter

  @wip
  Scenario: Special characters in name are allowed
    Given I am on the character creation scene
    When I type "Sir-Kane" into the name field
    Then the name field should contain "Sir-Kane"
    And the token preview should show "S" as the first letter

  # Step 8.4: Character Creation - Attribute Allocation
  # All 4 attributes should be visible with +/- controls

  Scenario: Attribute allocation section is visible with all 4 attributes
    Given I am on the character creation scene
    When I enter a character name "TestWarrior"
    And I progress to the attribute allocation section
    Then all 4 attributes should be visible: STR, DEX, MND, SPR
    And each attribute should have increment and decrement buttons

  Scenario: Initial attribute values start at 1 with 8 points remaining
    Given I am on the character creation scene
    When I enter a character name "TestMage"
    And I progress to the attribute allocation section
    Then each attribute should have initial value of 1
    And the points remaining counter should display 8

  Scenario: Incrementing an attribute increases value and decreases points
    Given I am on the character creation scene
    When I enter a character name "TestKnight"
    And I progress to the attribute allocation section
    And I increment the STR attribute by 1
    Then the STR attribute value should be 2
    And the points remaining should decrease to 7

  Scenario: Decrementing an attribute decreases value and increases points
    Given I am on the character creation scene
    When I enter a character name "TestRogue"
    And I progress to the attribute allocation section
    And I increment the DEX attribute by 2
    And I decrement the DEX attribute by 1
    Then the DEX attribute value should be 2
    And the points remaining should be 7

  Scenario: Cannot increment attribute beyond maximum of 6
    Given I am on the character creation scene
    When I enter a character name "TestPaladin"
    And I progress to the attribute allocation section
    And I increment the MND attribute by 5
    Then the MND attribute value should be 6
    And the increment button for MND should be disabled

  Scenario: Cannot increment when no points remaining
    Given I am on the character creation scene
    When I enter a character name "TestArcher"
    And I progress to the attribute allocation section
    And I increment the STR attribute by 5
    And I increment the DEX attribute by 3
    Then the STR attribute value should be 6
    And the DEX attribute value should be 4
    And the points remaining should be 0
    And the increment button for STR should be disabled
    And the increment button for DEX should be disabled

  Scenario: Cannot decrement attribute below minimum of 1
    Given I am on the character creation scene
    When I enter a character name "TestBard"
    And I progress to the attribute allocation section
    Then the decrement button for each attribute should be disabled
    And each attribute is at minimum value of 1

  Scenario: Bead bag preview shows colored circles matching attribute values
    Given I am on the character creation scene
    When I enter a character name "TestWizard"
    And I progress to the attribute allocation section
    Then the bead bag preview should display colored circles
    And there should be 1 red circles for STR attribute value
    And there should be 1 green circles for DEX attribute value
    And there should be 1 blue circles for MND attribute value
    And there should be 1 white circles for SPR attribute value

  Scenario: Bead bag preview updates in real-time when attributes change
    Given I am on the character creation scene
    When I enter a character name "TestCleric"
    And I progress to the attribute allocation section
    And I increment the STR attribute to 3
    And I increment the DEX attribute to 2
    And I decrement the MND attribute from 1 (no change expected)
    Then the bead bag preview should display 3 red circles for STR
    And the bead bag preview should display 2 green circles for DEX
    And the bead bag preview should display 1 blue circles for MND
    And the bead bag preview should display 1 white circles for SPR

  # Step 8.5: Character Creation - Weapon Selection & Save

  Scenario: Weapon selection section shows all 4 weapons with stats
    Given I am on the character creation scene
    When I enter a character name "WeaponTest"
    And I progress to the attribute allocation section
    And I allocate all 8 remaining points to STR
    And I progress to the weapon selection section
    Then all 4 weapons should be displayed with their stats
    And each weapon should show power, agility, and range values

  Scenario: Selecting a weapon highlights it visually
    Given I am on the character creation scene
    When I enter a character name "SwordPick"
    And I progress to the attribute allocation section
    And I allocate all 8 remaining points to STR
    And I progress to the weapon selection section
    And I select the "Sword" weapon
    Then the "Sword" weapon should be visually highlighted
    And no other weapon should be highlighted

  Scenario: Save button is disabled when no weapon is selected
    Given I am on the character creation scene
    When I enter a character name "NoWeapon"
    And I progress to the attribute allocation section
    And I allocate all 8 remaining points to STR
    And I progress to the weapon selection section
    Then the save button should be disabled

  Scenario: Save button is enabled when weapon is selected
    Given I am on the character creation scene
    When I enter a character name "HasWeapon"
    And I progress to the attribute allocation section
    And I allocate all 8 remaining points to DEX
    And I progress to the weapon selection section
    And I select the "Axe" weapon
    Then the save button should be enabled

  Scenario: Saving a character stores it and returns to menu
    Given I am on the character creation scene
    When I enter a character name "SavedHero"
    And I progress to the attribute allocation section
    And I increment the STR attribute by 4
    And I increment the DEX attribute by 4
    And I progress to the weapon selection section
    And I select the "Spear" weapon
    And I click the save button
    Then I should see the main menu
    And the character "SavedHero" should exist in storage

  @wip
  Scenario: Edit mode pre-fills all fields with existing character data
    Given there is a character named "EditMe" in storage with weapon "sword" and attributes STR=3 DEX=2 MND=4 SPR=3
    And I am on the character creation scene in edit mode for "EditMe"
    Then the name field should contain "EditMe"
    And the weapon selection should show "Sword" as selected

  # Bug Fix: Visual Overlap and Layout Issues
  @bug-fix
  Scenario: The Character Name label should be hidden on the attribute allocation step
    Given I am on the character creation scene
    When I enter a character name "TestWarrior"
    And I progress to the attribute allocation section
    Then the "Character Name" label should not be visible in the Phaser scene

  @bug-fix
  Scenario: Continue button should not overlap with attribute rows
    Given I am on the character creation scene
    When I enter a character name "OverlapTest1"
    And I progress to the attribute allocation section
    Then the Continue button should be positioned below all attribute rows with sufficient margin

  @bug-fix
  Scenario: Save button should not overlap with weapon rows
    Given I am on the character creation scene
    When I enter a character name "OverlapTest2"
    And I progress to the attribute allocation section
    And I allocate all 8 remaining points to STR
    And I progress to the weapon selection section
    Then the Save button should be positioned below all weapon rows with sufficient margin

  @bug-fix
  Scenario: Bead Bag Preview title should not overlap with attribute rows
    Given I am on the character creation scene
    When I enter a character name "TestWarrior"
    And I progress to the attribute allocation section
    Then the Bead Bag Preview title should be positioned below all attribute rows

  @bug-fix
  Scenario: Bead preview should be visually centered in the canvas
    Given I am on the character creation scene
    When I enter a character name "TestWarrior"
    And I progress to the attribute allocation section
    Then the bead preview should be centered within the game canvas
