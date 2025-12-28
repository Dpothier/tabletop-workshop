import type { Arena, Monster, CharacterClass } from '@src/systems/DataLoader';
import type { ActionDefinition } from '@src/types/Action';
import type { BattleGrid } from '@src/state/BattleGrid';
import type { ActionWheel } from '@src/systems/ActionWheel';
import type { Character } from '@src/entities/Character';
import type { MonsterEntity } from '@src/entities/MonsterEntity';
import type { Entity } from '@src/entities/Entity';
import type { ActionRegistry } from '@src/systems/ActionRegistry';
import type { ActionHandlerRegistry } from '@src/systems/ActionHandlers';

/**
 * Complete battle state constructed by BattleBuilder.
 * BattleScene receives this fully-formed state and only creates visuals.
 */
export interface BattleState {
  // Config (immutable references)
  readonly arena: Arena;
  readonly monster: Monster;
  readonly classes: CharacterClass[];
  readonly actions: ActionDefinition[];

  // State objects (mutable internals, immutable references)
  readonly grid: BattleGrid;
  readonly wheel: ActionWheel;
  readonly characters: Character[];
  readonly monsterEntity: MonsterEntity;
  readonly entityMap: Map<string, Entity>;

  // Systems
  readonly actionRegistry: ActionRegistry;
  readonly actionHandlerRegistry: ActionHandlerRegistry;
}
