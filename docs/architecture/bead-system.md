# Bead System

## Summary

The bead system provides resource management for both monsters and players through colored bead drawing.

**For monsters**: Beads drive a probabilistic state machine that determines monster actions. Players can track drawn beads to predict likely behaviors.

**For players**: Beads serve as action costs. Players draw beads to their hand and spend them to perform special actions.

Four bead colors exist: `red`, `blue`, `green`, `white`.

## Architecture

The bead system uses three composable abstractions:

```
Monster:                    Player:
┌──────────┐               ┌──────────┐
│ BeadPool │               │ BeadPool │
└────┬─────┘               └────┬─────┘
     │ draw()                   │ draw()
     ▼                          ▼
┌──────────┐               ┌──────────┐
│ BeadPile │               │ BeadPile │ (hand)
│ (discard)│               └────┬─────┘
└──────────┘                    │ spend()
     ↑                          ▼
     │ reshuffle()         ┌──────────┐
     └─────────────────────│ BeadPile │ (discard)
                           └──────────┘
```

**Key design**: `BeadPool.draw()` only removes from pool. It does NOT auto-discard. The consumer decides where the bead goes next.

## Component List

| Component | Responsibility |
|-----------|----------------|
| `BeadPile` | Simple bead collection with add/remove/clear operations |
| `BeadPool` | Draw bag that auto-reshuffles from linked discard pile when empty |
| `PlayerBeadSystem` | Composition of Pool → Hand → Discard for player bead management |
| `MonsterStateMachine` | Tracks monster current state, executes color-based transitions |
| `MonsterEntity` | Owns BeadPool + BeadPile + StateMachine, integrates AI via `decideTurn()` |
| `Character` | Owns PlayerBeadSystem instance for player characters |

## Class Diagram

```mermaid
classDiagram
    class BeadPile {
        -beads: Map~BeadColor, number~
        +add(color, count): void
        +remove(color, count): boolean
        +getCounts(): BeadCounts
        +getTotal(): number
        +isEmpty(): boolean
        +clear(): BeadCounts
    }

    class BeadPool {
        -remaining: Map~BeadColor, number~
        -discard: BeadPile
        -randomFn: () => number
        +draw(): BeadColor
        +getRemainingCounts(): BeadCounts
        +getTotalRemaining(): number
        +isEmpty(): boolean
        -reshuffle(): void
    }

    class PlayerBeadSystem {
        -pool: BeadPool
        -hand: BeadPile
        -discard: BeadPile
        +drawToHand(count): BeadColor[]
        +spend(color): boolean
        +canAfford(costs): boolean
        +getHandCounts(): BeadCounts
        +getBagCounts(): BeadCounts
        +getDiscardedCounts(): BeadCounts
    }

    class MonsterStateMachine {
        -states: Map~string, MonsterState~
        -currentStateName: string
        +getCurrentState(): MonsterState
        +transition(color): MonsterState
        +reset(): void
    }

    class MonsterState {
        <<interface>>
        +name: string
        +damage?: number
        +wheel_cost?: number
        +range?: number
        +transitions: Record~BeadColor, string~
    }

    class MonsterEntity {
        -beadPool?: BeadPool
        -beadDiscard?: BeadPile
        -stateMachine?: MonsterStateMachine
        +decideTurn(targets): MonsterAction
        +executeDecision(decision): AnimationEvent[]
        +getDiscardedCounts(): BeadCounts
    }

    class Character {
        -beadHand?: PlayerBeadSystem
        +drawBeadsToHand(count): string[]
        +getHandCounts(): BeadCounts
    }

    BeadPool --> BeadPile : reshuffles from
    PlayerBeadSystem *-- BeadPool : pool
    PlayerBeadSystem *-- BeadPile : hand
    PlayerBeadSystem *-- BeadPile : discard
    MonsterStateMachine --> MonsterState : uses
    MonsterEntity o-- BeadPool : owns
    MonsterEntity o-- BeadPile : discard
    MonsterEntity o-- MonsterStateMachine : owns
    Character o-- PlayerBeadSystem : owns
```

## Sequence Diagrams

### Monster Turn (Bead-Based AI)

```mermaid
sequenceDiagram
    participant Battle as BattleScene
    participant Monster as MonsterEntity
    participant Pool as BeadPool
    participant Discard as BeadPile
    participant SM as MonsterStateMachine

    Battle->>Monster: decideTurn(targets)
    Monster->>Pool: draw()

    alt pool is empty
        Pool->>Discard: clear()
        Discard-->>Pool: BeadCounts
        Pool->>Pool: add to remaining
    end

    Pool-->>Monster: BeadColor (e.g., "red")
    Monster->>SM: transition(color)
    SM-->>Monster: MonsterState
    Monster->>Discard: add(color)
    Note over Monster: Bead discarded AFTER use

    alt target in range
        Monster-->>Battle: MonsterAction {type: "attack"}
    else target out of range
        Monster-->>Battle: MonsterAction {type: "move"}
    end
```

### Player Bead Usage

```mermaid
sequenceDiagram
    participant Battle as BattleScene
    participant Char as Character
    participant System as PlayerBeadSystem
    participant Pool as BeadPool
    participant Hand as BeadPile
    participant Discard as BeadPile

    Note over Battle: Rest Action - Draw 2 beads
    Battle->>Char: drawBeadsToHand(2)
    Char->>System: drawToHand(2)
    loop 2 times
        System->>Pool: draw()
        Pool-->>System: BeadColor
        System->>Hand: add(color)
    end
    System-->>Char: BeadColor[]

    Note over Battle: Check Action Cost
    Battle->>System: canAfford({red: 1})
    System->>Hand: getCounts()
    System-->>Battle: boolean

    Note over Battle: Execute Action
    Battle->>System: spend("red")
    System->>Hand: remove("red")
    Hand-->>System: true
    System->>Discard: add("red")
    System-->>Battle: true
```

## Implementation Details

### Bead Colors

Four colors: `red`, `blue`, `green`, `white`. Types are defined in `src/types/Beads.ts`:

```typescript
type BeadColor = 'red' | 'blue' | 'green' | 'white';
type BeadCounts = { red: number; blue: number; green: number; white: number };
```

### BeadPile

A simple collection of beads. Used as a hand (beads available to spend) or discard pile.

```typescript
class BeadPile {
  add(color: BeadColor, count?: number): void
  remove(color: BeadColor, count?: number): boolean
  getCounts(): BeadCounts
  getTotal(): number
  isEmpty(): boolean
  clear(): BeadCounts  // removes all, returns what was there
}
```

### BeadPool

A bag you draw from. When empty, reshuffles from a linked discard pile.

```typescript
class BeadPool {
  constructor(initial: BeadCounts, discard: BeadPile, randomFn?)
  draw(): BeadColor           // auto-reshuffles if empty
  getRemainingCounts(): BeadCounts
  getTotalRemaining(): number
  isEmpty(): boolean
}
```

**Draw Mechanics:**
- Weighted random selection based on remaining counts
- Auto-reshuffle when pool empties (clears discard pile, adds to remaining)
- Does NOT add drawn bead to discard - consumer handles this

### PlayerBeadSystem

Composition of Pool → Hand → Discard for player bead management.

```typescript
class PlayerBeadSystem {
  drawToHand(count: number): BeadColor[]  // pool → hand
  spend(color: BeadColor): boolean        // hand → discard
  canAfford(costs: BeadCounts): boolean
  getHandCounts(): BeadCounts
  getBagCounts(): BeadCounts
  getDiscardedCounts(): BeadCounts
}
```

Default initialization: 3 of each color (12 beads total).

### Monster Bead Usage

Monsters use BeadPool + BeadPile directly (no wrapper class):

```typescript
// In MonsterEntity
private beadPool?: BeadPool;
private beadDiscard?: BeadPile;

decideTurn(targets: Entity[]): MonsterAction {
  const drawnBead = this.beadPool.draw();     // remove from pool
  const state = this.stateMachine.transition(drawnBead);  // use it
  this.beadDiscard.add(drawnBead);            // discard after use
  // ... targeting and action selection
}
```

This explicit flow allows the bead color to be used for state transition before being discarded.

### Monster State Definitions

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

### MonsterEntity.decideTurn()

The `decideTurn()` method encapsulates all AI logic:

1. Draw a bead from BeadPool
2. Transition the state machine based on bead color
3. Discard the bead after use
4. Find closest target using BattleGrid distance queries
5. If target is in range: return attack action
6. If target is out of range: calculate movement toward target
7. Return the action with drawn bead and state info for logging

This design keeps all AI decision-making within MonsterEntity, using BattleGrid for spatial queries.
