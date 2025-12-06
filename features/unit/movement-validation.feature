Feature: Movement Validation
  As a game system
  I need to validate character movements
  So that players cannot move illegally

  Background:
    Given a movement validator with arena 8x8

  Scenario: Valid move within speed range
    Given a token at position 3,3
    When checking if move to 5,3 is valid with speed 3
    Then the move should be valid

  Scenario: Reject move exceeding speed
    Given a token at position 3,3
    When checking if move to 7,3 is valid with speed 3
    Then the move should be invalid

  Scenario: Reject move to same position
    Given a token at position 3,3
    When checking if move to 3,3 is valid with speed 3
    Then the move should be invalid

  Scenario: Reject move outside arena bounds
    Given a token at position 7,7
    When checking if move to 8,7 is valid with speed 3
    Then the move should be invalid

  Scenario: Reject move to negative coordinates
    Given a token at position 0,0
    When checking if move to -1,0 is valid with speed 3
    Then the move should be invalid

  Scenario: Reject move to occupied tile
    Given a token at position 3,3
    And another token at position 4,3
    When checking if move to 4,3 is valid with speed 3
    Then the move should be invalid

  Scenario: Accept diagonal move within Manhattan distance
    Given a token at position 3,3
    When checking if move to 4,5 is valid with speed 3
    Then the move should be valid

  Scenario: Reject diagonal move exceeding Manhattan distance
    Given a token at position 3,3
    When checking if move to 5,6 is valid with speed 3
    Then the move should be invalid

  Scenario: Get all valid moves for a token
    Given a token at position 1,1
    And another token at position 2,1
    When getting valid moves with speed 2
    Then the valid moves should not include 2,1
    And the valid moves should include 1,2
    And the valid moves should include 0,1
    And the valid moves should include 1,0

  Scenario: Check if position is occupied
    Given a token at position 3,3
    Then position 3,3 should be occupied
    And position 4,4 should not be occupied
