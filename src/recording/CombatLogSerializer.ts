import type { BattleSnapshot } from './BattleSnapshot';
import type { CombatLogEntry } from './CombatRecorder';

export class CombatLogSerializer {
  static toJSONL(snapshot: BattleSnapshot, entries: CombatLogEntry[]): string {
    const lines: string[] = [];

    const snapshotLine = JSON.stringify({
      type: 'snapshot',
      version: 1,
      ...snapshot,
    });
    lines.push(snapshotLine);

    entries.forEach((entry) => {
      lines.push(JSON.stringify(entry));
    });

    return lines.join('\n');
  }

  static fromJSONL(jsonl: string): { snapshot: BattleSnapshot; entries: CombatLogEntry[] } {
    const lines = jsonl.split('\n').filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      throw new Error('JSONL is empty: expected snapshot as first line');
    }

    let firstLine: any;
    try {
      firstLine = JSON.parse(lines[0]);
    } catch (e) {
      throw new Error(`Failed to parse first line as JSON: ${(e as Error).message}`);
    }

    if (!firstLine.type || firstLine.type !== 'snapshot') {
      throw new Error('first line must be a snapshot with type "snapshot"');
    }

    if (firstLine.version === undefined || firstLine.version !== 1) {
      throw new Error(`Unsupported version: expected version 1, got ${firstLine.version}`);
    }

    delete firstLine.type;
    delete firstLine.version;
    const snapshot = firstLine as BattleSnapshot;

    const entries: CombatLogEntry[] = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const entry = JSON.parse(lines[i]);
        entries.push(entry);
      } catch (e) {
        throw new Error(`Failed to parse line ${i + 1} as JSON: ${(e as Error).message}`);
      }
    }

    return { snapshot, entries };
  }
}
