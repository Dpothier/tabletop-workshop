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

## Step 2: Monster Bead Bag AI ⏳ PENDING

- [ ] Create `BeadBag` system class
- [ ] Create `MonsterStateMachine` class
- [ ] Update monster data schema
- [ ] Unit tests for bead mechanics

---

## Step 3: Player Bead System ⏳ PENDING

- [ ] Create `PlayerBeadHand` class
- [ ] Unit tests for hand management
- [ ] Integrate with character tokens

---

## Step 4: Combat Integration ⏳ PENDING

- [ ] Replace TurnManager with ActionWheel in BattleScene
- [ ] Implement basic actions (Move, Run, Attack, Rest)
- [ ] Update HP values (heroes: 3, bosses: 10)
- [ ] Add wheel and bead UI visualization
- [ ] E2E testing

---

## Step 5: Defense and Evasion System ⏳ PENDING

- [ ] Add defensive stats (Armor, Guard, Evasion) to creature schema
- [ ] Add offensive stats (Power, Agility) to attack schema
- [ ] Implement attack resolution: Agility vs Evasion
- [ ] Implement damage resolution: Power vs Defense
- [ ] Implement attack modifiers (Feint, Heavy, Precise, Swift)
- [ ] Implement dodge reaction system
- [ ] UI feedback for combat resolution

---

## Step 6: Character Creation ⏳ PENDING

- [ ] Create `CharacterCreation` scene
- [ ] Implement attribute point allocation (STR, DEX, MND, SPR)
- [ ] Implement derived stat calculation
- [ ] Create character persistence layer
- [ ] Update setup screen for character selection

---

## Step 7: Weapon System ⏳ PENDING

- [ ] Define weapon data schema
- [ ] Create weapon list with stats and special actions
- [ ] Add weapon selection to character creation
- [ ] Link weapons to character combat actions

---

## Step 8: Terrain System ⏳ PENDING

- [ ] Define terrain data schema
- [ ] Create `TerrainSystem` for movement/LoS calculations
- [ ] Implement hazard and tactical terrain effects
- [ ] Update map data format

---

## Step 9: Inventory System ⏳ PENDING

- [ ] Define inventory and item data schemas
- [ ] Create `InventoryManager` system
- [ ] Implement equipment slots and backpack
- [ ] Add Swap Weapon and Use Consumable actions

---

## Step 10: Campaign & Progression ⏳ PENDING

- [ ] Define campaign data structure
- [ ] Create `CampaignManager` system
- [ ] Implement experience and leveling
- [ ] Create between-battle phase UI
- [ ] Implement shop system

---

## Step 11: Monster Variety & Boss Phases ⏳ PENDING

- [ ] Update monster schema for phases
- [ ] Implement phase threshold detection
- [ ] Minion spawning system
- [ ] Environmental interaction actions

---

## Step 12: Print-and-Play Export ⏳ PENDING

- [ ] Character sheet PDF generator
- [ ] Monster card generator
- [ ] Action wheel printable template
- [ ] Rulebook markdown export

---

## Test Results

```
Unit/Integration Tests: 88 passed
E2E Tests: 8 passed
Total: 96 tests passing
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
│   ├── ActionWheel.ts       # Action wheel turn order (Step 1)
│   ├── GridSystem.ts        # Grid coordinate conversion
│   ├── MovementValidator.ts # Movement validation
│   ├── CombatResolver.ts    # Combat resolution
│   ├── MonsterAI.ts         # Monster AI decisions
│   ├── DiceRoller.ts        # Dice rolling
│   ├── TurnManager.ts       # Turn tracking (to be replaced Step 4)
│   └── DataLoader.ts        # Data loading
├── entities/
│   └── Token.ts             # Token entities
└── scenes/
    └── BattleScene.ts       # Scene orchestrator
```
