# Architecture Documentation Index

This document indexes all architecture documentation for the tabletop workshop project.

## Architecture Overview

The codebase follows a **State/Visual separation** pattern:

```
BattleScene (Thin Orchestrator)
├── State Layer (Pure Logic)
│   ├── BattleGrid      → Single source of truth for positions
│   ├── ActionWheel     → Single source of truth for turn order
│   ├── Character[]     → Own health, beads, actions
│   └── MonsterEntity   → Owns health, beadBag, stateMachine, AI
│
└── Visual Layer (Pure Rendering)
    ├── CharacterVisual → Character sprites, health bars, selection
    └── MonsterVisual   → Monster sprites, health bars
```

**Data flow**: State changes → `syncVisuals()` → Visual updates

## State Layer

| Component | Responsibility | Documentation |
|-----------|----------------|---------------|
| `BattleGrid` | Position management, distance queries, movement validation | - |
| `ActionWheel` | Turn order using 8-segment wheel | [action-wheel.md](./action-wheel.md) |
| `Character` | Player entity: health, beadHand, action resolution | - |
| `MonsterEntity` | Monster entity: health, beadBag, stateMachine, AI decisions | [bead-system.md](./bead-system.md) |
| `Entity` | Abstract base class for Character and MonsterEntity | - |

## Visual Layer

| Component | Responsibility | Documentation |
|-----------|----------------|---------------|
| `EntityVisual` | Base class for visual components | - |
| `CharacterVisual` | Character rendering, selection ring, click handling | - |
| `MonsterVisual` | Monster rendering, health bar | - |

## Support Systems

| System | Responsibility | Documentation |
|--------|----------------|---------------|
| `BeadBag` | Probabilistic bead drawing for monster AI | [bead-system.md](./bead-system.md) |
| `MonsterStateMachine` | State transitions driven by bead colors | [bead-system.md](./bead-system.md) |
| `PlayerBeadHand` | Player bag, hand, and discard management | [bead-system.md](./bead-system.md) |
| `DataLoader` | YAML data loading for game assets | - |

## Scenes

| Scene | Responsibility | Documentation |
|-------|----------------|---------------|
| `BattleScene` | Thin orchestrator: routes input, triggers turns, syncs visuals | - |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| BattleGrid owns all positions | Single source of truth prevents sync issues |
| Entities don't know turn order | ActionWheel is the authority for initiative |
| State/Visual separation | Enables unit testing without Phaser dependencies |
| MonsterEntity owns its AI | `decideTurn()` encapsulates bead draw + state transition + targeting |

---

*Documentation marked with `-` is pending creation.*
