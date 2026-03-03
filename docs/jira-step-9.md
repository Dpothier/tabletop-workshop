# Step 9 — Weapon System: Jira Stories

**Reference:** docs/PRD.md (Step 9 sections)
**Current state:** 4 standard melee weapons (Sword, Axe, Mace, Spear), old attack system (feint_attack, heavy_strike, precise_strike, power_attack), single weapon slot per character.

---

## Epic 1: Core Mechanics

Foundation systems that all weapons and actions depend on.

### 9.1.1 — Unified Attack System

**Type:** unit
**Blocked by:** none
**Tests:** unit only — Pure combat resolution logic; no specific weapon or UI exists yet to integration/E2E test against. Use mock weapon definitions in tests.

Replace old attack types (feint_attack, heavy_strike, precise_strike, power_attack) with single Attack action + modifier system.

**Acceptance Criteria:**
- Remove feint_attack, heavy_strike, precise_strike, power_attack from actions/core.yaml
- Attack (2w, P1, A1) is the only base attack action
- Modifiers can be declared when attacking (paid by bead or preparation)
- Each modifier adjusts attack stats (power, agility) or adds effects
- Weapon stats (power, agility, range) loaded from weapon definition and applied to Attack
- CombatResolver uses weapon stats instead of hardcoded action stats
- Existing standard weapon special actions (Sword: Percer/Parade/Riposte, Axe: Cleave/Sweep/Disarm, Mace: Crush/Knockback/Stun, Spear: Brace/Intercept/Thrust) remain functional as weapon-specific modifiers
- Unit tests: minimum 6 scenarios

### 9.1.2 — Preparation System

**Type:** unit
**Blocked by:** 9.1.1
**Tests:** unit only — Stacking rules, interruption conditions, and pairing are pure logic. No action wheel UI integration at this stage.

Generalize the concept of preparations with stacking rules, interruption conditions, and paired resolution.

**Acceptance Criteria:**
- Preparation base class with: stack count, paired action, interruption rules
- Windup preparation: 1w, max 1 stack, paired with Attack, pays 1 modifier bead cost
- Aim preparation: 1w, no stack limit, paired with Shoot, +1 Precision per stack
- Ponder preparation: 1w, no stack limit, paired with mental actions (Strategize, Assess, Overwrite)
- Channel preparation: 1w, no stack limit, paired with Cast, pays 1 spell bead cost
- Rest preparation: 2w, paired with next-turn draw, draw 2 beads at start of next turn
- All preparations lose ALL stacks on: taking damage, defensive reaction, unrelated action
- Windup is the ONLY preparation with a stack limit (max 1)
- Action wheel displays active preparation stacks on character
- Unit tests: minimum 8 scenarios

### 9.1.3 — Magical Combat Resolution

**Type:** unit
**Blocked by:** none
**Tests:** unit only — Intensity vs Ward is a calculation path in CombatResolver. No spells exist yet to test end-to-end.

Add Intensity vs Ward system for magical effects.

**Acceptance Criteria:**
- All spells have base Intensity = 1
- Any spell can pay +1 bead (spell's color) to increase Intensity by 1
- Magical effects only manifest on enemy targets when Intensity > Ward (strictly greater)
- Ward is a defense stat on all entities (default 0 for most creatures)
- Allied targets can voluntarily accept magical effects (skip Ward check) or resist normally
- CombatResolver handles magical resolution path (Intensity vs Ward) separately from physical (Power vs Defense) and ranged (Precision vs Difficulty)
- Unit tests: minimum 6 scenarios

### 9.1.4 — Status Effects: Burn

**Type:** unit
**Blocked by:** none
**Tests:** unit only — Status tracking and end-of-round damage resolution. No weapon applies burn yet.

Implement the Burn/Ignite status effect triggered at end of round.

**Acceptance Criteria:**
- Burn status effect on entities: tracks number of burn stacks
- All burn damage resolves simultaneously at end of round (when action wheel crosses segment 0)
- Each burn stack deals 1 damage at end of round
- Burn stacks are consumed after dealing damage (one-time effect, not persistent)
- Visual indicator on burning entities
- Bleed (already defined in PRD) follows same end-of-round pattern but persists until cured
- Unit tests: minimum 4 scenarios

### 9.1.5 — Stabilize Mechanic

**Type:** unit
**Blocked by:** none
**Tests:** unit only — Hand size formula and wound tracking are pure calculations. No heal spell exists yet to trigger stabilization.

Decouple hand size from HP via wound stabilization.

**Acceptance Criteria:**
- Entity tracks: current HP, max HP, stabilized wounds count
- Hand size = max HP - wounds + stabilized wounds, minimum 0
- Wounds = max HP - current HP
- Example: character at 3/5 HP with 0 stabilized wounds → hand size = 5 - 2 + 0 = 3
- Example: character at 3/5 HP with 2 stabilized wounds → hand size = 5 - 2 + 2 = 5
- Example: character at 1/5 HP with 2 stabilized wounds → hand size = 5 - 4 + 2 = 3
- Stabilizing a wound does NOT restore HP
- Character still dies at 0 HP regardless of stabilized wounds
- When character takes damage, hand size decreases immediately (excess beads discarded)
- UI displays current hand size, wounds, and stabilized wounds distinctly
- Unit tests: minimum 5 scenarios

### 9.1.6 — Ranged Combat System

**Type:** unit
**Blocked by:** 9.1.2
**Tests:** unit only — Precision vs Difficulty resolution and range band calculations. No ranged weapon data defined yet.

Implement Aim/Shoot/Precision/Difficulty resolution system.

**Acceptance Criteria:**
- Shoot action (2w): fires weapon, consumes all Aim stacks
- Precision = Base (1) + Range Band Modifier + Aim stacks
- Difficulty = Cover + Guard + max(Armor - Penetration, 0)
- Precision > Difficulty → hit (1 damage), otherwise miss
- Range bands defined per weapon: 1-6, 7-12, 13+
- Aim modifiers: Quick Aim (1 Green), Strong Draw (1 Red, Longbow only), Steady Aim (1 Blue, Crossbow/Arquebus only)
- No Evasion check for ranged (cannot dodge projectiles)
- Unit tests: minimum 6 scenarios

### 9.1.7 — Cast/Channel System

**Type:** unit
**Blocked by:** 9.1.2, 9.1.3
**Tests:** unit only — Cast resolution and Channel substitution logic. No spell data exists yet. Uses mock spell definitions in tests.

Implement Cast action and Channel preparation integration for magical weapons.

**Acceptance Criteria:**
- Cast action (2w): resolves a spell from equipped magical weapon
- Channel stacks substitute for spell bead cost at 1:1 ratio
- Spell enhancements selectable at cast time (like Power Attack options)
- Intensity system: base 1, +1 per extra bead (spell's color)
- Ward check on each affected enemy target
- Ally targets can voluntarily accept or resist
- Unit tests: minimum 5 scenarios

---

## Epic 2: Universal Actions

Actions available to all characters, built on Core Mechanics.

### 9.2.1 — Strength

**Type:** unit
**Blocked by:** 9.1.1, 9.1.2
**Tests:** unit only — Modifier application and Windup payment logic. No weapon equipped to trigger a real attack flow yet.

Universal attack modifier: +1 Power.

**Acceptance Criteria:**
- Strength is an attack modifier declared during Attack
- Cost: 1 Red bead OR 1 Windup stack
- Effect: +1 Power on this attack
- Available to all melee weapons
- Stacks with other modifiers (each costs separately)
- Unit tests: minimum 3 scenarios

### 9.2.2 — Guard

**Type:** unit
**Blocked by:** none
**Tests:** unit only — Guard persistence timing and stacking calculation. No battle UI triggers Guard at this stage.

Universal defensive action: +1 Guard until next turn.

**Acceptance Criteria:**
- Guard is a standalone action (not a reaction)
- Cost: 1 Red bead
- Effect: +1 Guard persisting until character's next turn on action wheel
- Available to all characters regardless of weapon
- Cannot be paid via Windup (defense must be instant)
- Guard stacks with passive Guard from armor/shield
- Unit tests: minimum 3 scenarios

### 9.2.3 — Quick Strike

**Type:** unit
**Blocked by:** 9.1.1, 9.1.2
**Tests:** unit only — Wheel cost reduction and light-weapon-only restriction. Requires light weapon to exist (Epic 3) for integration testing.

Attack modifier for light weapons: -1w on Attack.

**Acceptance Criteria:**
- Quick Strike is an attack modifier declared during Attack
- Cost: 1 Green bead OR 1 Windup stack
- Effect: Attack cost reduced by 1w (2w → 1w)
- Available to light melee weapons ONLY
- CAN be combined with additional modifiers (each extra modifier costs a bead)
- Unit tests: minimum 3 scenarios

### 9.2.4 — Strategize

**Type:** unit
**Blocked by:** 9.1.2
**Tests:** unit only — Draw 4 / keep 3 / return 1 logic and Ponder payment. Bead draw UI not yet adapted.

Rest modifier: improved bead draw quality.

**Acceptance Criteria:**
- Strategize is a modifier on the Rest action
- Cost: 1 Blue bead OR 1 Ponder stack
- Effect: during Rest, draw 4 beads total, keep 3, return 1 to bag
- Without Strategize, Rest draws 2 beads (unchanged)
- UI shows the 4 drawn beads and allows player to choose which 1 to return
- Unit tests: minimum 3 scenarios

### 9.2.5 — Assess

**Type:** unit
**Blocked by:** 9.1.2
**Tests:** unit only — Reveal logic, Cunning cost calculation per last action, range validation. Monster action graph needed for integration testing.

Reveal monster's next action. Cost modified by Cunning value of monster's last action.

**Acceptance Criteria:**
- Assess is a standalone action: 1w wheel cost + 1 Blue bead or Ponder stack
- Range: 1-6 tiles to target monster
- Effect: reveals the monster's next drawn bead and resulting action from its action graph
- Information is public (visible to all players)
- Cunning is a per-action attribute in the monster's action graph (not a global monster stat)
- The Cunning value of the monster's LAST COMPLETED action determines the additional Assess cost
- Cost increases by Cunning X of last action: X additional Blue beads (or Ponder stacks)
- A monster that hasn't acted yet has Cunning 0
- Revealed information persists visually until the monster acts
- Unit tests: minimum 5 scenarios

### 9.2.6 — Resist

**Type:** unit
**Blocked by:** 9.1.3
**Tests:** unit only — Ward boost and stacking with innate Ward. No spell targets characters yet.

Defensive reaction against magical attacks: +1 Ward.

**Acceptance Criteria:**
- Resist is a defensive reaction (triggers when targeted by magical effect)
- Cost: 1 White bead
- Effect: +1 Ward against the current magical effect
- Available to all characters
- Ward from Resist stacks with innate Ward
- Unit tests: minimum 3 scenarios

### 9.2.7 — Coordinate

**Type:** unit
**Blocked by:** 9.1.2
**Tests:** unit only — Preparation transfer logic and range check. No ally interaction UI at this stage.

Give a preparation stack to an ally.

**Acceptance Criteria:**
- Coordinate is a standalone action: 1w wheel cost + 1 White bead
- Range: 1-6 tiles to target ally
- Effect: grant target 1 preparation stack of their choice (Windup or Aim)
- Standard preparation interruption rules apply to the granted stack
- The ally decides which preparation type when receiving the stack
- Unit tests: minimum 3 scenarios

---

## Epic 3: Weapons

Individual weapons grouped by category. Each story implements one weapon's data definition, special actions, and integration with the combat system.

### Light Melee

All light melee weapons share: Power 1, Agility 1, Range 1, Quick Strike access, 2 special actions.

#### 9.3.1 — Rondel Dagger

**Type:** unit
**Blocked by:** 9.2.3
**Tests:** unit + integration — Unit: Percer condition check, Parade Guard boost. Integration: full attack flow with Rondel Dagger equipped against mock targets.

**Special Actions:**
- Percer (Attack Modifier, 1 Green): Target Guard=0 AND Evasion=0 → attack ignores Armor
- Parade (Defensive Reaction, 1 Red): +1 Guard against current attack

**Acceptance Criteria:**
- Weapon defined in data with correct stats and category "light"
- Percer modifier checks target Guard and Evasion conditions
- Parade reaction triggers when wielder is attacked
- Both actions integrate with unified attack/reaction system
- Unit + integration tests: minimum 3 scenarios

#### 9.3.2 — Throwing Dagger

**Type:** unit
**Blocked by:** 9.2.3
**Tests:** unit + integration — Unit: weapon drop/recovery state tracking. Integration: Throw attack flow including weapon state change and recovery.

**Special Actions:**
- Throw (Action, 1 Green, 2w): Ranged attack range 1-6, P1 A1. On hit: weapon dropped on target tile. On dodge: weapon lands at max trajectory. Wielder loses weapon access until recovery.
- Parade (Defensive Reaction, 1 Red): +1 Guard against current attack

**Acceptance Criteria:**
- Throw creates a ranged attack from a melee weapon
- Weapon tracks "dropped" state and tile location
- Wielder cannot Attack/Quick Strike/Parade while weapon is dropped
- Weapon can be recovered by moving to its tile
- Unit + integration tests: minimum 4 scenarios

#### 9.3.3 — Slicing Dagger

**Type:** unit
**Blocked by:** 9.2.3, 9.1.4
**Tests:** unit + integration — Unit: Bleed application and Slash modifier. Integration: attack → Bleed → end-of-round damage chain.

**Special Actions:**
- Lacerate (Attack Modifier, 1 Green): On hit, target gains Bleed (1 damage per round end)
- Slash (Attack Modifier, 1 Red): +1 Agility on this attack

**Acceptance Criteria:**
- Lacerate applies Bleed status on successful hit
- Bleed persists and stacks per PRD rules
- Slash agility bonus applied in combat resolution
- Unit + integration tests: minimum 3 scenarios

#### 9.3.4 — Hatchet

**Type:** unit
**Blocked by:** 9.2.3
**Tests:** unit + integration — Unit: Chop modifier (+1P/-1A). Integration: Throw mechanic shared with Throwing Dagger.

**Special Actions:**
- Throw (Action, 1 Green, 2w): Same as Throwing Dagger throw mechanic
- Chop (Attack Modifier, 1 Red): +1 Power, but -1 Agility on this attack

**Acceptance Criteria:**
- Throw shares mechanics with Throwing Dagger (weapon drop, recovery)
- Chop modifies both Power (+1) and Agility (-1)
- Unit + integration tests: minimum 3 scenarios

### Heavy Melee

All heavy melee weapons: two-handed, high Power, Windup synergy, 3 special actions.

#### 9.3.5 — Greatsword

**Type:** unit
**Blocked by:** 9.2.1, 9.1.2
**Tests:** unit + integration — Unit: special action modifiers, two-handed restriction. Integration: Windup → Attack flow with greatsword modifiers.

**Acceptance Criteria:**
- Weapon defined with correct stats, category "heavy", two-handed flag
- All special actions from PRD implemented (see PRD Heavy Melee section)
- Two-handed restriction enforced: cannot equip shield or off-hand
- Windup integration for modifier payment
- Unit + integration tests: minimum 4 scenarios

#### 9.3.6 — Maul

**Type:** unit
**Blocked by:** 9.2.1, 9.1.2
**Tests:** unit + integration — Unit: special action modifiers, two-handed restriction. Integration: Windup → Attack flow with maul modifiers.

**Acceptance Criteria:**
- Weapon defined with correct stats, category "heavy", two-handed flag
- All special actions from PRD implemented (see PRD Heavy Melee section)
- Two-handed restriction enforced
- Windup integration for modifier payment
- Unit + integration tests: minimum 4 scenarios

### Ranged

#### 9.3.8 — Longbow

**Type:** unit
**Blocked by:** 9.1.6
**Tests:** unit + integration — Unit: range bands, Strong Draw modifier. Integration: Aim → Shoot flow with range band resolution.

**Acceptance Criteria:**
- Stats: Penetration 0, range bands per PRD
- Two-handed
- Strong Draw modifier available
- All special actions from PRD implemented
- Unit + integration tests: minimum 3 scenarios

#### 9.3.9 — Crossbow

**Type:** unit
**Blocked by:** 9.1.6
**Tests:** unit + integration — Unit: Load requirement, Steady Aim. Integration: Load → Aim → Shoot cycle.

**Acceptance Criteria:**
- Stats: Penetration 1, range bands per PRD
- Load action (1w) required before each Shoot
- Steady Aim modifier available
- All special actions from PRD implemented
- Unit + integration tests: minimum 3 scenarios

#### 9.3.10 — Pistol

**Type:** unit
**Blocked by:** 9.1.6
**Tests:** unit + integration — Unit: Reload tracking, one-handed flag. Integration: Shoot → Reload cycle with range resolution.

**Acceptance Criteria:**
- Stats: Penetration 1, range bands per PRD
- Reload action (2w) required after each Shoot
- One-handed
- All special actions from PRD implemented
- Unit + integration tests: minimum 3 scenarios

#### 9.3.11 — Arquebus

**Type:** unit
**Blocked by:** 9.1.6
**Tests:** unit + integration — Unit: Penetration 2, Steady Aim, Reload. Integration: full ranged cycle with high penetration.

**Acceptance Criteria:**
- Stats: Penetration 2, range bands per PRD
- Reload action (2w) required after each Shoot
- Two-handed
- Steady Aim modifier available
- All special actions from PRD implemented
- Unit + integration tests: minimum 3 scenarios

### Defensive — Shields

#### 9.3.12 — Shield System

**Type:** unit
**Blocked by:** 9.2.2
**Tests:** unit + integration — Unit: Block reaction, passive Guard, off-hand slot validation. Integration: attack received → Block → Guard applied in combat resolution.

Implement shared shield mechanics: Block reaction, passive Guard, off-hand slot.

**Acceptance Criteria:**
- Block reaction (1 any-color bead): +1 Guard against current attack
- Passive Guard stat on shields applied to defense calculation
- Shields occupy off-hand slot
- Shield + one-handed weapon combination enforced
- Unit + integration tests: minimum 4 scenarios

#### 9.3.13 — Buckler

**Type:** unit
**Blocked by:** 9.3.12
**Tests:** unit + integration — Unit: Riposte trigger and direct damage. Integration: attack → Block → Riposte counter-damage flow.

**Acceptance Criteria:**
- Stats: 1 slot, passive Guard 0
- Block + Riposte (1 Green, on guarded attack → 1 direct damage to attacker)
- Unit + integration tests: minimum 3 scenarios

#### 9.3.14 — Shield

**Type:** unit
**Blocked by:** 9.3.12
**Tests:** unit + integration — Unit: passive Guard +1, Rebuke push distance. Integration: attack → Block → Rebuke push with Guard vs Power calculation.

**Acceptance Criteria:**
- Stats: 2 slots, passive Guard +1
- Block + Rebuke (1 Red, on guarded attack → push attacker, distance = Guard - Power)
- Unit + integration tests: minimum 3 scenarios

#### 9.3.15 — Great Shield

**Type:** unit
**Blocked by:** 9.3.12
**Tests:** unit + integration — Unit: attack restriction, Shield Wall range. Integration: multi-action defense flow (Block + Great Guard + Shield Wall).

**Acceptance Criteria:**
- Stats: 3 slots, passive Guard +1, CANNOT attack
- Block + Great Guard (1 Red, +1 Guard) + Rebuke + Shield Wall (1 Red, adjacent ally attacked → +1 Guard to ally)
- Two-hand restriction: wielder cannot attack with main hand
- Unit + integration tests: minimum 4 scenarios

### Support — Off-Hand

#### 9.3.16 — Banner

**Type:** unit
**Blocked by:** 9.2.7, 9.1.2
**Tests:** unit + integration — Unit: Rally interruption prevention, Inspire Guard boost. Integration: ally attacked → Inspire reaction → Guard applied in combat resolution.

**Special Actions:**
- Rally (Reaction, 1 White, range 1-6): Protect ally's preparation stacks from interruption
- Inspire (Reaction, 1 White, range 1-6): +1 Guard to attacked ally

**Acceptance Criteria:**
- Off-hand item, combinable with one-handed main weapon
- Rally triggers when ally would lose prep stacks, preserves them
- Inspire triggers when ally is attacked, grants +1 Guard
- Both are reactions (no wheel cost)
- Range 1-6 enforced
- Unit + integration tests: minimum 4 scenarios

#### 9.3.17 — Horn

**Type:** unit
**Blocked by:** 9.2.7, 9.1.2
**Tests:** unit + integration — Unit: Ponder check, bead transfer. Integration: holder Ponder → ally turn → Command bead usage → Ponder consumed.

**Special Actions:**
- Command (Coordinate variant): While Horn holder has Ponder stack, any ally in range 1-6 may use one bead from holder's hand for any purpose. Consumes Ponder.

**Acceptance Criteria:**
- Off-hand item
- Command checks for active Ponder stack on holder
- Any ally in range can trigger Command on their turn
- Bead is removed from holder's hand and applied to ally's action
- Ponder stack consumed on use
- Unit + integration tests: minimum 4 scenarios

#### 9.3.18 — Tome

**Type:** unit
**Blocked by:** 9.2.5, 9.1.2
**Tests:** unit + integration — Unit: Bestiary aura range, Cunning reduction, Ponder preservation on Assess. Integration: Ponder → Assess (no Ponder break) → Overwrite on monster reveal.

**Special Actions:**
- Bestiary (Passive while Ponder held): Allies in range 6 reduce Assess Cunning cost by 1; Tome holder can Assess without breaking Ponder
- Overwrite (Reaction, 3 Blue where Ponder substitutes 1, range 1-6): Cancel monster bead draw, force redraw

**Acceptance Criteria:**
- Off-hand item
- Bestiary aura active while Ponder stack maintained (not consumed)
- Assess action does not break Ponder for Tome holder specifically
- Cunning reduction applied to allies' Assess Cunning cost (per last action)
- Overwrite triggers on monster bead reveal, cancels draw, returns bead to bag, redraws
- Overwrite cost: 3 Blue beads, Ponder stack can pay for 1 (consuming it)
- Unit + integration tests: minimum 5 scenarios

#### 9.3.19 — Censer

**Type:** unit
**Blocked by:** 9.2.7
**Tests:** unit + integration — Unit: Gold bead creation and wildcard spending. Integration: Bless → Gold bead used as color → Renew on ally Rest.

**Special Actions:**
- Bless (Coordinate variant, 1w + 1 White, range 1-6): Grant ally a Gold bead (wildcard, counts as any color)
- Renew (Reaction, 1 White, range 1-6): When ally's Rest resolves, they draw 1 additional bead

**Acceptance Criteria:**
- Off-hand item
- Bless creates a Gold bead in target ally's hand
- Gold bead can be spent as any single color for any bead cost
- Renew triggers at start of ally's turn when their Rest resolves
- Renew adds 1 bead drawn from ally's own bag
- Unit + integration tests: minimum 4 scenarios

### Magical

#### 9.3.21 — Hourglass of Time

**Type:** unit
**Blocked by:** 9.1.7
**Tests:** unit + integration — Unit: advance/delay calculation, AoE targeting. Integration: Channel → Cast → action wheel position changes verified.

**Spell:** Temporal Shift — advance OR delay targets on action wheel.

**Acceptance Criteria:**
- Base: Cast (2w) + 1B = advance/delay 1 adjacent target by 1w
- Enhancement: AoE 3×3 (+1B), AoE 5×5 (+1B), effect 1w→2w (+1B)
- AoE centered on caster, affects ALL entities (allies + enemies)
- Choice of advance/delay made at cast time, applies to all targets
- Ward check on unwilling targets
- Action wheel positions updated correctly
- Unit + integration tests: minimum 5 scenarios

#### 9.3.22 — Phoenix Heart

**Type:** unit
**Blocked by:** 9.1.7, 9.1.4, 9.1.5
**Tests:** unit + integration — Unit: Stabilize wound, burst targeting, Ignite application. Integration: Cast → Stabilize + Burst + Burn → end-of-round burn resolves.

**Spell:** Phoenix Rebirth — heal ally + fire burst.

**Acceptance Criteria:**
- Base: Cast (2w) + 1W = stabilize 1 wound on 1 adjacent ally
- Enhancement: Phoenix Burst (+1W, 1 damage to all adjacent to target), Ignite (+1W, burn at end of round), Range (+1W, range 1-6)
- Fire burst targets all creatures adjacent to the HEALED ALLY (not the caster)
- Burn damage at end of round per status effect system
- Ward check on enemy targets for burst/ignite
- Ally targets can accept fire voluntarily or resist
- Stabilize integrates with hand size system
- Unit + integration tests: minimum 5 scenarios

#### 9.3.23 — Warping Stone

**Type:** unit
**Blocked by:** 9.1.7
**Tests:** unit + integration — Unit: teleport validation (empty tile, obstacle bypass), enhancement combos. Integration: Cast → teleport/swap with Ward checks.

**Spell:** Warp — teleportation with combinable enhancements.

**Acceptance Criteria:**
- Base: Cast (2w) + 1B = teleport self to empty tile within range 6 (ignores obstacles)
- Enhancement: Swap (+1B, target creature swap positions), Other (+1B, teleport adjacent creature instead), Extended selection (+1B, other target range 6), Extended range (+1B, destination range 12)
- All enhancements freely combinable
- Ward check on unwilling enemy targets
- Teleportation ignores obstacles and creatures in path
- Unit + integration tests: minimum 5 scenarios

#### 9.3.24 — Tear of Light

**Type:** unit
**Blocked by:** 9.1.7
**Tests:** unit + integration — Unit: zone creation, enemy push, breach cost. Integration: Cast → zone active → enemy movement blocked → Channel maintenance → zone collapse.

**Spell:** Sanctuary — sustained luminous barrier.

**Acceptance Criteria:**
- Base: Cast (2w) + 1W = create 3×3 barrier zone centered on caster
- Enhancement: zone 5×5 (+1W), zone 7×7 (+1W)
- On cast: push all enemies to nearest edge, collision damage if blocked
- Enemies cannot enter zone while active
- Breach attempt by enemy: caster pays 2 (Channel stacks + White beads mix) to repel
- Zone persists while caster has ≥1 Channel stack
- Zone drops on: 0 Channel stacks, non-Channel action, damage, defensive reaction
- Caster CAN Channel while zone is active (replenishes maintenance pool)
- Zone moves with caster if caster is displaced by external effect
- Unit + integration tests: minimum 6 scenarios

---

## Epic 4: Character Creation Integration

### 9.4.1 — Equipment Slot System

**Type:** e2e
**Blocked by:** 9.3.12, 9.3.16
**Tests:** unit + e2e — Unit: slot validation logic (two-handed blocks off-hand, etc.). E2E: character creation UI enforces slot compatibility.

Implement main hand + off-hand equipment slots.

**Acceptance Criteria:**
- Character has two equipment slots: main hand, off-hand
- Main hand: any one-handed weapon OR two-handed weapon
- Off-hand: shield OR support item (only if main hand is one-handed)
- Two-handed weapons (heavy melee, longbow, arquebus) block off-hand slot
- Great Shield blocks main hand from attacking
- Equipment slot validation enforced in character data model
- Unit + E2E tests: minimum 4 scenarios

### 9.4.2 — Weapon Selection in Character Creation

**Type:** e2e
**Blocked by:** 9.4.1
**Tests:** e2e — Full character creation flow: select category → pick weapon → equip off-hand → validate restrictions in UI.

All new weapons selectable during character creation.

**Acceptance Criteria:**
- Character creation UI shows all weapon categories
- Weapons grouped by category with stats displayed
- Main hand and off-hand selection with compatibility validation
- Two-handed weapons disable off-hand selection
- Default characters updated: Warrior (sword+shield), Mage (staff → appropriate magical weapon), Rogue (dagger+buckler?), Cleric (mace+censer?)
- E2E tests: minimum 4 scenarios

### 9.4.3 — Final Integration & Polish

**Type:** e2e
**Blocked by:** all previous stories
**Tests:** e2e — Complete flow: Menu → Create Character (weapon selection) → Battle (weapon actions functional). Regression suite for all existing tests.

Complete flow validation and polish.

**Acceptance Criteria:**
- Full flow: Menu → Create Character (with weapon selection) → Battle (weapons functional)
- All weapon categories usable in combat
- All universal actions available to appropriate characters
- All preparation types functional with action wheel display
- Magical combat resolution works correctly
- `npm run check` passes
- All unit tests pass
- All E2E tests pass
- No regressions in existing functionality
- E2E tests: minimum 3 scenarios

---

## Dependency Graph

```
Legend: A → B means A blocks B (B depends on A)

Epic 1 (Core Mechanics):
  9.1.1 (Unified Attack) → 9.1.2 (Preparation)
  9.1.1 → 9.2.1 (Strength)
  9.1.1 → 9.2.3 (Quick Strike)
  9.1.2 → 9.2.1, 9.2.3, 9.2.4, 9.2.5, 9.2.7
  9.1.2 → 9.3.5, 9.3.6 (Heavy Melee)
  9.1.2 → 9.1.6 (Ranged System)
  9.1.2 → 9.3.16-9.3.19 (Support)
  9.1.2 → 9.1.7 (Cast/Channel)
  9.1.3 (Magical Combat) → 9.2.6 (Resist)
  9.1.3 → 9.1.7 (Cast/Channel)
  9.1.4 (Burn) → 9.3.3 (Slicing Dagger)
  9.1.4 → 9.3.22 (Phoenix Heart)
  9.1.5 (Stabilize) → 9.3.22 (Phoenix Heart)
  9.1.6 (Ranged System) → 9.3.8-9.3.11 (individual ranged weapons)
  9.1.7 (Cast/Channel) → 9.3.21-9.3.24 (individual magical weapons)

Epic 2 (Universal Actions):
  9.2.1 (Strength) → 9.3.5, 9.3.6 (Heavy Melee)
  9.2.2 (Guard) → 9.3.12 (Shield System)
  9.2.3 (Quick Strike) → 9.3.1-9.3.4 (Light Melee)
  9.2.5 (Assess) → 9.3.18 (Tome)
  9.2.7 (Coordinate) → 9.3.16, 9.3.17, 9.3.19 (Banner, Horn, Censer)

Epic 3 (Weapons):
  9.3.12 (Shield System) → 9.3.13-9.3.15 (individual shields)
  9.3.12 → 9.4.1 (Equipment Slots)
  9.3.16 (Banner) → 9.4.1 (Equipment Slots)

Epic 4 (Character Creation):
  9.4.1 (Equipment Slots) → 9.4.2 (Weapon Selection)
  9.4.2 → 9.4.3 (Final Integration)
```

## Critical Path

The longest dependency chain determines the minimum sequential work:

```
9.1.1 (Unified Attack)
  → 9.1.2 (Preparation)
    → 9.1.7 (Cast/Channel) [also needs 9.1.3]
      → 9.3.22 (Phoenix Heart) [also needs 9.1.4, 9.1.5]
        → 9.4.1 (Equipment Slots)
          → 9.4.2 (Weapon Selection)
            → 9.4.3 (Final Integration)
```

**Parallelization opportunities:**
- 9.1.3, 9.1.4, 9.1.5 can all be built in parallel (no interdependencies)
- 9.2.2 (Guard) has no blockers — can start immediately
- All individual weapons within a category can be parallelized once their system story is done
- Light Melee, Heavy Melee, Ranged, Shields, Support, Magical weapon groups can largely be parallelized

## Story Count

| Epic | Stories | Type |
|------|---------|------|
| Core Mechanics | 7 | unit |
| Universal Actions | 7 | unit |
| Weapons | 22 | unit |
| Character Creation | 3 | e2e |
| **Total** | **39** | |
