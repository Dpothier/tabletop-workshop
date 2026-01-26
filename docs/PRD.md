# PRD: Boss Battle Prototype

## Document Purpose

Product Requirements Document for the cooperative tabletop boss battle game prototype. This document describes the desired functionality organized by feature category.

**Last Updated**: January 25, 2026

---

# GRAPHICAL INTERFACE

## Action Wheel Display

The action wheel is an 8-segment circular display showing creature positions and turn order.

### Requirements
- Display an 8-segment wheel (positions 0-7)
- Show all creature tokens at their current positions
- Indicate which creature acts next (lowest position)
- Show arrival order when multiple creatures share a segment
- Animate wheel movement when creatures advance positions
- Visual feedback for wrap-around at position 7 to 0

## Bead Displays

### Monster Bead Tracker
- Show remaining beads in monster's bag (counts by color)
- Show discarded beads (counts by color)
- Visual feedback when a bead is drawn

### Player Bead Hand
- Display colored bead icons for beads in hand
- Show bag and discard pile counts
- Indicate which beads can be spent for available actions

## Combat Resolution Feedback
- Show attack outcome: hit, dodge, or guarded
- Display damage numbers
- Combat log showing resolution steps (agility vs evasion, power vs defense)
- Visual indicators for attack modifiers (Feint, Heavy, Precise, Swift)

## Terrain Visualization
- Visual indicators for each terrain type on the battlefield
- Show movement cost overlays during move action
- Line of sight indicators for ranged attacks
- Hazard and tactical effect highlights

## Battle UI Layout

### Hero Selection Bar (Below Arena)
A horizontal bar displaying all player heroes:
- Each hero shown with their name and first letter as icon
- Clicking a hero card selects that hero (only if it's their turn)
- Current actor's card is highlighted
- Each hero card displays:
  - Character name
  - Colored bead icons showing beads currently in hand
  - Current weapon icon
  - HP indicator

### Selected Hero Panel
When a hero is selected (and it's their turn):
- Character name displayed at top
- Inventory panel showing equipped items (empty slots for now)
- Action menu with available actions:
  - Basic actions (Move, Run, Attack, Rest)
  - Weapon-specific actions (grayed out if bead cost not affordable)
- Bead cost displayed next to each action

### Turn Indicator
- Clear visual indication of whose turn it is
- Only the current actor can be selected and perform actions
- Other heroes are visible but not selectable during another's turn

## Character Screens

### Character Creation Scene
A dedicated scene for creating and editing characters.

#### Input Fields
- **Name**: Required, max 20 characters, must be unique among saved characters
- **Attributes**: STR, DEX, MND, SPR with +/- controls
  - 12 total points to distribute
  - Minimum 1, Maximum 6 per attribute
  - All points must be spent before saving
- **Weapon Selection**: Required, choose one from available weapons

#### Visual Feedback
- Real-time bead bag preview showing composition based on attributes
- First letter of name shown as token preview
- Validation errors displayed inline

#### Validation Rules
- Name: required, max 20 characters, unique
- Attributes: all 12 points must be allocated
- Weapon: must select one

### Menu Scene (Battle Setup)
The main menu integrates character selection for battle:

#### Monster & Arena Selection
- Dropdown or list to select monster
- Dropdown or list to select arena

#### Party Selection (4 Slots)
- 4 character slots displayed below monster/arena options
- Click slot → opens character selection popup
- Popup shows:
  - List of saved characters (with name, attributes summary)
  - "Create New Character" button → CharacterCreationScene
  - Characters already in party are grayed out (no duplicates)
- Minimum 1 character required to start battle

#### Character Management
- "Manage Characters" button opens character management view
- View all saved characters
- Edit character → CharacterCreationScene (pre-filled)
- Delete character (with confirmation dialog)
- Import/Export buttons for JSON backup

### Default Characters
4 pre-created characters available immediately:
- Cannot be deleted
- Cannot be modified (read-only)
- Provide variety for quick-start gameplay

## Inventory UI
- View equipped items (weapon, armor, shield, accessory)
- Access backpack contents (4 slots)
- Support for Swap Weapon and Use Consumable actions

## Boss Health Display
- Health bar with phase threshold indicators
- Visual feedback for phase transitions
- Minion tracking display

## Campaign UI
- Campaign overview screen showing chapters and battles
- Between-battle phase: rest, shop, train, prepare
- Shop interface for purchasing equipment and consumables
- Experience and level display
- Gold counter

## Print-and-Play Export
- Character sheet PDF generator
- Monster cards with state machine diagrams
- Printable action wheel template
- Terrain tile sheets
- Quick reference cards
- Rulebook markdown export

---

# TURN ORDER

## Action Wheel System

Turn order is determined by creature position on an 8-segment circular wheel.

### Core Mechanics
- All creatures (players and monsters) have a position (0-7) on the wheel
- Creature on the lowest segment acts next
- When multiple creatures share a segment, FIFO order (first to arrive acts first)
- After taking an action, creature advances clockwise by the action's wheel cost
- When passing segment 7, wrap back to segment 0

### Wheel Operations
- Track position (0-7) for each entity
- Track arrival order for FIFO tie-breaking
- Move entity forward by N steps with wrap-around at 8
- Determine next actor (lowest position, FIFO on ties)
- Add/remove entities from wheel

### Example Flow
```
Initial: Hero A at 0, Hero B at 0, Monster at 2
→ Hero A acts (arrived first), takes Move (cost 1), moves to position 1
→ Hero B acts (now lowest), takes Attack (cost 2), moves to position 2
→ Hero A acts (at 1, lowest), takes Attack (cost 2), moves to position 3
→ Monster acts (at 2, tied with Hero B but arrived earlier)...
```

---

# MONSTER BEHAVIOR

## Bead Bag AI System

Monsters select actions via a bead-draw state machine.

### Bead Colors and Themes
Each bead color represents a thematic approach to combat:

| Color | Theme | Monster Behavior |
|-------|-------|------------------|
| Red | Strength | Straightforward aggression, powerful strikes, static defenses |
| Green | Dexterity | Mobile attacks, evasive maneuvers, repositioning |
| Blue | Mind | Manipulation, cunning tactics, unpredictable actions |
| White | Soul | Courage, influence, buffing or directing minions |

A monster's bead composition reflects its personality and fighting style. A brute has mostly red beads; a cunning trickster favors blue; a pack leader relies on white to command minions.

### Bead Bag Mechanics
- Each monster has a bag of colored beads: red, blue, green, white
- Before acting, monster draws one bead from bag
- When bag is empty, all beads shuffle back into bag
- Players can count discarded beads to predict likely moves

### State Machine
- Monster attacks form a state machine with colored transitions
- Drawn bead color determines which attack to transition to
- Each state defines: damage, wheel cost, range/area, and transitions to other states

### Monster Data Structure
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
        transitions: { red: stone_slam, blue: ground_pound, green: idle, white: earthquake }
```

## Boss Phase System

Bosses transition through phases as they take damage.

### Phase Mechanics
- Health thresholds trigger phase transitions
- On phase change: action interrupted, visual feedback, state change
- Each phase can modify: bead bag composition, available states, base stats

### Phase Modifiers
| Element | Example |
|---------|---------|
| New Beads | Add 2 red beads (more aggressive) |
| Remove Beads | Remove white beads (no healing) |
| New States | Unlock "Enraged Slam" attack |
| Stat Changes | +1 Power, -1 Evasion |
| Arena Change | Floor becomes hazard terrain |

## Minion System

Bosses can summon minions during battle.

### Minion Types
| Type | HP | Behavior |
|------|-----|----------|
| Swarm | 1 | Weak but numerous, simple AI |
| Elite | 2 | Stronger, has own bead bag |
| Totem | 3 | Stationary, buffs boss or debuffs players |

### Minion Mechanics
- Summon action uses boss's turn on action wheel
- Minions get their own wheel positions
- Defeating minions may grant small rewards
- Some bosses resummon minions at phase transitions

## Area-of-Effect Attacks

Some monster attacks affect multiple targets.

### AoE Types
| Type | Description |
|------|-------------|
| Radius N | All creatures within N spaces of center |
| Cone N | Triangle shape, N spaces long |
| Line N | Straight line, N spaces |
| All | Every creature on the battlefield |

## Monster Environmental Interactions

Bosses can interact with terrain.

| Interaction | Effect |
|-------------|--------|
| Destroy Cover | Remove cover terrain in area |
| Create Hazard | Turn tiles into damaging terrain |
| Collapse | Create impassable terrain |
| Summon Platform | Create elevated terrain |

---

# PLAYER ACTIONS

## Bead Hand System

Players manage a hand of beads drawn from their personal bag.

### Bead Colors and Themes
Each bead color is linked to a character attribute and powers specific types of actions:

| Color | Attribute | Player Actions |
|-------|-----------|----------------|
| Red | Strength | Powerful attacks, breaking through defenses, holding ground |
| Green | Dexterity | Quick movement, evasive actions, precision strikes |
| Blue | Mind | Tactical abilities, debuffs, exploiting weaknesses |
| White | Spirit | Healing, inspiring allies, protective abilities |

Players can strategize around which beads they have in hand, choosing actions that match their available colors or saving specific beads for key moments.

### Bead Mechanics
- Each player has a bag with beads determined by their attributes:
  - Red beads = STR, Green beads = DEX, Blue beads = MND, White beads = SPR
  - Total always equals 12 (sum of all attributes)
- At start of combat, player draws 3 beads to hand
- Actions may require spending beads from hand as cost
- When bag is empty, discarded beads shuffle back in

### Hand Operations
- Draw N beads from bag to hand
- Spend specific colored bead from hand
- Check if player can afford bead cost
- Reshuffle when bag is empty

## Basic Actions

| Action | Wheel Cost | Bead Cost | Effect |
|--------|------------|-----------|--------|
| Move | 1 | None | Move up to 2 spaces |
| Run | 2 | None | Move up to 6 spaces |
| Attack | 2 | None | Deal 1 damage to adjacent target |
| Rest | 2 | None | Draw 2 beads to hand |

## Advanced Actions (Weapon-Based)

Weapons grant unique special actions requiring bead costs.

| Action Example | Wheel Cost | Bead Cost | Effect |
|----------------|------------|-----------|--------|
| Power Attack | 3 | 1 Red | Deal 2 damage |
| Defensive Stance | 1 | 1 Blue | Reduce next damage by 1 |
| Quick Step | 1 | 1 Green | Move 3 spaces |
| Heal | 2 | 1 White | Restore 1 HP to adjacent ally |

## Combat Resolution

Attacks must overcome evasion to hit, then overcome defense to deal damage.

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
   ↓      Target DODGES (may trigger reaction)
Attack HITS
   ↓
Compare Attack Power vs Target Defense
       ↓
   ┌───┴───┐
   │       │
Power >   Defense ≥ Power
Defense       ↓
   ↓      Attack GUARDED (no damage)
DAMAGE DEALT
```

### Combat Stats

#### Offensive Stats
| Stat | Description |
|------|-------------|
| Power | Raw damage potential of the attack |
| Agility | Speed/precision, compared against Evasion |

#### Defensive Stats
| Stat | Description |
|------|-------------|
| Armor | Physical protection from equipment |
| Guard | Active blocking from stance/shield |
| Defense | Total = Armor + Guard |
| Evasion | Ability to dodge attacks entirely |

### Attack Modifiers
| Modifier | Effect |
|----------|--------|
| Feint | Ignores Guard (only needs to beat Armor) |
| Heavy | Ignores Armor (only needs to beat Guard) |
| Precise | +2 to Agility for hit calculation |
| Swift | Cannot be reacted to on dodge |

### Dodge Reactions
When successfully dodging (Evasion ≥ Attack Agility):
- Riposte: Counter-attack opportunity
- Reposition: Move 1 space
- Brace: Gain +1 Guard until next action

*Swift attacks prevent dodge reactions.*

## Inventory Actions

| Action | Wheel Cost | Effect |
|--------|------------|--------|
| Swap Weapon | 1 | Switch equipped weapon with backpack item |
| Use Consumable | 1 | Use item from backpack |
| Drop Item | 0 (free) | Remove item from inventory |

## Conditions

Status effects that modify creature behavior.

| Condition | Effect | Duration |
|-----------|--------|----------|
| Stunned | Skip next action | 1 action |
| Burning | Take 1 damage when acting | 2 actions |
| Slowed | +1 to all wheel costs | 2 actions |

---

# TERRAIN SYSTEM

## Movement Terrain

| Terrain | Movement Cost | Effect |
|---------|---------------|--------|
| Normal | 1 | No effect |
| Difficult | 2 | Rough ground, debris, shallow water |
| Impassable | ∞ | Cannot enter (walls, deep water, chasms) |
| Slippery | 1 | Must continue moving 1 extra space in same direction |

## Line of Sight Terrain

| Terrain | LoS Effect | Description |
|---------|------------|-------------|
| Clear | Full visibility | No obstruction |
| Obscuring | Partial block | Smoke, fog, tall grass (+1 Evasion inside) |
| Blocking | Full block | Walls, pillars (cannot target through) |
| Elevated | Advantage | High ground (+1 Agility for ranged attacks) |

## Hazard Terrain

| Terrain | Effect | Trigger |
|---------|--------|---------|
| Damaging | Deal 1 damage | On entry or start of action while inside |
| Pit/Chasm | Instant defeat | Forced movement into (voluntary entry blocked) |
| Trap | Variable effect | On entry (stun, damage, slow) |
| Healing | Restore 1 HP | On entry or rest action while inside |

## Tactical Terrain

| Terrain | Benefit | Description |
|---------|---------|-------------|
| Cover | +1 Guard | Partial protection from ranged attacks |
| Full Cover | +2 Guard | Strong protection, blocks LoS from some angles |
| Chokepoint | Limits movement | Only 1 creature can occupy |
| Altar/Shrine | Special effect | Bead manipulation, buffs, story triggers |

## Terrain Combinations

Tiles can have multiple properties:
- Elevated + Cover: Sniper position (+1 Agility, +1 Guard)
- Difficult + Obscuring: Dense forest (slow + evasion bonus)
- Damaging + Difficult: Lava flow (dangerous and slow)

---

# ECONOMY AND CHARACTER CUSTOMIZATION

## Character Attributes

Each character has 4 core attributes that determine their **bead bag composition**.

| Attribute | Abbr | Bead Color | Theme |
|-----------|------|------------|-------|
| Strength | STR | Red | Powerful attacks, defense boosts |
| Dexterity | DEX | Green | Evasion, quick actions, repositioning |
| Mind | MND | Blue | Tactical abilities, debuffs |
| Spirit | SPR | White | Healing, support, protection |

### Attributes → Bead Bag
**The only effect of attributes is determining bead bag composition:**
- Red beads in bag = STR value
- Green beads in bag = DEX value
- Blue beads in bag = MND value
- White beads in bag = SPR value
- **Total beads = 12** (always equals total attribute points)

A character with STR 5, DEX 2, MND 2, SPR 3 has a bag of: 5 red, 2 green, 2 blue, 3 white beads.

**No passive bonuses.** Attributes don't provide automatic stat increases. A high-STR character has more red beads, making them more likely to have red beads available for powerful effects, but this requires actively spending those beads.

### Point Buy System
- Total Points: 12 points to distribute
- Minimum per Attribute: 1
- Maximum per Attribute: 6
- All 12 points must be allocated (no saving points)

### Fixed Stats (No Derived Stats)
| Stat | Value | Source |
|------|-------|--------|
| HP | 4 | Fixed for all heroes |
| Base Armor | 0 | Equipment only |
| Base Guard | 0 | Effects/reactions only |
| Base Evasion | 0 | Effects/reactions only |
| Starting Beads in Hand | 3 | Fixed draw at combat start |

## HP Values

| Entity | HP |
|--------|-----|
| Heroes | 4 |
| Bosses | 10 |

## Weapon System

### Weapon Categories
| Category | Example Weapons | Playstyle |
|----------|-----------------|-----------|
| Light Melee | Dagger, Short Sword | Fast attacks, high agility, lower damage |
| Standard Melee | Sword, Axe, Mace, Spear | Balanced stats |
| Heavy Melee | Greatsword, Maul | Slow but powerful, armor piercing |
| Defensive | Sword & Shield | High guard, counter-attacks |
| Ranged | Bow, Crossbow | Distance attacks, positioning |
| Magical | Staff, Wand | Bead-powered special effects |

### Starting Weapons (Step 8)
4 standard melee weapons available at character creation:

| Weapon | Category | Power | Agility | Range | Special |
|--------|----------|-------|---------|-------|---------|
| Sword | Standard | 1 | 1 | 1 | Balanced |
| Axe | Standard | 2 | 0 | 1 | High damage |
| Mace | Standard | 1 | 0 | 1 | Armor piercing potential |
| Spear | Standard | 1 | 1 | 1-2 | Reach |

*Additional weapons (Light, Heavy, Ranged, Magical) added in Step 9.*

### Weapon Properties
- Base Power: Damage modifier
- Base Agility: Hit modifier
- Range: Attack distance (1 = adjacent, 2+ = ranged)
- Special Actions: Unique abilities requiring bead costs (future)

## Armor System

| Type | Armor Bonus | Penalty | Description |
|------|-------------|---------|-------------|
| None | 0 | None | Unarmored |
| Light | 1 | None | Leather, padded |
| Medium | 2 | None | Chain, scale |
| Heavy | 3 | -1 Evasion | Plate, full armor |

## Shield System

| Type | Guard Bonus | Effect |
|------|-------------|--------|
| Buckler | +1 | Can still use off-hand weapon |
| Round Shield | +2 | Standard shield |
| Tower Shield | +3 | -1 Evasion, provides Cover |

## Accessory System

| Type | Effect |
|------|--------|
| Ring of Speed | +1 Evasion |
| Amulet of Might | +1 Power |
| Charm of Focus | +1 starting bead |

## Consumable Items

| Item | Effect | Uses |
|------|--------|------|
| Health Potion | Restore 2 HP | 1 |
| Antidote | Remove poison/burning | 1 |
| Smoke Bomb | Create Obscuring terrain (radius 1) | 1 |
| Oil Flask | Create Damaging terrain (radius 1) | 1 |

## Inventory Structure

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

## Campaign Progression

### Experience & Leveling
| Level | XP Required | Benefit |
|-------|-------------|---------|
| 1 | 0 | Starting level |
| 2 | 100 | +1 attribute point |
| 3 | 250 | Unlock specialization |
| 4 | 450 | +1 attribute point |
| 5 | 700 | Advanced ability |

### Gold & Rewards
| Source | Gold Earned |
|--------|-------------|
| Battle victory | 50-150 based on difficulty |
| Boss defeated | 200+ |
| Optional objectives | 25-50 bonus |
| Found treasure | Variable |

### Between-Battle Phase
After each battle, players can:
1. Rest: Heal all HP, clear conditions
2. Shop: Spend gold on equipment and consumables
3. Train: Allocate earned attribute points
4. Prepare: Adjust inventory and equipment

### Persistent State
| Element | Persists? | Reset Condition |
|---------|-----------|-----------------|
| HP | Yes | Rest between battles |
| Conditions | Yes | Rest or consumable |
| Inventory | Yes | Permanent |
| Gold | Yes | Spent at shop |
| XP/Level | Yes | Permanent |
| Beads in hand | No | Reset each battle |

## Character Persistence

### Storage
- **Primary**: localStorage (JSON format)
- **Backup**: Import/Export to JSON files

### Character Data Structure
```json
{
  "id": "uuid",
  "name": "Character Name",
  "attributes": { "str": 3, "dex": 3, "mnd": 3, "spr": 3 },
  "weapon": "sword",
  "isDefault": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Limits & Rules
| Rule | Value |
|------|-------|
| Max custom characters | 10 |
| Default characters | 4 (read-only, non-deletable) |
| Name max length | 20 characters |
| Name uniqueness | Required |

### Operations
- **Create**: Add new character (if under limit)
- **Edit**: Modify name, attributes, weapon (custom characters only)
- **Delete**: Remove character with confirmation (custom characters only)
- **Export**: Download all characters as JSON file
- **Import**: Load characters from JSON file (merges with existing)

### Character Identification
- First letter of name displayed on battle grid token
- Full name shown in Hero Selection Bar and Selected Hero Panel

---

# DEPRECATED FEATURES

The following features from previous iterations are replaced by the new systems:

| Old Feature | Replacement |
|-------------|-------------|
| Turn-based phases | Action Wheel |
| TurnManager system | ActionWheel system |
| Random monster attack selection | Bead-based state machine |
| Complex HP/damage numbers | Simplified HP (4/10) |
| Cooldown-based abilities | Bead-cost abilities |
| Speed stat for turn order | Wheel cost per action |
| Character classes (Knight, Ranger, etc.) | Attribute-based customization |
| Derived stats (HP from SPR, Evasion from DEX) | Fixed stats, attributes affect bead bag only |
| Fixed bead bag (3 of each color) | Attribute-based bead composition |
| Party size selector | 4 character slots with individual selection |

---

# ARCHITECTURE PRINCIPLES

## Two-Phase Turn Resolution

Turn resolution separates state computation from visual animation:

1. **Phase 1 (State)**: All game state changes computed first
2. **Phase 2 (Visual)**: All animations play after state is finalized
3. **Advance turn**: Only after animations complete

This ensures atomic state changes and testable logic without Phaser dependencies.

## Event-Driven Animation

Actions return events describing what happened, not how to animate:

| Component | Responsibility |
|-----------|----------------|
| Entity (Character/Monster) | Compute state changes, return AnimationEvent[] |
| AnimationExecutor | Interpret events, delegate to Visuals |
| Visual classes | Own their specific animations |
| BattleScene | Orchestrate phases, no direct tween creation |

## Visual Ownership

Each Visual class owns its animations:
- EntityVisual: movement, damage flash, health updates
- CharacterVisual: rest feedback
- MonsterVisual: bead draw, state change

Visuals expose Promise-based animation methods. BattleScene awaits them.

## Two-Step Actions

Multi-step actions (like movement) separate UI feedback from turn consumption:

1. **Show Options**: Pure UI feedback, no state change, no turn cost
2. **Execute Choice**: Full two-phase resolution, turn advances

Example: Click Move button (shows tiles) → Click destination (executes move)
