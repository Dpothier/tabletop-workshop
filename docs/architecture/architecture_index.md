# Architecture Documentation Index

This document indexes all architecture documentation for the tabletop workshop project.

## Architecture Overview

The codebase follows a **State/Visual separation** pattern with **Builder-based construction**:

```
MenuScene
    │
    └── BattleBuilder (constructs state)
            │
            ├── withMonster(), withArena(), withPartySize()
            │
            └── build() → BattleState
                              │
                              ▼
BattleScene (Thin Orchestrator)
├── State Layer (received from BattleBuilder)
│   ├── BattleGrid      → Single source of truth for positions
│   ├── ActionWheel     → Single source of truth for turn order
│   ├── Character[]     → Own health, beads, actions
│   └── MonsterEntity   → Owns health, beadPool, stateMachine, AI
│
├── Action System
│   ├── ActionRegistry        → Action definitions from YAML
│   ├── ActionHandlerRegistry → Handler functions for execution
│   └── executeAction()       → Data-driven dispatch by targetType
│
└── Visual Layer (Pure Rendering)
    ├── CharacterVisual → Character sprites, health bars, selection
    └── MonsterVisual   → Monster sprites, health bars
```

**Data flow**: State changes → `syncVisuals()` → Visual updates

## Battle Construction

| Component | Responsibility | Documentation |
|-----------|----------------|---------------|
| `BattleState` | Interface defining all battle state objects | - |
| `BattleBuilder` | Fluent builder for constructing BattleState | - |

**Builder pattern**: MenuScene configures the builder via `withMonster()`, `withArena()`, `withPartySize()`, then calls `build()` to create the complete state. BattleScene receives ready-to-use state and only creates visuals.

## State Layer

| Component | Responsibility | Documentation |
|-----------|----------------|---------------|
| `BattleGrid` | Position management, distance queries, movement validation | - |
| `ActionWheel` | Turn order using 8-segment wheel | [action-wheel.md](./action-wheel.md) |
| `Character` | Player entity: health, beadHand, action resolution | - |
| `MonsterEntity` | Monster entity: health, beadPool, stateMachine, AI decisions | [bead-system.md](./bead-system.md) |
| `Entity` | Base class for Character and MonsterEntity | - |

## Action System

| Component | Responsibility | Documentation |
|-----------|----------------|---------------|
| `ActionRegistry` | Stores action definitions loaded from YAML | - |
| `ActionHandlerRegistry` | Maps handler IDs to execution functions | - |
| `ActionDefinition` | Data structure: id, name, cost, handlerId, targetType, range, damage | - |

**Action targeting**: Each action has a `targetType` that determines dispatch:
- `tile` → Show movement range, wait for tile click (move, run)
- `entity` → Auto-target enemy (attack)
- `none` → Execute immediately (rest)

**Flow**: `executeAction(actionId)` → dispatch by `targetType` → `Character.resolveAction()` → `ActionHandlerRegistry.execute()` → `ActionResult`

## Visual Layer

| Component | Responsibility | Documentation |
|-----------|----------------|---------------|
| `EntityVisual` | Base class for visual components | - |
| `CharacterVisual` | Character rendering, selection ring, click handling | - |
| `MonsterVisual` | Monster rendering, health bar | - |

## Bead System

| System | Responsibility | Documentation |
|--------|----------------|---------------|
| `BeadPile` | Simple bead collection (hand or discard) | [bead-system.md](./bead-system.md) |
| `BeadPool` | Draw bag with auto-reshuffle from linked discard | [bead-system.md](./bead-system.md) |
| `PlayerBeadSystem` | Player bag → hand → discard composition | [bead-system.md](./bead-system.md) |
| `MonsterStateMachine` | State transitions driven by bead colors | [bead-system.md](./bead-system.md) |

## Data Loading

| System | Responsibility | Documentation |
|--------|----------------|---------------|
| `DataLoader` | YAML data loading for game assets | - |

**Data files** (in `public/data/`):
- `actions/core.yaml` - Action definitions (move, run, attack, rest)
- `characters/classes.yaml` - Character class definitions
- `monsters/index.yaml` - Monster definitions with bead configs
- `arenas/index.yaml` - Arena layouts and spawn points
- `equipment/core.yaml` - Equipment definitions

## Scenes

| Scene | Responsibility | Documentation |
|-------|----------------|---------------|
| `MenuScene` | Game setup: monster/arena selection, party size | - |
| `BattleScene` | Thin orchestrator: routes input, triggers turns, syncs visuals | - |
| `VictoryScene` | End game display | - |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| BattleGrid owns all positions | Single source of truth prevents sync issues |
| Entities don't know turn order | ActionWheel is the authority for initiative |
| State/Visual separation | Enables unit testing without Phaser dependencies |
| MonsterEntity owns its AI | `decideTurn()` encapsulates bead draw + state transition + targeting |
| ActionHandlerRegistry uses context | Handlers access grid/entities without tight coupling |
| YAML-defined actions | Data-driven design allows easy action customization |
| BeadPool.draw() doesn't auto-discard | Consumer controls when/where beads go after use |
| BattleBuilder constructs state | MenuScene configures, BattleScene receives ready state |
| targetType drives dispatch | Adding actions requires only YAML changes, no code |

---

*Documentation marked with `-` is pending creation.*
