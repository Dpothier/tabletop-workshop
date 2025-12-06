# PRD: Boss Battle Prototype - Combat System Redesign

## Document Purpose
Product Requirements Document for the cooperative tabletop boss battle game prototype. This document describes the new Action Wheel and Bead-based combat system that will replace the existing turn-based system.

**Last Updated**: December 6, 2025 (v4 - Added Steps 5-12)

---

# CORE COMBAT SYSTEM (NEW)

## 1. Action Wheel System (HIGH PRIORITY - Step 1)

### Description
Replace the turn-based system with an 8-segment circular action wheel that determines turn order based on action costs.

### Concept
- 8-segment wheel (positions 0-7)
- All creatures (players and monsters) have a position on the wheel
- Creature on the **lowest segment** acts next
- When multiple creatures share a segment, **FIFO order** (first to arrive acts first)
- After taking an action, creature advances clockwise by the action's wheel cost
- When passing segment 7, wrap back to segment 0

### Requirements
- FR-1.1: Track position (0-7) for each entity on the wheel
- FR-1.2: Track arrival order for FIFO tie-breaking
- FR-1.3: Move entity forward by N steps with wrap-around at 8
- FR-1.4: Determine next actor (lowest position, FIFO on ties)
- FR-1.5: Add/remove entities from wheel
- FR-1.6: Visual representation of wheel showing all creature positions

### Example Flow
```
Initial: Hero A at 0, Hero B at 0, Monster at 2
→ Hero A acts (arrived first), takes Move (cost 1), moves to position 1
→ Hero B acts (now lowest), takes Attack (cost 2), moves to position 2
→ Hero A acts (at 1, lowest), takes Attack (cost 2), moves to position 3
→ Monster acts (at 2, tied with Hero B but arrived earlier)...
```

---

## 2. Monster Bead Bag AI (HIGH PRIORITY - Step 2)

### Description
Monsters select their actions via a bead-draw state machine. Players can track drawn beads to predict monster behavior.

### Concept
- Each monster has a bag of colored beads: **red, blue, green, white**
- Monster attacks form a **state machine** with colored transitions
- Before acting, monster draws one bead from bag
- Drawn bead color determines which attack to transition to
- When bag is empty, all beads shuffle back into bag
- Players can count discarded beads to predict likely next moves

### Data Structure
```yaml
monsters:
  - name: Stone Guardian
    hp: 10
    beads: { red: 3, blue: 2, green: 2, white: 1 }
    start_state: idle
    states:
      idle:
        transitions:
          red: stone_slam
          blue: ground_pound
          green: idle
          white: earthquake
      stone_slam:
        damage: 2
        wheel_cost: 3
        range: 1
        transitions:
          red: stone_slam
          blue: ground_pound
          green: idle
          white: earthquake
      ground_pound:
        damage: 1
        wheel_cost: 2
        area: "radius 2"
        transitions:
          red: stone_slam
          blue: idle
          green: ground_pound
          white: earthquake
      earthquake:
        damage: 3
        wheel_cost: 4
        area: "all"
        transitions:
          red: idle
          blue: idle
          green: idle
          white: idle
```

### Requirements
- FR-2.1: BeadBag class to manage draw/discard/reshuffle
- FR-2.2: Track remaining beads in bag (for player information)
- FR-2.3: Track discarded beads (visible to players)
- FR-2.4: Monster state machine with current state tracking
- FR-2.5: Transition logic based on drawn bead color
- FR-2.6: UI showing discarded bead counts
- FR-2.7: Visual feedback when bead is drawn

---

## 3. Player Bead Hand System (HIGH PRIORITY - Step 3)

### Description
Players manage a hand of beads drawn from their personal bag. Some actions require spending specific colored beads.

### Concept
- Each player has a bag with **3 beads of each color** (12 total)
- At start of their turn, player draws **3 beads** to hand
- Actions may require spending beads from hand as cost
- "Rest" action allows drawing more beads
- When bag is empty, discarded beads shuffle back in

### Requirements
- FR-3.1: PlayerBeadHand class with bag and hand management
- FR-3.2: Draw N beads from bag to hand
- FR-3.3: Spend specific colored bead from hand
- FR-3.4: Check if player can afford bead cost
- FR-3.5: Reshuffle when bag is empty
- FR-3.6: UI showing current hand (colored bead icons)
- FR-3.7: UI showing bag/discard counts

---

## 4. Basic Combat Actions (HIGH PRIORITY - Step 4)

### Description
Define the core actions available to player characters with simplified stats.

### Stat Changes
| Entity | Old HP | New HP |
|--------|--------|--------|
| Heroes | 15-25 | **3** |
| Bosses | 100+ | **10** |

### Basic Actions
| Action | Wheel Cost | Bead Cost | Effect |
|--------|------------|-----------|--------|
| **Move** | 1 | None | Move up to 2 spaces |
| **Run** | 2 | None | Move up to 6 spaces |
| **Attack** | 2 | None | Deal 1 damage to adjacent target |
| **Rest** | 2 | None | Draw 2 beads to hand |

### Requirements
- FR-4.1: Implement Move action (2 spaces, cost 1)
- FR-4.2: Implement Run action (6 spaces, cost 2)
- FR-4.3: Implement Attack action (1 damage, adjacent, cost 2)
- FR-4.4: Implement Rest action (draw 2 beads, cost 2)
- FR-4.5: Update hero HP to 3
- FR-4.6: Update boss HP to 10
- FR-4.7: Action buttons show wheel cost and bead cost
- FR-4.8: Disable actions player cannot afford

---

# FUTURE FEATURES (After Core System)

## 5. Defense and Evasion System (HIGH PRIORITY - Step 5)

### Description
Deepen battle dynamics with defensive and evasive mechanics. Attacks must overcome evasion to hit, and then overcome defense to deal damage.

### Attack Resolution Flow
```
Attack Initiated
       ↓
Compare Attack Agility vs Target Evasion
       ↓
   ┌───┴───┐
   │       │
Agility   Evasion ≥ Agility
 > Evasion    ↓
   ↓      Target DODGES
Attack    (may trigger reaction)
 HITS
   ↓
Compare Attack Power vs Target Defense
       ↓
   ┌───┴───┐
   │       │
Power >   Defense ≥ Power
Defense       ↓
   ↓      Attack GUARDED
DAMAGE        (no damage)
DEALT
```

### Combat Stats

#### Offensive Stats
| Stat | Description |
|------|-------------|
| **Power** | Raw damage potential of the attack |
| **Agility** | Speed/precision of the attack, compared against Evasion |

#### Defensive Stats
| Stat | Description |
|------|-------------|
| **Armor** | Physical protection from equipment |
| **Guard** | Active blocking from stance/shield |
| **Defense** | Total = Armor + Guard |
| **Evasion** | Ability to dodge attacks entirely |

### Attack Modifiers
Some attacks have special properties that bypass defenses:

| Modifier | Effect |
|----------|--------|
| **Feint** | Ignores Guard (attack only needs to beat Armor) |
| **Heavy** | Ignores Armor (attack only needs to beat Guard) |
| **Precise** | +2 to Agility for hit calculation |
| **Swift** | Cannot be reacted to on dodge |

### Dodge Reactions
When a creature successfully dodges (Evasion ≥ Attack Agility), they may trigger a reaction:
- **Riposte**: Counter-attack opportunity
- **Reposition**: Move 1 space
- **Brace**: Gain +1 Guard until next action

*Note: Swift attacks prevent dodge reactions.*

### Requirements
- FR-5.1: Add Armor, Guard, and Evasion stats to all creatures
- FR-5.2: Calculate Defense as sum of Armor + Guard
- FR-5.3: Add Power and Agility stats to all attacks
- FR-5.4: Implement attack resolution: Agility vs Evasion check
- FR-5.5: Implement damage resolution: Power vs Defense check
- FR-5.6: Implement Feint modifier (ignore Guard)
- FR-5.7: Implement Heavy modifier (ignore Armor)
- FR-5.8: Implement Precise modifier (+2 Agility)
- FR-5.9: Implement Swift modifier (no dodge reaction)
- FR-5.10: Implement dodge reaction system
- FR-5.11: UI feedback for dodge, guard, and hit outcomes
- FR-5.12: Combat log showing attack resolution steps

---

## 6. Character Creation System (HIGH PRIORITY - Step 6)

### Description
Allow players to create custom characters by naming them and distributing attribute points.

### Character Attributes
Each character has 4 core attributes that influence their combat capabilities:

| Attribute | Abbr | Effect |
|-----------|------|--------|
| **Strength** | STR | Increases Power of melee attacks |
| **Dexterity** | DEX | Increases Evasion and Agility |
| **Mind** | MND | Increases special ability effectiveness |
| **Spirit** | SPR | Increases HP and bead draw efficiency |

### Point Buy System
- **Total Points**: 12 points to distribute
- **Minimum per Attribute**: 1
- **Maximum per Attribute**: 6
- **Starting Values**: All attributes start at 1 (4 points pre-allocated)
- **Distributable Points**: 8 additional points to assign

### Derived Stats
| Derived Stat | Formula |
|--------------|---------|
| HP | 2 + (SPR ÷ 2, rounded down) |
| Base Evasion | DEX |
| Base Power Bonus | STR ÷ 2, rounded down |
| Base Agility Bonus | DEX ÷ 2, rounded down |
| Starting Beads in Hand | 2 + (SPR ÷ 3, rounded down) |

### Character Creation Screen
```
┌─────────────────────────────────────────┐
│         CREATE YOUR CHARACTER           │
├─────────────────────────────────────────┤
│  Name: [_________________]              │
│                                         │
│  Points Remaining: 8                    │
│                                         │
│  STRENGTH    [−] ██░░░░ 2 [+]          │
│  DEXTERITY   [−] ███░░░ 3 [+]          │
│  MIND        [−] █░░░░░ 1 [+]          │
│  SPIRIT      [−] ██░░░░ 2 [+]          │
│                                         │
│  ─────────────────────────────────────  │
│  DERIVED STATS                          │
│  HP: 3    Evasion: 3                    │
│  Power Bonus: +1   Agility Bonus: +1    │
│                                         │
│           [CREATE CHARACTER]            │
└─────────────────────────────────────────┘
```

### Setup Screen Updates
The battle setup screen needs to be reworked to:
1. Show list of created characters
2. Allow selecting which characters participate in battle
3. Support creating new characters from setup screen
4. Show character stat summaries for selection

### Requirements
- FR-6.1: Character name input with validation
- FR-6.2: Attribute point allocation UI with +/- controls
- FR-6.3: Enforce minimum (1) and maximum (6) per attribute
- FR-6.4: Enforce total point budget (12 points)
- FR-6.5: Real-time derived stat calculation display
- FR-6.6: Character persistence (save created characters)
- FR-6.7: Character list management (view, edit, delete)
- FR-6.8: Updated setup screen with character selection
- FR-6.9: Validation preventing battle start without characters
- FR-6.10: Character portrait/icon selection (optional)

---

## 7. Weapon System (MEDIUM PRIORITY - Step 7)

### Description
Define a weapon list with unique special actions. Characters select their weapon during creation, which determines their available combat actions.

### Weapon Categories
*Specific weapons and their special actions to be designed when this step is implemented.*

#### Planned Weapon Types
| Category | Example Weapons | Playstyle |
|----------|-----------------|-----------|
| **Light Melee** | Dagger, Short Sword | Fast attacks, high agility |
| **Heavy Melee** | Greatsword, Maul | Slow but powerful, armor piercing |
| **Defensive** | Sword & Shield, Spear | High guard, counter-attacks |
| **Ranged** | Bow, Crossbow | Distance attacks, positioning |
| **Magical** | Staff, Wand | Bead-powered special effects |

### Weapon Properties (To Be Designed)
Each weapon will have:
- **Base Power**: Damage modifier
- **Base Agility**: Hit modifier
- **Range**: Attack distance (1 = adjacent, 2+ = ranged)
- **Special Actions**: Unique abilities requiring bead costs

### Character Creation Integration
The character creation screen (Step 6) will need updates:
- Add weapon selection step after attribute allocation
- Show weapon stats and special action previews
- Weapon choice affects available combat actions

### Requirements
- FR-7.1: Define weapon data schema
- FR-7.2: Create weapon list with stats and special actions
- FR-7.3: Weapon selection UI in character creation
- FR-7.4: Link weapon to character combat actions
- FR-7.5: Weapon-specific action buttons in battle UI
- FR-7.6: Balance weapons for different playstyles

*Note: Detailed weapon list and special actions will be specified when Step 7 implementation begins.*

---

## 8. Terrain System (MEDIUM PRIORITY - Step 8)

### Description
Implement terrain types that affect movement, line of sight, and provide tactical advantages or disadvantages during battle.

### Terrain Categories

#### Movement Terrain
| Terrain | Movement Cost | Effect |
|---------|---------------|--------|
| **Normal** | 1 | No effect |
| **Difficult** | 2 | Rough ground, debris, shallow water |
| **Impassable** | ∞ | Cannot enter (walls, deep water, chasms) |
| **Slippery** | 1 | Must continue moving 1 extra space in same direction |

#### Line of Sight Terrain
| Terrain | LoS Effect | Description |
|---------|------------|-------------|
| **Clear** | Full visibility | No obstruction |
| **Obscuring** | Partial block | Smoke, fog, tall grass (+1 Evasion for targets inside) |
| **Blocking** | Full block | Walls, pillars (cannot target through) |
| **Elevated** | Advantage | High ground (+1 Agility for ranged attacks) |

#### Hazard Terrain
| Terrain | Effect | Trigger |
|---------|--------|---------|
| **Damaging** | Deal 1 damage | On entry or start of action while inside |
| **Pit/Chasm** | Instant defeat | Forced movement into (voluntary entry blocked) |
| **Trap** | Variable effect | On entry (stun, damage, slow) |
| **Healing** | Restore 1 HP | On entry or rest action while inside |

#### Tactical Terrain
| Terrain | Benefit | Description |
|---------|---------|-------------|
| **Cover** | +1 Guard | Partial protection from ranged attacks |
| **Full Cover** | +2 Guard | Strong protection, blocks LoS from some angles |
| **Chokepoint** | Limits movement | Only 1 creature can occupy |
| **Altar/Shrine** | Special effect | Bead manipulation, buffs, story triggers |

### Terrain Combinations
Tiles can have multiple properties:
- **Elevated + Cover**: Sniper position (+1 Agility, +1 Guard)
- **Difficult + Obscuring**: Dense forest (slow + evasion bonus)
- **Damaging + Difficult**: Lava flow (dangerous and slow)

### Line of Sight Rules
```
Attacker → Target
    ↓
Check path for Blocking terrain
    ↓
┌───┴───┐
│       │
Blocked  Clear/Obscuring
   ↓          ↓
Cannot    Can attack
attack    (Obscuring: target +1 Evasion)
```

### Requirements
- FR-8.1: Define terrain data schema with movement/LoS/hazard properties
- FR-8.2: Movement cost calculation based on terrain
- FR-8.3: Line of sight calculation with blocking terrain
- FR-8.4: Hazard damage triggers (entry, start of action)
- FR-8.5: Tactical bonuses (cover, elevation)
- FR-8.6: Terrain combination support
- FR-8.7: Visual terrain indicators on battlefield
- FR-8.8: Pathfinding considers terrain costs
- FR-8.9: Ranged attack validation against LoS
- FR-8.10: Map editor for terrain placement (optional)

---

## 9. Inventory System (MEDIUM PRIORITY - Step 9)

### Description
Expand character creation to include a full inventory system. Characters can carry multiple weapons and items, switching between them during battle.

### Inventory Structure
```
CHARACTER INVENTORY
├── Equipped
│   ├── Main Hand: [Weapon]
│   ├── Off Hand: [Shield/Weapon/Empty]
│   ├── Armor: [Armor]
│   └── Accessory: [Ring/Amulet/etc.]
│
└── Backpack (4 slots)
    ├── Slot 1: [Weapon/Consumable/Item]
    ├── Slot 2: [Weapon/Consumable/Item]
    ├── Slot 3: [Weapon/Consumable/Item]
    └── Slot 4: [Weapon/Consumable/Item]
```

### Item Categories

#### Weapons (from Step 7)
- Can be equipped in Main Hand or Off Hand (if one-handed)
- Two-handed weapons occupy both slots
- Can be swapped during battle

#### Armor
| Type | Armor Bonus | Guard Penalty | Description |
|------|-------------|---------------|-------------|
| **None** | 0 | 0 | Unarmored |
| **Light** | 1 | 0 | Leather, padded |
| **Medium** | 2 | 0 | Chain, scale |
| **Heavy** | 3 | -1 Evasion | Plate, full armor |

#### Shields
| Type | Guard Bonus | Effect |
|------|-------------|--------|
| **Buckler** | +1 | Can still use off-hand weapon |
| **Round Shield** | +2 | Standard shield |
| **Tower Shield** | +3 | -1 Evasion, provides Cover |

#### Consumables
| Item | Effect | Uses |
|------|--------|------|
| **Health Potion** | Restore 2 HP | 1 |
| **Antidote** | Remove poison/burning | 1 |
| **Smoke Bomb** | Create Obscuring terrain (radius 1) | 1 |
| **Oil Flask** | Create Damaging terrain (radius 1) | 1 |

#### Accessories
| Type | Effect |
|------|--------|
| **Ring of Speed** | +1 Evasion |
| **Amulet of Might** | +1 Power |
| **Charm of Focus** | +1 starting bead |

### Battle Actions for Inventory

| Action | Wheel Cost | Effect |
|--------|------------|--------|
| **Swap Weapon** | 1 | Switch equipped weapon with backpack item |
| **Use Consumable** | 1 | Use item from backpack |
| **Drop Item** | 0 (free) | Remove item from inventory |

### Character Creation Updates
The character creation screen (Step 6) needs expansion:
1. After attribute allocation
2. After weapon selection (Step 7)
3. **NEW**: Armor selection
4. **NEW**: Accessory selection
5. **NEW**: Starting item selection (pick 2 consumables)

### Requirements
- FR-9.1: Define inventory data schema
- FR-9.2: Equipment slot management (equip/unequip)
- FR-9.3: Backpack slot management
- FR-9.4: Armor system with stat modifiers
- FR-9.5: Shield system with guard bonuses
- FR-9.6: Consumable item system with use effects
- FR-9.7: Accessory system with passive bonuses
- FR-9.8: Swap Weapon action in battle
- FR-9.9: Use Consumable action in battle
- FR-9.10: Update character creation with equipment selection
- FR-9.11: Inventory UI in battle (view equipped, access backpack)
- FR-9.12: Item persistence with character save

---

## 10. Advanced Player Actions (MEDIUM PRIORITY)

### Description
Class-specific actions that require bead costs for powerful effects.

### Example Actions (To Be Designed)
| Action | Wheel Cost | Bead Cost | Effect |
|--------|------------|-----------|--------|
| Power Attack | 3 | 1 Red | Deal 2 damage |
| Defensive Stance | 1 | 1 Blue | Reduce next damage by 1 |
| Quick Step | 1 | 1 Green | Move 3 spaces |
| Heal | 2 | 1 White | Restore 1 HP to adjacent ally |

### Requirements
- FR-10.1: Define class-specific actions per character class
- FR-10.2: Bead cost validation before action execution
- FR-10.3: Bead spending on action use
- FR-10.4: Action availability based on hand contents

---

## 11. Conditions System (LOW PRIORITY)

### Description
Status effects that modify creature behavior.

### Conditions
| Condition | Effect | Duration |
|-----------|--------|----------|
| Stunned | Skip next action | 1 action |
| Burning | Take 1 damage when acting | 2 actions |
| Slowed | +1 to all wheel costs | 2 actions |

### Requirements
- FR-11.1: Track conditions per entity
- FR-11.2: Apply condition effects at appropriate time
- FR-11.3: Decrement/remove conditions
- FR-11.4: Visual indicator for active conditions

---

## 12. Area-of-Effect Attacks (LOW PRIORITY)

### Description
Some monster attacks affect multiple targets.

### AoE Types
| Type | Description |
|------|-------------|
| Radius N | All creatures within N spaces of center |
| Cone N | Triangle shape, N spaces long |
| Line N | Straight line, N spaces |
| All | Every creature on the battlefield |

### Requirements
- FR-12.1: Calculate affected tiles for each AoE type
- FR-12.2: Apply damage to all creatures in area
- FR-12.3: Visual preview of AoE before execution

---

## 13. Combat Polish (LOW PRIORITY)

### Description
Visual and audio feedback improvements.

### Requirements
- FR-13.1: Bead draw animation
- FR-13.2: Action wheel rotation animation
- FR-13.3: Damage number pop-ups
- FR-13.4: Sound effects for actions
- FR-13.5: Monster state transition effects

---

## 14. Campaign & Progression System (MEDIUM PRIORITY - Step 10)

### Description
Connect battles into a campaign with character progression, persistent state, and resource management between fights.

### Campaign Structure
```
CAMPAIGN
├── Chapter 1: The Awakening
│   ├── Battle 1: Tutorial Fight
│   ├── Battle 2: First Challenge
│   └── Battle 3: Chapter Boss
│
├── Chapter 2: Into the Depths
│   ├── Battle 4: ...
│   └── ...
│
└── Final Chapter: Confrontation
    └── Final Boss
```

### Progression Elements

#### Experience & Leveling
| Level | XP Required | Benefit |
|-------|-------------|---------|
| 1 | 0 | Starting level |
| 2 | 100 | +1 attribute point |
| 3 | 250 | Unlock specialization |
| 4 | 450 | +1 attribute point |
| 5 | 700 | Advanced ability |

#### Between-Battle Phase
After each battle, players can:
1. **Rest**: Heal all HP, clear conditions
2. **Shop**: Spend gold on equipment and consumables
3. **Train**: Allocate earned attribute points
4. **Prepare**: Adjust inventory and equipment

#### Persistent State
| Element | Persists? | Reset Condition |
|---------|-----------|-----------------|
| HP | Yes | Rest between battles |
| Conditions | Yes | Rest or consumable |
| Inventory | Yes | Permanent |
| Gold | Yes | Spent at shop |
| XP/Level | Yes | Permanent |
| Beads in hand | No | Reset each battle |

#### Gold & Rewards
| Source | Gold Earned |
|--------|-------------|
| Battle victory | 50-150 based on difficulty |
| Boss defeated | 200+ |
| Optional objectives | 25-50 bonus |
| Found treasure | Variable |

### Requirements
- FR-14.1: Campaign data structure (chapters, battles, progression)
- FR-14.2: Experience and leveling system
- FR-14.3: Between-battle phase UI
- FR-14.4: Shop system with item prices
- FR-14.5: Persistent character state across battles
- FR-14.6: Campaign progress saving/loading
- FR-14.7: Victory/defeat conditions per battle
- FR-14.8: Campaign overview screen
- FR-14.9: Gold and reward distribution

---

## 15. Monster Variety & Boss Phases (MEDIUM PRIORITY - Step 11)

### Description
Expand monster design with phase transitions, minion mechanics, and environmental interactions to create more dynamic boss encounters.

### Boss Phase System
```
BOSS HEALTH BAR
[████████████████████] 100%
        ↓ Phase 1: Normal
[████████████░░░░░░░░] 60%
        ↓ Phase 2: Enraged (threshold crossed)
[████░░░░░░░░░░░░░░░░] 20%
        ↓ Phase 3: Desperate (threshold crossed)
[░░░░░░░░░░░░░░░░░░░░] 0% Defeated
```

### Phase Transitions
When a boss crosses a health threshold:
1. **Interrupt**: Current action cancelled
2. **Transition Animation**: Visual feedback
3. **State Change**: New bead bag composition, new state machine
4. **Environmental Effect**: Optional arena changes

### Phase Modifiers
| Phase Element | Example |
|---------------|---------|
| **New Beads** | Add 2 red beads to bag (more aggressive) |
| **Remove Beads** | Remove white beads (no more healing) |
| **New States** | Unlock "Enraged Slam" attack |
| **Stat Changes** | +1 Power, -1 Evasion |
| **Arena Change** | Floor becomes hazard terrain |

### Minion System
Bosses can summon minions during battle:

| Minion Type | HP | Behavior |
|-------------|-----|----------|
| **Swarm** | 1 | Weak but numerous, simple AI |
| **Elite** | 2 | Stronger, has own bead bag |
| **Totem** | 3 | Stationary, buffs boss or debuffs players |

### Summon Mechanics
- Summon action uses boss's turn on action wheel
- Minions get their own wheel positions
- Defeating minions may grant small rewards
- Some bosses resummon minions at phase transitions

### Environmental Interactions
Bosses can interact with terrain:

| Interaction | Effect |
|-------------|--------|
| **Destroy Cover** | Remove cover terrain in area |
| **Create Hazard** | Turn tiles into damaging terrain |
| **Collapse** | Create impassable terrain |
| **Summon Platform** | Create elevated terrain |

### Monster Data Structure
```yaml
monsters:
  - name: Stone Guardian
    phases:
      - threshold: 100  # Starting phase
        hp: 10
        beads: { red: 3, blue: 2, green: 2, white: 1 }
        states: [idle, stone_slam, ground_pound]
      - threshold: 50   # Phase 2 at 50% HP
        beads: { red: 4, blue: 2, green: 1, white: 1 }
        states: [idle, stone_slam, ground_pound, earthquake]
        on_enter:
          - action: summon
            minion: stone_shard
            count: 2
          - action: terrain
            effect: create_hazard
            area: "radius 2 from boss"
      - threshold: 20   # Phase 3 at 20% HP
        beads: { red: 5, blue: 1, green: 1, white: 0 }
        states: [berserk_slam, earthquake, desperate_charge]
```

### Requirements
- FR-15.1: Phase threshold system for bosses
- FR-15.2: Dynamic bead bag modification on phase change
- FR-15.3: State machine swapping between phases
- FR-15.4: Phase transition visual feedback
- FR-15.5: Minion spawning and management
- FR-15.6: Minion AI (simplified bead system or scripted)
- FR-15.7: Environmental interaction actions
- FR-15.8: Phase-triggered terrain changes
- FR-15.9: Update monster data schema for phases
- FR-15.10: Boss health bar with phase indicators

---

## 16. Print-and-Play Export (LOW PRIORITY - Step 12)

### Description
Generate printable materials for physical tabletop play, allowing the game to be played without a computer.

### Exportable Materials

#### Character Sheets
```
┌─────────────────────────────────────┐
│  CHARACTER: [Name]                  │
│  Level: [X]  XP: [XXX]              │
├─────────────────────────────────────┤
│  ATTRIBUTES                         │
│  STR: [X]  DEX: [X]                 │
│  MND: [X]  SPR: [X]                 │
├─────────────────────────────────────┤
│  DERIVED STATS                      │
│  HP: [ ][ ][ ]  Evasion: [X]        │
│  Power: +[X]    Agility: +[X]       │
├─────────────────────────────────────┤
│  EQUIPMENT                          │
│  Weapon: _______________            │
│  Armor:  _______________            │
│  Shield: _______________            │
│  Accessory: ____________            │
├─────────────────────────────────────┤
│  BEAD TRACKING                      │
│  Bag:  R[3] B[3] G[3] W[3]          │
│  Hand: [ ][ ][ ][ ][ ]              │
│  Discard: R[ ] B[ ] G[ ] W[ ]       │
└─────────────────────────────────────┘
```

#### Monster Cards
- Front: Art, name, HP, stats
- Back: State machine diagram with transitions
- Bead composition listed
- Phase thresholds marked

#### Action Wheel Template
- Printable wheel with 8 segments
- Tokens for each creature
- Arrival order tracking area

#### Terrain Tiles
- Hex or square tiles for each terrain type
- Color-coded by effect category
- Stackable for combinations

#### Quick Reference Cards
- Combat resolution flow
- Action list with costs
- Condition effects
- Terrain effects

### Export Formats
| Format | Use Case |
|--------|----------|
| **PDF** | Print-ready, high quality |
| **PNG** | Individual cards/tiles |
| **Markdown** | Rulebook text |
| **JSON** | Data for other tools |

### Print Specifications
- Character sheets: Letter/A4
- Cards: Standard poker size (2.5" x 3.5")
- Tiles: 1" hexes or 1" squares
- Wheel: 8" diameter recommended

### Requirements
- FR-16.1: Character sheet PDF generator
- FR-16.2: Monster card generator with state diagrams
- FR-16.3: Action wheel printable template
- FR-16.4: Terrain tile sheet generator
- FR-16.5: Quick reference card generator
- FR-16.6: Rulebook markdown export
- FR-16.7: Campaign booklet export
- FR-16.8: PDF compilation (via Pandoc or similar)
- FR-16.9: Print-friendly styling (no dark backgrounds)
- FR-16.10: Batch export for full game set

---

# DEPRECATED FEATURES

The following features from the previous PRD are **replaced** by the new combat system:

| Old Feature | Replacement |
|-------------|-------------|
| Turn-based phases | Action Wheel |
| TurnManager system | ActionWheel system |
| Random monster attack selection | Bead-based state machine |
| Complex HP/damage numbers | Simplified HP (3/10) |
| Cooldown-based abilities | Bead-cost abilities |
| Speed stat for turn order | Wheel cost per action |

---

# IMPLEMENTATION ORDER

## Phase 1: Action Wheel (Step 1)
1. Create `ActionWheel` system class
2. Unit tests for wheel mechanics
3. Basic integration (no UI yet)

## Phase 2: Monster Bead AI (Step 2)
1. Create `BeadBag` system class
2. Create `MonsterStateMachine` class
3. Update monster data schema
4. Unit tests for bead mechanics

## Phase 3: Player Bead System (Step 3)
1. Create `PlayerBeadHand` class
2. Unit tests for hand management
3. Integrate with character tokens

## Phase 4: Combat Integration (Step 4)
1. Replace TurnManager with ActionWheel in BattleScene
2. Implement basic actions (Move, Run, Attack, Rest)
3. Update HP values
4. Add wheel and bead UI visualization
5. E2E testing

## Phase 5: Defense and Evasion System (Step 5)
1. Add defensive stats (Armor, Guard, Evasion) to creature schema
2. Add offensive stats (Power, Agility) to attack schema
3. Create `CombatResolver` system for attack resolution
4. Implement attack modifiers (Feint, Heavy, Precise, Swift)
5. Implement dodge reaction system
6. Update UI for combat resolution feedback
7. Unit tests for combat resolution
8. Update monster and player data with new stats

## Phase 6: Character Creation (Step 6)
1. Create `CharacterCreation` scene
2. Implement attribute point allocation system
3. Implement derived stat calculation
4. Create character persistence layer
5. Update setup screen for character selection
6. Unit tests for point allocation and derived stats
7. E2E tests for character creation flow

## Phase 7: Weapon System (Step 7)
1. Define weapon data schema
2. Create weapon list with stats and special actions
3. Add weapon selection to character creation
4. Link weapons to character combat actions
5. Update battle UI for weapon-specific actions
6. Unit tests for weapon mechanics
7. Balance testing across weapon types

## Phase 8: Terrain System (Step 8)
1. Define terrain data schema with properties
2. Create `TerrainSystem` for movement/LoS calculations
3. Implement movement cost pathfinding
4. Implement line of sight calculations
5. Add hazard and tactical terrain effects
6. Create terrain rendering system
7. Unit tests for terrain mechanics
8. Update map data format to include terrain

## Phase 9: Inventory System (Step 9)
1. Define inventory and item data schemas
2. Create `InventoryManager` system
3. Implement equipment slots (weapon, armor, accessory)
4. Implement backpack management
5. Create armor and shield systems
6. Implement consumable items
7. Add Swap Weapon and Use Consumable actions
8. Update character creation with equipment selection
9. Create inventory UI for battle
10. Unit tests for inventory mechanics

## Phase 10: Campaign & Progression (Step 10)
1. Define campaign data structure
2. Create `CampaignManager` system
3. Implement experience and leveling
4. Create between-battle phase UI
5. Implement shop system
6. Add persistent character state
7. Campaign save/load functionality
8. Victory/defeat condition system
9. Unit tests for progression mechanics

## Phase 11: Monster Variety & Boss Phases (Step 11)
1. Update monster schema for phases
2. Implement phase threshold detection
3. Dynamic bead bag modification
4. State machine swapping on phase change
5. Minion spawning system
6. Environmental interaction actions
7. Boss health bar with phase indicators
8. Unit tests for phase mechanics

## Phase 12: Print-and-Play Export (Step 12)
1. Character sheet template and generator
2. Monster card generator
3. Action wheel printable template
4. Terrain tile sheet generator
5. Quick reference cards
6. Rulebook markdown export
7. PDF compilation pipeline
8. Batch export functionality

---

# FILES TO CREATE

| File | Purpose | Phase |
|------|---------|-------|
| `src/systems/ActionWheel.ts` | Wheel position tracking and turn order | 1 |
| `src/systems/BeadBag.ts` | Bead draw/discard/reshuffle logic | 2 |
| `src/systems/MonsterStateMachine.ts` | Monster state transitions | 2 |
| `src/systems/PlayerBeadHand.ts` | Player hand management | 3 |
| `src/systems/CombatResolver.ts` | Attack resolution with evasion/defense | 5 |
| `src/scenes/CharacterCreationScene.ts` | Character creation UI | 6 |
| `src/systems/CharacterBuilder.ts` | Point allocation and derived stats | 6 |
| `src/services/CharacterStorage.ts` | Character persistence | 6 |
| `data/weapons/index.yaml` | Weapon definitions and special actions | 7 |
| `src/systems/TerrainSystem.ts` | Movement cost and LoS calculations | 8 |
| `data/terrain/index.yaml` | Terrain type definitions | 8 |
| `src/systems/InventoryManager.ts` | Equipment and backpack management | 9 |
| `data/items/armor.yaml` | Armor definitions | 9 |
| `data/items/shields.yaml` | Shield definitions | 9 |
| `data/items/consumables.yaml` | Consumable item definitions | 9 |
| `data/items/accessories.yaml` | Accessory definitions | 9 |
| `features/unit/action-wheel.feature` | Action wheel tests | 1 |
| `features/unit/bead-bag.feature` | Bead bag tests | 2 |
| `features/unit/monster-state-machine.feature` | State machine tests | 2 |
| `features/unit/player-bead-hand.feature` | Player hand tests | 3 |
| `features/unit/combat-resolver.feature` | Combat resolution tests | 5 |
| `features/unit/character-builder.feature` | Character creation tests | 6 |
| `features/unit/terrain-system.feature` | Terrain mechanics tests | 8 |
| `features/unit/inventory-manager.feature` | Inventory mechanics tests | 9 |
| `features/e2e/character-creation.feature` | Character creation E2E tests | 6 |
| `src/systems/CampaignManager.ts` | Campaign progression and state | 10 |
| `src/scenes/CampaignScene.ts` | Campaign overview and navigation | 10 |
| `src/scenes/ShopScene.ts` | Between-battle shop UI | 10 |
| `data/campaigns/tutorial.yaml` | Tutorial campaign definition | 10 |
| `src/systems/BossPhaseManager.ts` | Boss phase transitions | 11 |
| `src/systems/MinionManager.ts` | Minion spawning and AI | 11 |
| `src/export/CharacterSheetGenerator.ts` | PDF character sheet export | 12 |
| `src/export/MonsterCardGenerator.ts` | Monster card export | 12 |
| `src/export/PrintExporter.ts` | Batch print-and-play export | 12 |
| `features/unit/campaign-manager.feature` | Campaign mechanics tests | 10 |
| `features/unit/boss-phases.feature` | Boss phase tests | 11 |

# FILES TO MODIFY

| File | Changes | Phase |
|------|---------|-------|
| `src/scenes/BattleScene.ts` | Replace TurnManager with ActionWheel, terrain, inventory UI, boss phases | 4, 8, 9, 11 |
| `src/entities/Token.ts` | Add bead hand, defensive stats, inventory, XP/level, update HP | 3, 5, 9, 10 |
| `data/characters/classes.yaml` | Simplify to new action system, add attributes | 4, 6 |
| `data/monsters/index.yaml` | Add beads, state machine, defensive stats, phases, minions | 2, 5, 11 |
| `data/rules/core.yaml` | Update with new mechanics | 4, 5 |
| `src/scenes/SetupScene.ts` | Character selection for battles, campaign integration | 6, 10 |
| `src/scenes/CharacterCreationScene.ts` | Add equipment selection steps | 9 |
| `data/maps/*.yaml` | Add terrain data to map definitions | 8 |
| `src/services/CharacterStorage.ts` | Add XP, level, gold persistence | 10 |

# FILES TO DELETE

| File | Reason |
|------|--------|
| `src/systems/TurnManager.ts` | Replaced by ActionWheel |

---

## Current Test Coverage
- 71 unit/integration tests (QuickPickle/Gherkin)
- 8 E2E tests (playwright-bdd)
- All passing

*Note: Existing tests for TurnManager will need to be updated or removed after migration.*
