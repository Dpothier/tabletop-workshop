import type { BattleState } from '@src/state/BattleState';
import type { BeadCounts } from '@src/types/Beads';

interface BeadSnapshot {
  red: number;
  blue: number;
  green: number;
  white: number;
}

interface CharacterSnapshot {
  id: string;
  name: string;
  position: { x: number; y: number };
  maxHealth: number;
  currentHealth: number;
  equipment: Record<string, string>;
  availableActionIds: string[];
  beadHand: BeadSnapshot;
  beadPool: BeadSnapshot;
  beadDiscard: BeadSnapshot;
}

interface MonsterSnapshot {
  id: string;
  name: string;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  beadBag: BeadSnapshot;
  stateMachine: { states: string[]; currentState: string } | undefined;
}

interface WheelEntrySnapshot {
  id: string;
  position: number;
  arrivalOrder: number;
}

interface ActionSummary {
  id: string;
  name: string;
  category: string;
  cost: unknown;
}

export interface BattleSnapshot {
  arena: { name: string; width: number; height: number };
  characters: CharacterSnapshot[];
  monster: MonsterSnapshot;
  wheelEntries: WheelEntrySnapshot[];
  actionDefinitions: ActionSummary[];
}

function beadCountsToSnapshot(counts: BeadCounts | undefined): BeadSnapshot {
  if (!counts) {
    return { red: 0, blue: 0, green: 0, white: 0 };
  }
  return { red: counts.red, blue: counts.blue, green: counts.green, white: counts.white };
}

export function createBattleSnapshot(state: BattleState): BattleSnapshot {
  const characters: CharacterSnapshot[] = state.characters.map((character) => {
    const pos = state.grid.getPosition(character.id);
    const equipment: Record<string, string> = {};

    // Collect all equipped items
    const knownSlots = ['weapon', 'armor', 'shield', 'offhand', 'accessory'] as const;
    for (const slot of knownSlots) {
      const equip = character.getEquipment(slot as any);
      if (equip) {
        equipment[slot] = equip.id;
      }
    }

    const beadHand = character.getBeadHand();
    const beadHandCounts = beadHand
      ? beadHand.getHandCounts()
      : { red: 0, blue: 0, green: 0, white: 0 };
    const beadBagCounts = beadHand
      ? beadHand.getBagCounts()
      : { red: 0, blue: 0, green: 0, white: 0 };
    const beadDiscardCounts = beadHand
      ? beadHand.getDiscardedCounts()
      : { red: 0, blue: 0, green: 0, white: 0 };

    return {
      id: character.id,
      name: character.getName(),
      position: pos ? { x: pos.x, y: pos.y } : { x: 0, y: 0 },
      maxHealth: character.maxHealth,
      currentHealth: character.currentHealth,
      equipment,
      availableActionIds: character.getAvailableActionIds(),
      beadHand: beadCountsToSnapshot(beadHandCounts),
      beadPool: beadCountsToSnapshot(beadBagCounts),
      beadDiscard: beadCountsToSnapshot(beadDiscardCounts),
    };
  });

  const monsterPos = state.grid.getPosition(state.monsterEntity.id);
  const monsterBeadBag = state.monsterEntity.getBeadBagCounts();
  const monsterStateMachine = state.monsterEntity.getStateMachineConfig();

  const monster: MonsterSnapshot = {
    id: state.monsterEntity.id,
    name: state.monster.name || state.monsterEntity.id,
    position: monsterPos ? { x: monsterPos.x, y: monsterPos.y } : { x: 0, y: 0 },
    health: state.monsterEntity.currentHealth,
    maxHealth: state.monsterEntity.maxHealth,
    beadBag: beadCountsToSnapshot(monsterBeadBag),
    stateMachine: monsterStateMachine,
  };

  const wheelEntries: WheelEntrySnapshot[] = state.wheel.getAllEntities().map((entry) => ({
    id: entry.id,
    position: entry.position,
    arrivalOrder: entry.arrivalOrder,
  }));

  const actionDefinitions: ActionSummary[] = state.actions.map((action) => ({
    id: action.id,
    name: action.name,
    category: action.category,
    cost: action.cost,
  }));

  return {
    arena: {
      name: state.arena.name,
      width: state.arena.width,
      height: state.arena.height,
    },
    characters,
    monster,
    wheelEntries,
    actionDefinitions,
  };
}
