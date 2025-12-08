# Combat System Redesign Plan

Following PRD v4 implementation order.

---

## Step 1: Action Wheel System ✅ COMPLETE

### Completed
- [x] Create `ActionWheel` system class (`src/systems/ActionWheel.ts`)
- [x] Unit tests for wheel mechanics (`features/unit/action-wheel.feature` - 17 scenarios)
- [x] Basic integration (no UI yet)

### Implementation Details
- 8-segment wheel (positions 0-7)
- FIFO tie-breaking for same-position creatures
- Wrap-around at segment 8 → 0
- Add/remove entities from wheel

---

## Step 2: Monster Bead Bag AI ✅ COMPLETE

### Completed
- [x] Create `BeadBag` system class (`src/systems/BeadBag.ts`)
- [x] Create `MonsterStateMachine` class (`src/systems/MonsterStateMachine.ts`)
- [x] Update monster data schema (beads, states, start_state)
- [x] Unit tests for bead mechanics (`features/unit/bead-bag.feature` - 14 scenarios)
- [x] Unit tests for state machine (`features/unit/monster-state-machine.feature` - 11 scenarios)
- [x] Integrate with MonsterToken and MonsterAI
- [x] Add Bead Guardian test monster

### Implementation Details
- BeadBag: draw, peek, auto-reshuffle when empty
- MonsterStateMachine: color-based state transitions
- 4 bead colors: red, blue, green, white
- States define damage, wheel_cost, range, area, transitions

---

## Step 3: Player Bead System ✅ COMPLETE

### Completed
- [x] Create `PlayerBeadHand` class (`src/systems/PlayerBeadHand.ts`)
- [x] Unit tests for hand management (`features/unit/player-bead-hand.feature` - 19 scenarios)
- [x] Integrate with `CharacterToken` (beadHand property, initializeBeadHand(), hasBeadHand())

### Implementation Details
- Three pools: bag, hand, discard
- Default: 3 beads of each color (12 total)
- `drawToHand(count)`: Moves beads from bag to hand
- `spend(color)`: Moves bead from hand to discard
- `canAfford(costs)`: Checks if hand has required beads
- Auto-reshuffle when bag empties

---

## Step 4: Combat Integration ✅ COMPLETE

### Completed
- [x] Replace TurnManager with ActionWheel in BattleScene
- [x] Implement basic actions (Move, Run, Attack, Rest)
- [x] Update HP values (heroes: 3, bosses: 10)
- [x] Add wheel and bead UI visualization
- [x] E2E testing (19 new scenarios)
- [x] Convert all monsters to bead-based AI

### Implementation Details
- Continuous turn loop using `processTurn()` → `getNextActor()` → execute → `advanceEntity()`
- Actions: Move (cost 1, 2 spaces), Run (cost 2, 6 spaces), Attack (cost 2, 1 damage), Rest (cost 2, draw 2 beads)
- All 4 monsters now use bead-based state machines
- Removed phase state machine and hasMoved/hasActed flags
- UI: 8-segment wheel display, colored bead circles, monster discard counter

---

## Step 5: Turn Enforcement Bug Fix ⏳ PENDING

### Bug
Currently any player character can be selected and made to act, even when it's not their turn on the action wheel.

### Fix
- [ ] Validate that selected character matches current actor from action wheel
- [ ] Prevent selecting non-active heroes during player turns
- [ ] Auto-select the current actor when their turn begins
- [ ] Gray out or disable non-active hero portraits

---

## Step 6: Battle UI Redesign ⏳ PENDING

### Hero Selection Bar (Below Arena)
- [ ] Create horizontal bar below the arena grid
- [ ] Display hero portraits/icons for each player character
- [ ] Show beads in hand as colored circles under each portrait
- [ ] Show current weapon icon under each portrait (sword placeholder)
- [ ] Show HP indicator for each hero
- [ ] Highlight current actor's portrait
- [ ] Click portrait to select hero (only if it's their turn)

### Selected Hero Panel
- [ ] Create inventory panel (empty slots placeholder)
- [ ] Show action menu when hero is selected
- [ ] Display wheel cost and bead cost for each action
- [ ] Gray out actions that cannot be afforded

### Visual Polish
- [ ] Improve overall color scheme and styling
- [ ] Add clear turn indicator
- [ ] Better visual feedback for selectable vs non-selectable elements

---

## Step 7: Defense and Evasion System ⏳ PENDING

- [ ] Add defensive stats (Armor, Guard, Evasion) to creature schema
- [ ] Add offensive stats (Power, Agility) to attack schema
- [ ] Implement attack resolution: Agility vs Evasion
- [ ] Implement damage resolution: Power vs Defense
- [ ] Implement attack modifiers (Feint, Heavy, Precise, Swift)
- [ ] Implement dodge reaction system
- [ ] UI feedback for combat resolution

---

## Step 8: Character Creation ⏳ PENDING

- [ ] Create `CharacterCreation` scene
- [ ] Implement attribute point allocation (STR, DEX, MND, SPR)
- [ ] Implement derived stat calculation
- [ ] Create character persistence layer
- [ ] Update setup screen for character selection

---

## Step 9: Weapon System ⏳ PENDING

- [ ] Define weapon data schema
- [ ] Create weapon list with stats and special actions
- [ ] Add weapon selection to character creation
- [ ] Link weapons to character combat actions

---

## Step 10: Terrain System ⏳ PENDING

- [ ] Define terrain data schema
- [ ] Create `TerrainSystem` for movement/LoS calculations
- [ ] Implement hazard and tactical terrain effects
- [ ] Update map data format

---

## Step 11: Inventory System ⏳ PENDING

- [ ] Define inventory and item data schemas
- [ ] Create `InventoryManager` system
- [ ] Implement equipment slots and backpack
- [ ] Add Swap Weapon and Use Consumable actions

---

## Step 12: Campaign & Progression ⏳ PENDING

- [ ] Define campaign data structure
- [ ] Create `CampaignManager` system
- [ ] Implement experience and leveling
- [ ] Create between-battle phase UI
- [ ] Implement shop system

---

## Step 13: Monster Variety & Boss Phases ⏳ PENDING

- [ ] Update monster schema for phases
- [ ] Implement phase threshold detection
- [ ] Minion spawning system
- [ ] Environmental interaction actions

---

## Step 14: Print-and-Play Export ⏳ PENDING

- [ ] Character sheet PDF generator
- [ ] Monster card generator
- [ ] Action wheel printable template
- [ ] Rulebook markdown export

---

## Test Results

```
Unit/Integration Tests: 132 passed
E2E Tests: 27 passed
Total: 159 tests passing
```

---

## Previous Work: BattleScene Decomposition ✅ COMPLETE

### New Systems Created (4)
- **GridSystem** - Grid coordinate conversion, position validation
- **MovementValidator** - Movement validation logic with occupation checks
- **CombatResolver** - Attack resolution, damage calculation, range checking
- **MonsterAI** - Monster decision making (targeting, attack selection, movement)

### Architecture

```
src/
├── systems/
│   ├── ActionWheel.ts        # Action wheel turn order (Step 1)
│   ├── BeadBag.ts            # Bead drawing system (Step 2)
│   ├── MonsterStateMachine.ts# Monster state transitions (Step 2)
│   ├── PlayerBeadHand.ts     # Player bead hand management (Step 3)
│   ├── GridSystem.ts         # Grid coordinate conversion
│   ├── MovementValidator.ts  # Movement validation
│   ├── CombatResolver.ts     # Combat resolution
│   ├── MonsterAI.ts          # Monster AI decisions
│   ├── DiceRoller.ts         # Dice rolling
│   ├── TurnManager.ts        # Turn tracking (to be replaced Step 4)
│   └── DataLoader.ts         # Data loading
├── entities/
│   └── Token.ts              # Token entities (CharacterToken has beadHand)
└── scenes/
    └── BattleScene.ts        # Scene orchestrator
```
