Feature: Quick Strike modifier on Attack action
  As a player with a light melee weapon
  I want to use the Quick Strike modifier on the Attack action
  So that I can reduce the time cost of my attack

  Scenario: Quick Strike reduces attack time cost by 1w
    When I load the attack action definition from YAML
    Then the attack quickStrike option should have a costModifier with time -1

  Scenario: Quick Strike costs 1 green bead
    When I load the attack action definition from YAML
    Then the attack quickStrike option should have cost green 1

  Scenario: Quick Strike can be paid with 1 windup stack
    When I load the attack action definition from YAML
    Then the attack quickStrike option should have alternativeCost windup 1

  Scenario: Quick Strike is only available for light melee weapons
    Given a quickStrike modifier configured on effect "attack-1" with light weapon condition
    And a main-hand weapon "Dagger" that grants modifier "quickStrike" with tags "light"
    When I resolve sourced options with condition filtering
    Then I should get 1 sourced quickStrike instance
    Given a quickStrike modifier configured on effect "attack-1" with light weapon condition
    And a main-hand weapon "Greatsword" that grants modifier "quickStrike" without light tag
    When I resolve sourced options with condition filtering
    Then I should get 0 sourced quickStrike instances

  Scenario: Quick Strike follows sourcing rules (1 usage per source)
    Given a quickStrike modifier configured on effect "attack-1" with light weapon condition
    And a main-hand weapon "Dagger" that grants modifier "quickStrike" with tags "light"
    And an accessory "Amulet of Speed" that grants modifier "quickStrike" with tags "light"
    When I resolve sourced options with condition filtering
    Then I should get 2 sourced quickStrike instances
    And quickStrike instance 1 should be sourced from "Dagger"
    And quickStrike instance 2 should be sourced from "Amulet of Speed"

  Scenario: Time cost cannot go below 1w
    When I apply quickStrike costModifier of -1 to base time cost 2
    Then the effective time cost should be 1
    When I apply quickStrike costModifier of -1 to base time cost 1
    Then the effective time cost should be 1
