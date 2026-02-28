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

## Standard Terms & Effects

### Hit
An attack **hits** when the attacker's Agility is strictly greater than the target's Evasion (Agility > Evasion). If Evasion ≥ Agility, the target **dodges** and the attack has no effect (unless otherwise specified).

### Guarded
An attack is **guarded** when the target's Guard alone is greater than or equal to the attack's Power (Guard ≥ Power). This is distinct from the attack being blocked by Armor — only Guard counts for effects that trigger on a guarded attack (e.g., Sword's Riposte).

### Knockback (Forced Movement)
Knockback pushes a creature in a straight line directly away from the source.

**Distance:** The knockback distance is determined by the effect that causes it (e.g., Power - Guard for Mace's Knockback action).

**Collision with terrain:** If a creature cannot move the full knockback distance because of impassable terrain or the edge of the arena, it takes a collision attack with Power = remaining distance that could not be traveled. This collision attack has Agility 0 (cannot dodge) and ignores Guard (compared against Armor only).

**Collision with another creature:** If a knocked-back creature collides with another creature, both creatures are affected:
- The knocked-back creature takes collision damage as above (Power = remaining distance, Agility 0, ignores Guard).
- The blocking creature takes a collision attack with the same Power and Agility 0, but **can dodge** if it has any Evasion (Evasion > 0). If it doesn't dodge, damage is compared against its Armor (Guard ignored).

**Zero distance:** If the knockback distance is 0 or less, no knockback occurs.

### Round
A **round** is one full rotation of the action wheel. A round begins when the wheel's active position passes the starting segment (segment 0) and ends when it returns to segment 0. All creatures on the wheel act at least once per round (possibly more, depending on wheel costs). Effects that trigger "at the end of each round" resolve when the active position crosses segment 0.

### Bleed
A creature that is **bleeding** loses 1 HP at the end of each round (when the action wheel crosses segment 0). Bleed stacks — a creature with 2 bleed effects loses 2 HP per round. Bleed lasts indefinitely until cured (by healing effects, consumables, or other abilities). Bleed is applied when an attack that inflicts bleed deals damage.

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
| Axe | Standard | 1 | 0 | 1 | Cleave potential |
| Mace | Standard | 1 | 0 | 1 | Armor piercing potential |
| Spear | Standard | 1 | 1 | 2 | Reach |

*Additional weapons (Light, Heavy, Ranged, Magical) added in Step 9.*

### Weapon Properties
- Base Power: Damage modifier
- Base Agility: Hit modifier
- Range: Attack distance (1 = adjacent, 2+ = ranged)
- Special Actions: Unique abilities requiring bead costs

### Weapon Special Actions (Step 9)

Each weapon grants unique special actions. These are either **attack modifiers** (enhance the basic Attack action) or **defensive reactions** (triggered when the character is attacked).

#### Sword — Special Actions

| Action | Type | Bead Cost | Condition | Effect |
|--------|------|-----------|-----------|--------|
| Parade | Defensive Reaction | 1 Red | When attacked | +1 Guard against current attack |
| Riposte | Defensive Reaction | 1 Green | Attack is guarded (Guard alone ≥ Power) | Deal 1 direct damage to attacker |
| Percer | Attack Modifier | 1 Green | Target has Guard=0 AND Evasion=0 | Attack ignores Armor |

**Parade** stacks with the base defensive reaction (discard red bead → +1 Guard). A sword-wielding character can spend up to 2 red beads for +2 Guard total against a single attack.

**Riposte** triggers only when Guard alone is sufficient to block the attack (Guard ≥ Attack Power). Armor and Evasion contributions do not count — the attack must be fully stopped by Guard.

**Percer** can only be chosen when the target currently has 0 Guard and 0 Evasion. It modifies the basic Attack action (same wheel cost of 2).

#### Axe — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Cleave | Attack Modifier | 1 Red | (base attack: 2) | — | Attack targets two adjacent tiles. Each enemy on those tiles is resolved separately. If a large enemy occupies both tiles, the attack affects it twice (two separate resolutions). |
| Hack | Attack Modifier | 1 Red | (base attack: 2) | — | +1 Power to the attack |
| Hook | Action | 1 Green | 1 | — | Reduce target's Guard to 0 until its next turn |

**Cleave** targets two tiles that must both be adjacent to the attacker AND adjacent to each other. Against two different enemies: two independent attack resolutions. Against one large enemy spanning both tiles: two resolutions against the same defense stats — if the attack hits, damage is dealt twice.

**Hack** simply adds 1 to the attack's Power. Stacks with the axe's base Power of 1 for a total of 2.

**Hook** is a standalone action (not an attack modifier). It does no damage but removes the target's Guard, enabling follow-up attacks from allies. Guard returns when the target takes its next turn.

#### Mace — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Crush | Attack Modifier | 1 Red | (base attack: 2) | — | Attack ignores Armor |
| Knockback | Attack Modifier | 1 Red | +1 (total: 3) | Attack hits (not dodged) AND Power > Guard | Push target back X spaces, where X = Power - Guard. Collision rules apply (see Standard Terms). |
| Bash | Attack Modifier | 1 Red | (base attack: 2) | — | +1 Power to the attack |

**Crush** makes the attack bypass Armor entirely — only Guard can prevent damage. This is the "Heavy" modifier applied via bead cost.

**Knockback** adds +1 to the base attack's wheel cost (total 3). The knockback only occurs if the attack hits (Agility > Evasion) and Power exceeds Guard. Distance = Power - Guard. See "Knockback (Forced Movement)" in Standard Terms for collision rules.

**Bash** simply adds 1 to the attack's Power. Stacks with the mace's base Power of 1 for a total of 2.

#### Spear — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Percer | Attack Modifier | 1 Green | (base attack: 2) | Target has Guard=0 AND Evasion=0 | Attack ignores Armor |
| Extend | Attack Modifier | 1 Green | (base attack: 2) | — | +1 Range to the attack |
| Intercept | Defensive Reaction | 1 Green | — | A creature enters range 2 of the spear wielder | Make an attack (Power 1, Agility 1) against the moving creature. Can be enhanced with other attack modifiers (e.g., Percer) but not Extend. If the attack deals damage, the creature's movement is interrupted and it stops on the tile where it entered range 2. |

**Percer** is identical to the Sword's Percer — ignores Armor when the target has no Guard and no Evasion.

**Extend** increases the attack's range by 1 (e.g., base range 2 becomes 3). Only applies to the single attack it modifies.

**Intercept** is a reaction triggered when any creature moves into a tile at range 2 from the spear wielder. The attack is resolved immediately during the creature's movement. If damage is dealt, the movement stops — the creature remains at range 2. The creature can still resolve any remaining actions on its turn, but its movement is over. Intercept cannot be combined with Extend (the reaction only triggers at range 2, not beyond).

**Range 2 only:** The spear can only attack at range 2 — it **cannot** attack adjacent enemies (range 1). This is an intentional weakness that encourages tactical positioning and makes the spear distinct from other standard weapons.

### Light Melee Weapons (Step 9)

All light melee weapons share:
- **Base stats:** Power 1, Agility 1, Range 1
- **Light Attack** (common to all light weapons): Wheel cost 1, Power 1, Agility 1. Cannot be enhanced with any attack modifiers. This makes light weapons efficient at dealing damage to undefended targets.
- **2 special actions** per weapon (instead of 3 for standard weapons)

| Weapon | Category | Power | Agility | Range | Special |
|--------|----------|-------|---------|-------|---------|
| Rondel Dagger | Light | 1 | 1 | 1 | Defensive piercing |
| Throwing Dagger | Light | 1 | 1 | 1 | Ranged option |
| Slicing Dagger | Light | 1 | 1 | 1 | Bleed damage |
| Hatchet | Light | 1 | 1 | 1 | Ranged + control |

#### Rondel Dagger — Special Actions

| Action | Type | Bead Cost | Condition | Effect |
|--------|------|-----------|-----------|--------|
| Percer | Attack Modifier | 1 Green | Target has Guard=0 AND Evasion=0 | Attack ignores Armor |
| Parade | Defensive Reaction | 1 Red | When attacked | +1 Guard against current attack |

Shares Percer and Parade with the Sword. Combined with Light Attack, the Rondel Dagger excels at pressuring unarmored targets with fast, cheap attacks.

#### Throwing Dagger — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Throw | Action | 1 Green | 2 | — | Ranged attack (range 1-6, Power 1, Agility 1). On hit: the weapon is dropped on the target's tile. On dodge: the weapon lands at the end of its maximum trajectory (6 tiles in the thrown direction). The wielder loses access to the weapon until it is recovered. |
| Parade | Defensive Reaction | 1 Red | When attacked | +1 Guard against current attack |

**Throw** is a full action (not a modifier). After throwing, the character has no equipped weapon — no standard attack, no light attack, no Parade — until they pick up the dagger (move to its tile) or swap to another weapon from inventory.

#### Slicing Dagger — Special Actions

| Action | Type | Bead Cost | Condition | Effect |
|--------|------|-----------|-----------|--------|
| Deep Cut | Attack Modifier | 1 Green | Attack deals damage | Target gains Bleed (see Standard Terms). Stacks with existing Bleed. |
| Parade | Defensive Reaction | 1 Red | When attacked | +1 Guard against current attack |

**Deep Cut** only applies Bleed if the attack actually deals damage (hits and overcomes defense). Multiple Deep Cuts on the same target stack — each adds a separate Bleed effect.

#### Hatchet — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Throw | Action | 1 Green | 2 | — | Ranged attack (range 1-6, Power 1, Agility 1). On hit: weapon dropped on target's tile. On dodge: weapon lands at end of trajectory. Wielder loses weapon until recovered. |
| Hook | Action | 1 Green | 1 | — | Reduce target's Guard to 0 until its next turn |

**Throw** is identical to the Throwing Dagger's Throw.

**Hook** is identical to the Axe's Hook — a standalone action that strips the target's Guard, enabling follow-up attacks.

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
