# Bead System

## Summary

The bead system provides resource management for both monsters and players through colored bead drawing.

**For monsters**: Beads drive a probabilistic state machine that determines monster actions. Players can track drawn beads to predict likely behaviors.

**For players**: Beads serve as action costs. Players draw beads to their hand and spend them to perform special actions.

Four bead colors exist: `red`, `blue`, `green`, `white`.

## Component List

| Component | Responsibility |
|-----------|----------------|
| `BeadBag` | Manages monster bead pool, handles drawing and auto-reshuffling when empty |
| `MonsterStateMachine` | Tracks monster current state, executes color-based transitions |
| `MonsterToken` | Owns BeadBag and StateMachine instances for bead-enabled monsters |
| `MonsterAI` | Coordinates bead draw with action selection via `selectBeadBasedAction()` |
| `PlayerBeadHand` | Manages player bag, hand, and discard piles for action costs |
| `CharacterToken` | Owns PlayerBeadHand instance for player characters |

## Class Diagram

```mermaid
classDiagram
    class BeadBag {
        -remaining: Map~BeadColor, number~
        -discarded: Map~BeadColor, number~
        -randomFn: () => number
        +draw(): BeadColor
        +getRemainingCounts(): BeadCounts
        +getDiscardedCounts(): BeadCounts
        +getTotalRemaining(): number
        +isEmpty(): boolean
    }

    class PlayerBeadHand {
        -bag: Map~BeadColor, number~
        -hand: Map~BeadColor, number~
        -discarded: Map~BeadColor, number~
        -randomFn: () => number
        +drawToHand(count: number): BeadColor[]
        +spend(color: BeadColor): boolean
        +canAfford(costs: BeadCounts): boolean
        +getHandCounts(): BeadCounts
        +getBagCounts(): BeadCounts
        +getDiscardedCounts(): BeadCounts
        +getHandTotal(): number
        +getBagTotal(): number
        +isEmpty(): boolean
    }

    class MonsterStateMachine {
        -states: Map~string, MonsterState~
        -startStateName: string
        -currentStateName: string
        +getCurrentState(): MonsterState
        +getCurrentStateName(): string
        +transition(color: BeadColor): MonsterState
        +reset(): void
    }

    class MonsterState {
        <<interface>>
        +name: string
        +damage?: number
        +wheel_cost?: number
        +range?: number
        +area?: string
        +transitions: Record~BeadColor, string~
    }

    class MonsterToken {
        +beadBag?: BeadBag
        +stateMachine?: MonsterStateMachine
        +hasBeadSystem(): boolean
    }

    class CharacterToken {
        +beadHand?: PlayerBeadHand
        +initializeBeadHand(): void
        +hasBeadHand(): boolean
    }

    class MonsterAI {
        +selectBeadBasedAction(): BeadBasedAction
    }

    MonsterStateMachine --> MonsterState : uses
    MonsterToken ..o BeadBag : owns
    MonsterToken ..o MonsterStateMachine : owns
    MonsterAI --> BeadBag : uses
    MonsterAI --> MonsterStateMachine : uses
    CharacterToken ..o PlayerBeadHand : owns
```

## Sequence Diagrams

### Monster Bead Draw

```mermaid
sequenceDiagram
    participant Battle as BattleScene
    participant AI as MonsterAI
    participant Bag as BeadBag
    participant SM as MonsterStateMachine

    Battle->>AI: selectBeadBasedAction(beadBag, stateMachine, ...)
    AI->>Bag: draw()

    alt bag is empty
        Bag->>Bag: reshuffle()
    end

    Bag-->>AI: BeadColor (e.g., "red")
    AI->>SM: transition(color)
    SM-->>AI: MonsterState

    alt state has damage
        AI->>AI: find target, check range
        AI-->>Battle: BeadBasedAction {type: "attack", state, drawnBead}
    else state is idle-like
        AI-->>Battle: BeadBasedAction {type: "none", state, drawnBead}
    end
```

### Player Bead Usage

```mermaid
sequenceDiagram
    participant Battle as BattleScene
    participant Token as CharacterToken
    participant Hand as PlayerBeadHand

    Note over Battle: Turn Start
    Battle->>Token: (trigger turn start)
    Token->>Hand: drawToHand(3)
    Hand-->>Token: BeadColor[]

    Note over Battle: Action Selection
    Battle->>Hand: canAfford({red: 1, blue: 0, green: 0, white: 0})
    Hand-->>Battle: boolean

    Note over Battle: Execute Action
    Battle->>Hand: spend("red")
    Hand-->>Battle: true/false
```

## Implementation Details

### Bead Colors
Four colors: `red`, `blue`, `green`, `white`. Both monsters and players use the same `BeadColor` and `BeadCounts` types from `BeadBag.ts`.

### Monster Bead Bag

**Draw Mechanics:**
- Weighted random selection based on remaining counts
- Drawn beads move to discard pile
- Auto-reshuffle when bag empties (all discards return to bag)

**State Definitions:**
States are defined in monster YAML with:
- `damage`, `wheel_cost`, `range`, `area` - action properties
- `transitions` - map of bead color to next state name

Example monster configuration:
```yaml
beads:
  red: 3
  blue: 2
  green: 2
  white: 1
start_state: idle
states:
  idle:
    transitions:
      red: attack
      blue: defend
      green: idle
      white: special
  attack:
    damage: 2
    wheel_cost: 3
    transitions:
      red: attack
      blue: idle
      green: idle
      white: special
```

**Integration:**
`MonsterToken.initializeBeadSystem()` creates BeadBag and StateMachine if monster data includes bead configuration. `hasBeadSystem()` checks availability before using bead-based AI.

### Player Bead Hand

**Three Pools:**
- **Bag**: Source for drawing (default: 3 of each color = 12 beads)
- **Hand**: Beads available for spending on actions
- **Discard**: Spent beads, reshuffled back to bag when bag empties

**Key Operations:**
- `drawToHand(count)`: Moves N beads from bag to hand
- `spend(color)`: Moves specific bead from hand to discard
- `canAfford(costs)`: Checks if hand contains required beads

**Integration:**
`CharacterToken.initializeBeadHand()` creates a PlayerBeadHand with default bead counts. `hasBeadHand()` checks availability. UI integration deferred to Step 4 (Combat Integration).
