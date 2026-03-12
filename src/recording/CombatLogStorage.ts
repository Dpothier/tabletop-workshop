import { CombatLogSerializer } from './CombatLogSerializer';
import type { BattleSnapshot } from './BattleSnapshot';
import type { CombatLogEntry } from './CombatRecorder';

interface RecordingMetadata {
  id: string;
  date: number;
  monsterName: string;
  outcome: 'victory' | 'defeat';
}

export class CombatLogStorage {
  private readonly indexKey = 'combat-recordings-index';

  constructor(private storage: Storage) {}

  saveToLocalStorage(
    id: string,
    recording: { snapshot: BattleSnapshot; entries: CombatLogEntry[] }
  ): void {
    const jsonl = CombatLogSerializer.toJSONL(recording.snapshot, recording.entries);
    const key = `combat-recording-${id}`;
    this.storage.setItem(key, jsonl);

    // Extract outcome from the last battle-end entry
    let outcome: 'victory' | 'defeat' = 'defeat';
    for (let i = recording.entries.length - 1; i >= 0; i--) {
      const entry = recording.entries[i];
      if ((entry as any).type === 'battle-end') {
        outcome = (entry as any).outcome;
        break;
      }
    }

    // Store metadata
    const metadata: RecordingMetadata = {
      id,
      date: Date.now(),
      monsterName: recording.snapshot.monster.name,
      outcome,
    };
    this.updateIndex(id, metadata);
  }

  loadFromLocalStorage(id: string): { snapshot: BattleSnapshot; entries: CombatLogEntry[] } | null {
    const key = `combat-recording-${id}`;
    const jsonl = this.storage.getItem(key);

    if (!jsonl) {
      return null;
    }

    return CombatLogSerializer.fromJSONL(jsonl);
  }

  listRecordings(): Array<{
    id: string;
    date: number | string;
    monsterName: string;
    outcome: 'victory' | 'defeat';
  }> {
    const summaries: Array<{
      id: string;
      date: number | string;
      monsterName: string;
      outcome: 'victory' | 'defeat';
    }> = [];

    const indexJson = this.storage.getItem(this.indexKey);
    let index: Record<string, RecordingMetadata> = {};

    if (indexJson) {
      try {
        index = JSON.parse(indexJson);
      } catch {
        index = {};
      }
    }

    // Scan localStorage for combat-recording-* keys
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith('combat-recording-')) {
        keys.push(key);
      }
    }

    keys.forEach((key) => {
      const id = key.replace('combat-recording-', '');
      const metadata = index[id];

      if (metadata) {
        summaries.push({
          id: metadata.id,
          date: metadata.date,
          monsterName: metadata.monsterName,
          outcome: metadata.outcome,
        });
      }
    });

    return summaries;
  }

  deleteRecording(id: string): void {
    const key = `combat-recording-${id}`;
    this.storage.removeItem(key);

    // Update index
    const indexJson = this.storage.getItem(this.indexKey);
    let index: Record<string, RecordingMetadata> = {};

    if (indexJson) {
      try {
        index = JSON.parse(indexJson);
      } catch {
        index = {};
      }
    }

    delete index[id];
    this.storage.setItem(this.indexKey, JSON.stringify(index));
  }

  private updateIndex(id: string, metadata: RecordingMetadata): void {
    const indexJson = this.storage.getItem(this.indexKey);
    let index: Record<string, RecordingMetadata> = {};

    if (indexJson) {
      try {
        index = JSON.parse(indexJson);
      } catch {
        index = {};
      }
    }

    index[id] = metadata;
    this.storage.setItem(this.indexKey, JSON.stringify(index));
  }
}
