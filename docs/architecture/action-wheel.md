# Action Wheel

## Summary

The Action Wheel is an 8-segment circular system for tracking turn order. Creatures occupy positions 0-7, and the entity at the lowest position acts next. When multiple entities share a position, FIFO arrival order determines precedence. After acting, entities advance by the "wheel cost" of their action, wrapping around at 8.

## Component List

| Component | Responsibility |
|-----------|----------------|
| `ActionWheel` | Manages entity positions on the wheel and determines turn order |
| `WheelEntry` | Interface representing an entity's position and arrival order |

## Class Diagram

```mermaid
classDiagram
    class WheelEntry {
        <<interface>>
        +id: string
        +position: number
        +arrivalOrder: number
    }

    class ActionWheel {
        -entries: Map~string, WheelEntry~
        -arrivalCounter: number
        +addEntity(id: string, position: number): void
        +removeEntity(id: string): void
        +advanceEntity(id: string, cost: number): void
        +getNextActor(): string | null
        +getPosition(id: string): number | undefined
        +getArrivalOrder(id: string): number | undefined
        +getAllEntities(): WheelEntry[]
        +getEntitiesAtPosition(position: number): WheelEntry[]
        +hasEntity(id: string): boolean
    }

    ActionWheel --> WheelEntry : manages
```

## Sequence Diagrams

### Turn Resolution

```mermaid
sequenceDiagram
    participant Battle as BattleScene
    participant Wheel as ActionWheel

    Battle->>Wheel: getNextActor()
    Wheel-->>Battle: entityId

    Note over Battle: Entity performs action

    Battle->>Wheel: advanceEntity(entityId, wheelCost)
    Note over Wheel: position = (position + cost) % 8
    Note over Wheel: arrivalOrder updated (FIFO)
```

### Adding Entities at Battle Start

```mermaid
sequenceDiagram
    participant Battle as BattleScene
    participant Wheel as ActionWheel

    Note over Battle: Initialize combat

    Battle->>Wheel: addEntity("hero-0", 0)
    Battle->>Wheel: addEntity("hero-1", 0)
    Battle->>Wheel: addEntity("monster", 0)

    Battle->>Wheel: getNextActor()
    Wheel-->>Battle: "hero-0" (position 0, arrived first)
```

## Implementation Details

### Position Range
Positions are 0-7 (8 segments). Adding or advancing with values outside this range applies modulo 8.

### Tie-Breaking
When multiple entities share the same position, the one with the lowest `arrivalOrder` acts first (FIFO). After `advanceEntity()`, the entity's arrival order is updated to the current counter value, placing it behind any others at its new position.

### Entity Lifecycle
- `addEntity()` throws if the ID already exists
- `advanceEntity()` throws if the ID does not exist
- `removeEntity()` silently ignores non-existent IDs
