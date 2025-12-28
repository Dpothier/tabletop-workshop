# Rework Action Definition System

## Goal

Replace hard-coded action handlers with a fully data-driven system where actions are defined in YAML with parameters, effects, and options.

## Status: Planning Complete

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Iterator type | Sync generator | BattleScene drives loop, simpler than async |
| Validation | In ActionResolution | Centralized with game context |
| Effects | Chained | Can read previous effect results |
| Animations | From effects | Each effect returns its events |
| Effect references | By ID | Unique per action, options reference by ID |
| Cost structure | Dictionary | `{ time, red, blue, green, white }` |
| Affordability | UI + Resolution | Gray out in UI, validate in resolution |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         YAML                                │
│  action: parameters + effects + options                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ActionResolution                         │
│  1. Collect parameters (generator yields prompts)           │
│  2. Apply option modifiers to effects                       │
│  3. Execute effects in sequence (chained)                   │
│  4. Collect animation events                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Effect Classes                           │
│  MoveEffect, AttackEffect, PushEffect, DrawBeadsEffect...   │
│  - Receive: context, params dict, modifiers, chain results  │
│  - Return: { success, data, events }                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Effect System Foundation ✅ COMPLETE

### Tasks

- [x] Create `src/types/Effect.ts` - effect interfaces
- [ ] Create `src/types/ActionCost.ts` - cost types (moved to Phase 3)
- [x] Create `src/systems/EffectRegistry.ts` - registry class
- [x] Create `src/effects/MoveEffect.ts`
- [x] Create `src/effects/AttackEffect.ts`
- [x] Create `src/effects/DrawBeadsEffect.ts`
- [x] Write unit tests for each effect (20 tests in features/unit/effects.feature)

### Key Types

```typescript
interface EffectDefinition {
  id: string;
  type: string;
  params: Record<string, unknown>;
}

interface EffectResult {
  success: boolean;
  data: Record<string, unknown>;
  events: AnimationEvent[];
}

interface Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    chainResults: Map<string, EffectResult>
  ): EffectResult;
}
```

---

## Phase 2: ActionResolution Class

### Tasks

- [ ] Create `src/types/ActionDefinition.ts` - revised schema
- [ ] Create `src/types/ParameterPrompt.ts` - prompt types
- [ ] Create `src/systems/ActionResolution.ts`
  - [ ] `parametrize()` generator
  - [ ] `provideValue()` / `skip()`
  - [ ] `resolve()` method
  - [ ] `$reference` resolution
  - [ ] Modifier application
  - [ ] Effect chaining
- [ ] Write unit tests

### Key Interface

```typescript
class ActionResolution {
  *parametrize(): Generator<ParameterPrompt>;
  provideValue(key: string, value: unknown): { accepted: boolean; reason?: string };
  skip(key: string): { accepted: boolean; reason?: string };
  getTotalCost(): ActionCost;
  resolve(): ActionResult;
}
```

---

## Phase 3: Cost Utilities

### Tasks

- [ ] Create `src/utils/affordability.ts`
  - [ ] `canAfford(available, required)`
  - [ ] `calculateTotalCost(base, options)`
- [ ] Write unit tests

---

## Phase 4: YAML Migration

### Tasks

- [ ] Update `public/data/actions/core.yaml` to new schema
- [ ] Update `src/systems/DataLoader.ts` if needed

### New Schema Example

```yaml
- id: move
  name: Move
  cost: { time: 1 }
  parameters:
    - key: target
      type: tile
      prompt: "Select tile"
      range: 2
      filter: empty
  effects:
    - id: movement
      type: move
      params:
        destination: $target
```

---

## Phase 5: BattleScene Integration

### Tasks

- [ ] Refactor `BattleScene.executeAction()` to use `ActionResolution`
- [ ] Create prompt UI handlers for each parameter type
  - [ ] Tile selection
  - [ ] Entity selection
  - [ ] Option selection
- [ ] Wire up `resolve()` → animation → turn advance
- [ ] Add cancel action support

### Code to Remove

- `startTileTargeting()`
- `executeEntityAction()`
- `executeImmediateAction()`
- `resolveTileAction()`

---

## Phase 6: UI Affordability

### Tasks

- [ ] Update `SelectedHeroPanel` - gray out unaffordable actions
- [ ] Create `OptionSelectionUI` component
- [ ] Dynamic option affordability updates

---

## Phase 7: Cleanup

### Tasks

- [ ] Delete `src/systems/ActionHandlers.ts`
- [ ] Remove `ActionHandlerRegistry` usage
- [ ] Remove `targetType` field from types
- [ ] Remove `handlerId` field from types
- [ ] Update tests
- [ ] Run full test suite

---

## Files Summary

### Create

| File | Purpose |
|------|---------|
| `src/types/Effect.ts` | Effect interfaces |
| `src/types/ActionCost.ts` | Cost dictionary type |
| `src/types/ActionDefinition.ts` | Revised action schema |
| `src/types/ParameterPrompt.ts` | Parameter prompt types |
| `src/systems/EffectRegistry.ts` | Effect class registry |
| `src/systems/ActionResolution.ts` | Resolution orchestrator |
| `src/effects/MoveEffect.ts` | Move effect |
| `src/effects/AttackEffect.ts` | Attack effect |
| `src/effects/DrawBeadsEffect.ts` | Draw beads effect |
| `src/effects/PushEffect.ts` | Push effect (for knockback) |
| `src/utils/affordability.ts` | Cost calculation utils |

### Modify

| File | Changes |
|------|---------|
| `src/scenes/BattleScene.ts` | Use ActionResolution |
| `src/ui/SelectedHeroPanel.ts` | Affordability checks |
| `public/data/actions/core.yaml` | New schema |
| `src/systems/DataLoader.ts` | Schema updates if needed |

### Delete

| File | Reason |
|------|--------|
| `src/systems/ActionHandlers.ts` | Replaced by Effect classes |

---

## YAML Schema Reference

```yaml
actions:
  - id: power_attack
    name: Power Attack
    description: "A powerful attack with enhancement options"

    cost:
      time: 2
      red: 1

    parameters:
      - key: target
        type: entity
        prompt: "Select target"
        filter: enemy
        range: 1

      - key: enhancements
        type: option
        prompt: "Enhance?"
        optional: true
        multiSelect: true
        options:
          - id: extra_damage
            label: "+1 Damage"
            cost: { red: 1 }
          - id: knockback
            label: "Knockback"
            cost: { green: 1 }

    effects:
      - id: baseAttack
        type: attack
        params:
          targetEntity: $target
          damage: 1

    options:
      extra_damage:
        modifies: baseAttack
        modifier:
          damage: +1

      knockback:
        adds:
          - id: knockbackEffect
            type: push
            params:
              targetEntity: $target
              distance: 1
              condition: $baseAttack.hit
```
