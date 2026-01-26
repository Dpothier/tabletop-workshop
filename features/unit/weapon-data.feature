Feature: Weapon Data System
  As a game system
  I need to load and access weapon definitions
  So that characters can equip weapons with defined stats

  # Step 8.2: Starting Weapons Data

  Scenario: Load all weapons from data file
    Given the weapon data is loaded
    Then there should be 4 weapons available
    And the weapons should include Sword, Axe, Mace, and Spear

  Scenario: Get weapon by id - Sword
    Given the weapon data is loaded
    When I request the weapon with id "sword"
    Then I should receive a weapon with:
      | field    | value |
      | id       | sword |
      | name     | Sword |
      | category | melee |
      | power    | 1     |
      | agility  | 1     |
      | range    | 1     |

  Scenario: Get weapon by id - Axe
    Given the weapon data is loaded
    When I request the weapon with id "axe"
    Then I should receive a weapon with:
      | field    | value |
      | id       | axe   |
      | name     | Axe   |
      | category | melee |
      | power    | 2     |
      | agility  | 0     |
      | range    | 1     |

  Scenario: Get weapon by id - Mace
    Given the weapon data is loaded
    When I request the weapon with id "mace"
    Then I should receive a weapon with:
      | field    | value |
      | id       | mace  |
      | name     | Mace  |
      | category | melee |
      | power    | 1     |
      | agility  | 0     |
      | range    | 1     |

  Scenario: Get weapon by id - Spear
    Given the weapon data is loaded
    When I request the weapon with id "spear"
    Then I should receive a weapon with:
      | field    | value |
      | id       | spear |
      | name     | Spear |
      | category | melee |
      | power    | 1     |
      | agility  | 1     |
      | range    | 1-2   |

  Scenario: Get non-existent weapon returns undefined
    Given the weapon data is loaded
    When I request the weapon with id "non_existent"
    Then the requested weapon should be undefined

  Scenario: All weapons have required attributes
    Given the weapon data is loaded
    Then all weapons should have attributes: id, name, category, power, agility, range
