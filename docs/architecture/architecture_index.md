# Architecture Documentation Index

This document indexes all architecture documentation for the tabletop workshop project.

## Systems

| System | Description | Documentation |
|--------|-------------|---------------|
| ActionWheel | Turn order management using 8-segment wheel | [action-wheel.md](./action-wheel.md) |
| BeadBag | Probabilistic bead drawing for monster AI | [bead-system.md](./bead-system.md) |
| MonsterStateMachine | State transitions driven by bead colors | [bead-system.md](./bead-system.md) |
| PlayerBeadHand | Player bead bag, hand, and discard management | [bead-system.md](./bead-system.md) |
| GridSystem | Hex grid coordinate conversion and validation | - |
| MovementValidator | Movement validation with occupation checks | - |
| CombatResolver | Attack resolution and damage calculation | - |
| MonsterAI | Monster decision making and targeting | - |
| DiceRoller | Dice rolling mechanics | - |
| DataLoader | YAML data loading for game assets | - |

## Entities

| Entity | Description | Documentation |
|--------|-------------|---------------|
| Token | Base class for all game tokens | - |
| CharacterToken | Player character tokens | - |
| MonsterToken | Monster tokens with optional bead AI | - |

## Scenes

| Scene | Description | Documentation |
|-------|-------------|---------------|
| BattleScene | Main combat orchestrator using ActionWheel for turn order | - |

---

*Documentation marked with `-` is pending creation.*
