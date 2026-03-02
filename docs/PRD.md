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
| Windup + Attack + Strength | 3 | 0 (Windup pays) | Attack with Power 2 |
| Attack + Crush | 2 | 1 Red | Attack ignoring Armor |
| Quick Strike + Attack | 1 | 1 Green | Fast attack (light weapons) |
| Guard | 0 | 1 Red | +1 Guard until next turn |

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
DAMAGE DEALT (1 HP)
```

### Combat Stats

#### Offensive Stats
| Stat | Description |
|------|-------------|
| Power | Penetration strength — compared against Defense to determine if the attack deals damage |
| Agility | Speed/precision, compared against Evasion |

#### Defensive Stats
| Stat | Description |
|------|-------------|
| Armor | Physical protection from equipment |
| Guard | Active blocking from stance/shield |
| Defense | Total = Armor + Guard |
| Evasion | Ability to dodge attacks entirely |

### Attack Modifiers

Attack modifiers enhance the base Attack action. They are declared when the attack is made and can be paid with **beads** (instant) or **Windup** (1w preparation, max 1 per attack for melee). Multiple modifiers can stack on a single attack — Windup pays for one, the rest cost beads.

**Universal modifiers** (available to all melee weapons):
| Modifier | Bead Cost | Windup | Effect |
|----------|-----------|--------|--------|
| Strength | 1 Red | Yes | +1 Power |
| Quick Strike | 1 Green | Yes | -1w on Attack (light weapons only) |

**Weapon-specific modifiers** are listed under each weapon's Special Actions section (Step 9). Examples: Hack (+1 Power, axe/heavy), Crush (ignore Armor, mace), Percer (ignore Armor if Guard=0 and Evasion=0, sword/spear), Cleave (2 targets, axe).

## Standard Terms & Effects

### Economic Principle: 1 Wheel ≈ 1 Bead
Rest (2w) draws 2 beads, establishing a fundamental exchange rate: **1 wheel tick of time ≈ 1 bead of any color**. This equivalence underpins all balance calculations. Any modifier costing 1 bead should be roughly equivalent to 1w of preparation (Windup, Aim). This means the choice between paying with beads (instant but resource-dependent) vs preparation (free but time-consuming and interruptible) is always a meaningful tactical decision, not a strictly better option.

### Damage
All attacks deal **1 damage** when they successfully hit and overcome defense, unless explicitly stated otherwise. Power is not a damage value — it determines whether the attack penetrates defense (Power > Defense, strictly greater — defender wins ties). Damage is always 1 HP lost. Since base Power is 1 and base Defense is 0, standard attacks always damage unmodified targets.

### Hit (Melee)
An attack **hits** when the attacker's Agility is strictly greater than the target's Evasion (Agility > Evasion). The defender wins ties. Since base Agility is 1 and base Evasion is 0, standard attacks hit unmodified targets (1 > 0).

### Guarded
An attack is **guarded** when the target's Guard alone is sufficient to block the attack (Guard ≥ Power). Since Power must be strictly greater than Defense to deal damage, Guard ≥ Power means the attack cannot penetrate Guard alone. Only Guard counts for effects that trigger on a guarded attack (e.g., Sword's Riposte, Shield's Rebuke).

### Any-Color Bead Cost
Some actions cost "1 any color" — the player may spend any single bead from their hand, regardless of color.

### Defensive Reaction Flow
When a character is attacked, reactions are resolved in this order before the attack resolves:

1. **Target** chooses their own defensive reactions (Parade, Block, etc.)
2. **Allies** are solicited in order of proximity to the active position on the action wheel. Each ally with applicable reactions (e.g., Shield Wall) may choose to use them.
3. All Guard/Evasion bonuses are totaled, then the attack resolves (Agility vs Evasion, then Power vs Defense).

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

### Ranged Combat Resolution

Ranged attacks use a single comparison: **Precision vs Difficulty**. This replaces the melee system's two-step resolution (Agility vs Evasion, then Power vs Defense).

```
      Aim (1 wheel) → +1 Precision stack (repeatable)
           ↓ (when ready)
      Shoot (2 wheel)
           ↓
Calculate Precision = Base (1) + Range Band Modifier + Aim Stacks
Calculate Difficulty = Cover + Guard + max(Armor - Penetration, 0)
           ↓
       ┌───┴───┐
       │       │
  Precision  Difficulty ≥ Precision
   > Diff.       ↓
       ↓      Attack MISSES
  HIT → 1 damage
```

**Aim Action** (1 wheel): Grants +1 Precision stack. Stacks are cumulative and persist until:
- The creature takes any action other than Aim or Shoot
- The creature uses a defensive reaction (Block, Parade, etc.)
- The creature takes damage

If none of these occur, Aim stacks are preserved — a well-protected shooter (behind cover, in armor) can aim undisturbed even while being shot at, as long as they don't react and aren't wounded.

**Aim Modifiers:** Beads can be spent when taking the Aim action to gain additional Precision stacks:

| Modifier | Bead Cost | Available To | Effect |
|----------|-----------|-------------|--------|
| Quick Aim | 1 Green | All ranged weapons | +1 additional Precision stack |
| Strong Draw | 1 Red | Longbow only | +1 additional Precision stack |
| Steady Aim | 1 Blue | Crossbow, Arquebus only | +1 additional Precision stack |

Modifiers can be combined on a single Aim action. Example: a Longbow wielder spending 1 Green + 1 Red on one Aim action gains +3 Precision stacks (1 base + 1 Quick Aim + 1 Strong Draw).

**Shoot Action** (2 wheel): Fires the weapon, consuming all Aim stacks. Precision = Base (1) + Range Band Modifier + accumulated Aim stacks.

**Range Bands:** Each weapon defines a precision modifier at three distance bands: 1-6, 7-12, and 13+. All weapons can shoot at any distance — there are no "out of range" bands. Poor bands give negative modifiers, making shots harder but not impossible with sufficient aiming.

**Difficulty components:**
- **Cover:** +1 (partial cover) or +2 (full cover) from terrain.
- **Guard:** Shield Guard bonus. A shield covers vulnerable spots, making them harder to target.
- **Armor (reduced by Penetration):** max(Armor - Penetration, 0). Armor reduces the number of vulnerable spots on the target, but high-penetration weapons negate this.

**Parallel with melee:** At sweet spot (band modifier 0), Shoot mirrors Attack:
- Shoot (2w, Precision 1) = Attack (2w, Power 1) — both hit undefended targets
- Aim (1w, +1 Precision) = Windup (1w, pays for +1 Power modifier) — both overcome +1 defense for 1w
- Aim+Shoot (3w, Precision 2) = Windup+Attack+Strength (3w, Power 2) — both overcome defense 1 for 3w

**Key differences from melee:**
- No Evasion — you cannot dodge a projectile
- Armor contributes to Difficulty (harder to find weak points) rather than damage reduction
- Guard works the same way conceptually (shield covers weak spots)
- Distance affects Precision (via range bands), not Difficulty
- Aim is deterministic (+1 certain), Strength requires drawing the right bead color (stochastic)
- Defensive reactions that grant Guard still apply (Block, Parade, etc.)
- All ranged hits deal 1 damage (same as melee)

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
| Support | Banner, Horn | Ally buffs, resource sharing, wheel manipulation (blue/white beads) |
| Magical | Staff, Wand | Bead-powered special effects |

### Starting Weapons (Step 8)
4 standard melee weapons available at character creation:

| Weapon | Category | Range | Slots | Special |
|--------|----------|-------|-------|---------|
| Sword | Standard | 1 | 2 | Balanced, defensive |
| Axe | Standard | 1 | 2 | Multi-target, control |
| Mace | Standard | 1 | 2 | Armor breaking, knockback |
| Spear | Standard | 2 only | 2 | Reach, interception |

*Additional weapons (Light, Heavy, Defensive, Ranged, Support, Magical) added in Step 9.*

### Weapon Properties
- **Range:** Attack distance (1 = adjacent, 2 = two tiles away). Weapons can only attack at their listed range.
- **Slots:** Equipment slot cost (determines encumbrance impact)
- **Special Actions:** Unique abilities requiring bead costs

**All melee attacks use Power 1, Agility 1 as base stats**, regardless of weapon. Weapons differentiate through their special actions, range, and available modifiers (Quick Strike for light weapons, Hack for heavy weapons, etc.).

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

**Hack** adds 1 to the attack's Power (base 1 + Hack 1 = total 2).

**Hook** is a standalone action (not an attack modifier). It does no damage but removes the target's Guard, enabling follow-up attacks from allies. Guard returns when the target takes its next turn.

#### Mace — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Crush | Attack Modifier | 1 Red | (base attack: 2) | — | Attack ignores Armor |
| Knockback | Attack Modifier | 1 Red | +1 (total: 3) | Attack hits (not dodged) AND Power > Guard | Push target back X spaces, where X = Power - Guard. Collision rules apply (see Standard Terms). |
| Bash | Attack Modifier | 1 Red | (base attack: 2) | — | +1 Power to the attack |

**Crush** makes the attack bypass Armor entirely — only Guard can prevent damage. Can be paid via bead or Windup.

**Knockback** adds +1 to the base attack's wheel cost (total 3). The knockback only occurs if the attack hits (Agility > Evasion) and Power exceeds Guard. Distance = Power - Guard. See "Knockback (Forced Movement)" in Standard Terms for collision rules.

**Bash** adds 1 to the attack's Power (base 1 + Bash 1 = total 2).

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

### Melee Attack System

**One attack action: Attack (2w, Power 1, Agility 1).** All melee weapons share this single base attack. There is no separate Light Attack or Heavy Attack — all variation comes from modifiers.

Attack modifiers can be paid in two ways:
- **Bead:** Spend the required bead from hand when declaring the attack (instant, reliable)
- **Windup:** Spend 1w of preparation before the attack (free in beads, but interruptible)

### Preparation (General Concept)

A **preparation** is an action that invests wheel time for a future payoff. All preparations share the same interruption rules — stacks are lost if:
- The creature takes any action other than the preparation or its paired resolution
- The creature uses a defensive reaction (Block, Parade, etc.)
- The creature takes damage

The action wheel is fully visible, so the player can read upcoming enemy turns and judge whether a preparation window is safe — similar to choosing attack windows in a Soulslike.

| Preparation | Cost | Paired With | Effect per stack |
|-------------|------|-------------|-----------------|
| Windup | 1w | Attack | Pays the bead cost of one attack modifier |
| Aim | 1w | Shoot | +1 Precision |
| Rest | 2w | (auto, next turn) | Draw 2 beads at start of next turn |
| Channel | TBD | Cast | (magical actions, to be defined) |

**Windup (1w):** Melee preparation. Pays the bead cost of **one** attack modifier on the next Attack. Maximum 1 windup for melee weapons. The windup replaces any single bead color — it is a universal "pay with time" option.

**Aim (1w):** Ranged preparation. +1 Precision stack per Aim. Can stack multiple times (weapon-dependent max). See Ranged Combat Resolution.

**Rest (2w):** Resource preparation. Draw 2 beads from bag at the **start of your next turn** (not immediately). The 2w cost adds friction — you must be in a safe position. If interrupted before your next turn, the rest is lost and no beads are drawn.

### Universal Actions

| Action | Type | Cost | Range | Effect | Available To |
|--------|------|------|-------|--------|-------------|
| Strength | Attack Modifier | 1 Red or Windup | — | +1 Power on this attack | All melee weapons |
| Guard | Defensive Action | 1 Red | — | +1 Guard until next turn | All characters |
| Quick Strike | Attack Modifier | 1 Green or Windup | — | -1w on this Attack (2w → 1w) | Light melee weapons only |
| Ponder | Rest Modifier | 1 Blue | — | During Rest: draw 4, choose 2, return 2 to bag | All characters |
| Coordinate | Action (1w) | 1 White | 1-6 | Give 1 preparation stack (Windup or Aim) to an ally | All characters |

#### Red — Physical (STR)

**Strength** enhances any melee attack. It is an attack modifier, declared and paid for when the attack is made (or pre-paid via Windup). This is the universal way to overcome Armor — any melee combatant with a Red bead or a safe window for Windup can boost their Power.

**Guard** is a standalone defensive action that can be used proactively (not as a reaction). It grants +1 Guard that persists until the character's next turn on the action wheel. This allows any character to invest in defense, making even unshielded characters able to block base attacks (Guard 1 ≥ Power 1). Guard cannot be paid via Windup — defense must be instant.

#### Green — Agility (DEX)

**Quick Strike** allows light weapons to attack faster by spending a Green bead (or Windup). Quick Strike IS enhanceable — you can stack additional modifiers, but each costs a bead. This makes light weapons efficient for fast strikes while remaining capable of enhanced attacks at higher bead cost.

#### Blue — Mental (MND)

**Ponder** modifies the Rest action. When Resting with Ponder, draw 4 beads total (2 base + 2 extra) from your bag, choose 2 to keep, return the other 2 to the bag. The value is not in quantity (still 2 beads gained) but in **color selection** — you see twice as many options and pick the best match for your upcoming needs. Thematically, mental focus lets you recover more deliberately.

#### White — Spirit (SPR)

**Coordinate** is a standalone support action (1w wheel cost + 1 White bead). Target an ally within range 1-6 and grant them 1 preparation stack of their choice (Windup or Aim). The ally decides which type based on their weapon and situation. Standard preparation interruption rules apply — if the ally takes damage, uses a reaction, or takes an unrelated action before consuming the stack, it is lost. This creates a cooperation dynamic: the coordinator prepares an ally, and the team must protect them until they can capitalize on the preparation. Range 1-6 ensures the coordinator doesn't need to be adjacent, making the 2:1 effective cost ratio (1w + 1W ≈ 2w for 1w of value) worthwhile.

**Coordinate variants** (unlocked by support items, not available by default):

| Variant | Base Cost | Effect | Unlocked By |
|---------|-----------|--------|-------------|
| Swiften | 1w + 1 White | Advance an ally 1 position toward the active position on the wheel | TBD (support item) |
| Bless | 1w + 1 White | Grant the target a **Gold bead** (wildcard — counts as any color) | TBD (support item) |

*Swiften* is the timing-manipulation version of Coordinate — instead of giving preparation, it gives action priority. More powerful than base Coordinate (direct wheel advancement), hence requiring a support item.

*Bless* grants a Gold bead that can be spent as any single bead color. Unlike Coordinate (which gives a preparation stack usable only for Attack/Shoot), the Gold bead is fully flexible — it can pay for attack modifiers, defensive reactions, or any other bead cost. The Gold bead persists in the ally's hand until spent (not subject to preparation interruption rules). More powerful than base Coordinate, hence requiring a support item.

### Light Melee Weapons (Step 9)

All light melee weapons share:
- **Base stats:** Power 1, Agility 1, Range 1
- **Quick Strike** (universal to all light weapons): Attack modifier, 1 Green or Windup, reduces Attack cost by 1w (2w → 1w). Unlike other modifiers, Quick Strike CAN be combined with additional modifiers — each extra modifier costs a bead, making enhanced quick attacks resource-intensive.
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

Shares Percer and Parade with the Sword. Combined with Quick Strike, the Rondel Dagger excels at pressuring unarmored targets with fast 1w attacks, and can enhance them with Percer when the opening is right (1w + 1G Quick Strike + 1G Percer).

#### Throwing Dagger — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Throw | Action | 1 Green | 2 | — | Ranged attack (range 1-6, Power 1, Agility 1). On hit: the weapon is dropped on the target's tile. On dodge: the weapon lands at the end of its maximum trajectory (6 tiles in the thrown direction). The wielder loses access to the weapon until it is recovered. |
| Parade | Defensive Reaction | 1 Red | When attacked | +1 Guard against current attack |

**Throw** is a full action (not a modifier). After throwing, the character has no equipped weapon — no Attack, no Quick Strike, no Parade — until they pick up the dagger (move to its tile) or swap to another weapon from inventory.

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

### Heavy Melee Weapons (Step 9)

All heavy melee weapons share:
- **Two-handed:** Cannot equip a shield or off-hand weapon
- **No Quick Strike** — heavy weapons cannot reduce Attack cost
- **Hack** (common to all heavy weapons): Attack Modifier, 1 Red or Windup, +1 Power to the attack
- **3 special actions** per weapon (in addition to Hack)

| Weapon | Category | Range | Slots | Special |
|--------|----------|-------|-------|---------|
| Greatsword | Heavy | 1 | 3 | Versatile swordplay |
| Greataxe | Heavy | 1 | 3 | Multi-target specialist |
| Warhammer | Heavy | 1 | 3 | Armor breaking + knockback |
| Halberd | Heavy | 2 only | 3 | Reach control |

#### Greatsword — Special Actions

| Action | Type | Bead Cost | Condition | Effect |
|--------|------|-----------|-----------|--------|
| Parade | Defensive Reaction | 1 Red | When attacked | +1 Guard against current attack |
| Percer | Attack Modifier | 1 Green | Target has Guard=0 AND Evasion=0 | Attack ignores Armor |
| Cleave | Attack Modifier | 1 Red | — | Attack targets two adjacent tiles (see Axe's Cleave) |

The Greatsword combines the Sword's defensive and piercing capabilities with the Axe's cleave. With Hack (or Windup+Strength), it can reach Power 2 on any attack, or Power 3 with Windup + Hack + Strength (3w + 1R).

#### Greataxe — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Cleave | Attack Modifier | 1 Red | (base attack) | — | Attack targets two adjacent tiles (see Axe's Cleave) |
| Hook | Action | 1 Green | 1 | — | Reduce target's Guard to 0 until its next turn |
| Whirlwind | Action | 1 Red | 3 | — | Attack (Power 1, Agility 1) hitting all adjacent tiles — including allies. Each target resolved independently. Can be enhanced with attack modifiers. |

**Whirlwind** is a more intense version of Cleave — it hits every adjacent tile (up to 8 tiles around the wielder). Allies in range are targeted too. Base Power 1, Agility 1. Can be enhanced with attack modifiers (e.g., Windup + Hack for Power 2).

#### Warhammer — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Crush | Attack Modifier | 1 Red | (base attack) | — | Attack ignores Armor |
| Knockback | Attack Modifier | 1 Red | +1 (total: 3) | Attack hits AND Power > Guard | Push target back X spaces (X = Power - Guard). Collision rules apply (see Standard Terms). |
| Bash | Attack Modifier | 1 Red | (base attack) | — | +1 Power to the attack |

Identical to the Mace's actions. With Windup + Hack + Bash, a Warhammer attack can reach Power 3 (base 1 + Hack 1 + Bash 1) for 3w + 1R (Windup pays one modifier, bead pays the other).

#### Halberd — Special Actions

| Action | Type | Bead Cost | Wheel Cost | Condition | Effect |
|--------|------|-----------|------------|-----------|--------|
| Percer | Attack Modifier | 1 Green | (base attack) | Target has Guard=0 AND Evasion=0 | Attack ignores Armor |
| Extend | Attack Modifier | 1 Green | (base attack) | — | +1 Range to the attack |
| Intercept | Defensive Reaction | 1 Green | — | A creature enters range 2 | Attack (Power 1, Agility 1). If damage dealt, movement interrupted. Cannot combine with Extend. |

Identical to the Spear's actions. With Hack available (via bead or Windup), the Halberd can boost any attack's Power.

**Range 2 only:** Like the Spear, the Halberd cannot attack adjacent enemies (range 1).

### Ranged Weapons (Step 9)

Ranged weapons use the Ranged Combat Resolution system (see Standard Terms). They cannot make melee Attack actions. Instead, they have a **Shoot** action paired with the **Aim** preparation.

**Shoot** (2 wheel): Fires the weapon, consuming all Aim stacks. See Ranged Combat Resolution in Standard Terms.

**Aim** (1 wheel): Grants +1 Precision stack. See Standard Terms for full rules.

**Common properties:**
- **Precision Bands:** Each weapon has a modifier at 3 range bands (1-6, 7-12, 13+) that adjusts Precision based on distance
- **Penetration:** Reduces Armor's contribution to Difficulty
- **Two-handed:** All ranged weapons require both hands except the Pistol

**Precision Bands:**

| Weapon | 1-6 | 7-12 | 13+ |
|--------|-----|------|-----|
| Short Bow | 0 | -1 | -2 |
| Longbow | -1 | 0 | 0 |
| Crossbow | 0 | -1 | -2 |
| Pistol | 0 | -2 | -3 |
| Arquebus | -1 | 0 | 0 |

With Base Precision 1, at the sweet spot each weapon has Precision 1 before aiming — identical to melee Attack (Power 1). This creates a fundamental parallel: **Aim (+1 Precision, 1 wheel) mirrors Strength (+1 Power, 1 Red bead ≈ 1 wheel of Rest)**. Examples:
- Short Bow at range 3: Precision 1 + 0 = 1 (hits undefended targets, needs Aim for defended)
- Longbow at range 8: Precision 1 + 0 = 1 (same baseline)
- Pistol at range 5: Precision 1 + 0 = 1, but at range 10: Precision 1 - 2 = -1 (needs +2 aim minimum)

| Weapon | Category | Slots | Hands | Penetration | Base Wheel | Special |
|--------|----------|-------|-------|-------------|------------|---------|
| Short Bow | Light Ranged | 1 | Two | 0 | 2 | Mobile shooter |
| Longbow | Heavy Ranged | 3 | Two | 0 | 2 | Long-range sniper |
| Crossbow | Standard Ranged | 2 | Two | 1 | 2 | Anti-armor |
| Pistol | Light Ranged | 1 | One | 1 | 2 | Versatile sidearm |
| Arquebus | Heavy Ranged | 3 | Two | 2 | 2 | Maximum penetration |

**One-handed:** Only the Pistol can be wielded with one hand, allowing use alongside a shield or off-hand weapon.

#### Reload Mechanics

**Bows** (Short Bow, Longbow): No reload required. Can Aim and Shoot freely.

**Crossbow** — Load & Shoot:
- **Load** (1 wheel): Prepares the crossbow. No attack. Can be done at any time. Does not break Aim stacks.
- **Shoot** (2 wheel): Fires the crossbow. Requires loaded state. Consumes Aim stacks.
- Sustained cycle: Load (1w) + Shoot (2w) = **3w per shot**.
- The tactical advantage: Load during a safe moment, then Shoot at full 2w cost when the opportunity arises (same as bows when pre-loaded).

**Firearms** (Pistol, Arquebus): Start combat loaded. Must reload after each shot.
- **Reload** (2 wheel): Prepares the firearm for the next shot. Same cost for both Pistol and Arquebus.
- Cannot shoot while unloaded. Reloading does not break Aim stacks.
- Sustained cycle: Shoot (2w) + Reload (2w) = **4w per shot** for both firearms.

#### Aim Modifiers by Weapon

All ranged weapons have access to **Quick Aim** (1 Green) on their Aim action. Some weapons have an additional modifier:

| Weapon | Quick Aim (1G) | Additional Modifier | Max stacks per Aim |
|--------|---------------|--------------------|--------------------|
| Short Bow | Yes | — | +2 |
| Longbow | Yes | Strong Draw (1 Red) | +3 |
| Crossbow | Yes | Steady Aim (1 Blue) | +3 |
| Pistol | Yes | — | +2 |
| Arquebus | Yes | Steady Aim (1 Blue) | +3 |

#### Movement Special: Run & Shoot

Available to **Short Bow** and **Pistol** only.

| Action | Type | Bead Cost | Effect |
|--------|------|-----------|--------|
| Run & Shoot | Movement Modifier | 1 Blue | This Move action does not break Aim stacks |

**Run & Shoot** allows mobile shooters to reposition without losing their accumulated aim. The Short Bow and Pistol excel at hit-and-run tactics — aim, reposition, keep aiming, fire when ready.

## Equipment Slot System

Each character has **8 equipment slots**. All equipped items consume slots. The total number of slots used determines the character's **encumbrance class**, which affects movement and evasion actions.

### Encumbrance Classes

| Class | Slots Used | Effect |
|-------|-----------|--------|
| Light | 1-4 | Improved movement and dodge reactions |
| Normal | 5-6 | Standard movement and dodge reactions |
| Heavy | 7-8 | Reduced movement and dodge reactions |

*Exact movement/dodge values per encumbrance class to be defined.*

### Equipment Slot Costs

| Item Type | Slots | Hands |
|-----------|-------|-------|
| Light melee weapon | 1 | One |
| Standard melee weapon | 2 | One |
| Heavy melee weapon | 3 | Two |
| Light ranged weapon (Short Bow, Pistol) | 1 | Two (Pistol: One) |
| Standard ranged weapon (Crossbow) | 2 | Two |
| Heavy ranged weapon (Longbow, Arquebus) | 3 | Two |
| Buckler | 1 | One (off-hand) |
| Shield | 2 |
| Great Shield | 3 |
| Light armor | 1 |
| Medium armor | 2 |
| Heavy armor | 3 |
| Accessory | 1 |
| Consumable | 1 |

**Two-handed restriction:** Heavy weapons require both hands and cannot be combined with shields or off-hand weapons. Light, Standard, Defensive, Support, and Magical weapons can be wielded alongside a shield or off-hand weapon.

### Defensive Weapons — Shields (Step 9)

Shields are off-hand equipment that provide defensive capabilities. They can be combined with any one-handed weapon.

All shields share:
- **Block** (common to all shields): Defensive Reaction, 1 any-color bead, +1 Guard against current attack.

| Shield | Slots | Passive Guard | Can Attack | Special |
|--------|-------|---------------|------------|---------|
| Buckler | 1 | 0 | Yes | Lightweight defense |
| Shield | 2 | +1 | Yes | Balanced defense |
| Great Shield | 3 | +1 | No | Maximum protection |

Maximum Guard from reactions per shield type:
- **Buckler**: Block (1 any) = +1 Guard → total +1
- **Shield**: passive +1, Block (1 any) = +1 → total +2
- **Great Shield**: passive +1, Block (1 any) + Great Guard (1 red) = +2 → total +3

#### Buckler — Special Actions

| Action | Type | Bead Cost | Condition | Effect |
|--------|------|-----------|-----------|--------|
| Block | Defensive Reaction | 1 any | When attacked | +1 Guard against current attack |
| Riposte | Defensive Reaction | 1 Green | Attack is guarded (Guard ≥ Power) | Deal 1 direct damage to attacker |

**Riposte** is identical to the Sword's Riposte. The Buckler trades passive defense for counter-attack potential — lightweight and aggressive.

#### Shield — Special Actions

| Action | Type | Bead Cost | Condition | Effect |
|--------|------|-----------|-----------|--------|
| Block | Defensive Reaction | 1 any | When attacked | +1 Guard against current attack |
| Rebuke | Defensive Reaction | 1 Red | Attack is guarded (Guard ≥ Power) | Push attacker back X spaces, where X = Guard - Power. Collision rules apply (see Knockback in Standard Terms). |

**Rebuke** triggers after a guarded attack — the shield bash pushes the attacker away. Distance = Guard - Power. Collision with terrain and creatures follows the same rules as Knockback.

#### Great Shield — Special Actions

| Action | Type | Bead Cost | Condition | Effect |
|--------|------|-----------|-----------|--------|
| Block | Defensive Reaction | 1 any | When attacked | +1 Guard against current attack |
| Great Guard | Defensive Reaction | 1 Red | When attacked | +1 Guard against current attack |
| Rebuke | Defensive Reaction | 1 Red | Attack is guarded (Guard ≥ Power) | Push attacker back X spaces (X = Guard - Power). Collision rules apply. |
| Shield Wall | Allied Reaction | 1 Red | Adjacent ally is attacked | +1 Guard to the attacked ally |

**Great Guard** stacks with Block — spend 1 any-color bead (Block) + 1 red bead (Great Guard) for +2 Guard from reactions alone, +3 total with passive Guard.

**Shield Wall** is an allied reaction (see Defensive Reaction Flow in Standard Terms). When an adjacent ally is attacked, the Great Shield wielder can spend 1 red bead to grant that ally +1 Guard. This stacks with the ally's own defensive reactions.

The Great Shield **cannot be used to attack** — its wielder must rely entirely on their main-hand weapon for offense.

## Armor System

| Type | Armor Bonus | Slots | Description |
|------|-------------|-------|-------------|
| None | 0 | 0 | Unarmored |
| Light | 1 | 1 | Leather, padded |
| Medium | 2 | 2 | Chain, scale |
| Heavy | 3 | 3 | Plate, full armor |

## Accessory System

| Type | Slots | Effect |
|------|-------|--------|
| Ring of Speed | 1 | +1 Evasion |
| Amulet of Might | 1 | +1 Power |
| Charm of Focus | 1 | +1 starting bead |

## Consumable Items

| Item | Slots | Effect | Uses |
|------|-------|--------|------|
| Health Potion | 1 | Restore 2 HP | 1 |
| Antidote | 1 | Remove poison/burning | 1 |
| Smoke Bomb | 1 | Create Obscuring terrain (radius 1) | 1 |
| Oil Flask | 1 | Create Damaging terrain (radius 1) | 1 |

## Inventory Structure

Characters equip items into 8 slots. There are no separate "equipped" vs "backpack" zones — all items share the same 8 slots. Encumbrance is determined by total slots used.

```
CHARACTER EQUIPMENT (8 slots)
├── Slot 1: [e.g., Sword - 2 slots]
├── Slot 2: [continued]
├── Slot 3: [e.g., Shield - 2 slots]
├── Slot 4: [continued]
├── Slot 5: [e.g., Light Armor - 1 slot]
├── Slot 6: [e.g., Health Potion - 1 slot]
├── Slot 7: [e.g., Accessory - 1 slot]
└── Slot 8: [empty]
→ Encumbrance: Normal (7 slots used)
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
