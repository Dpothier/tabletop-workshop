import type { BattleSnapshot } from './BattleSnapshot';
import type { Position } from '@src/state/BattleGrid';

export class SnapshotHydrator {
  getInitialPositions(snapshot: BattleSnapshot): Map<string, Position> {
    const positions = new Map<string, Position>();

    // Add character positions
    for (const character of snapshot.characters) {
      positions.set(character.id, character.position);
    }

    // Add monster position
    positions.set(snapshot.monster.id, snapshot.monster.position);

    return positions;
  }
}
