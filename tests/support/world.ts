import type { CharacterToken, MonsterToken } from '../../src/entities/Token';
import type { TurnManager } from '../../src/systems/TurnManager';
import type { DiceRoller } from '../../src/systems/DiceRoller';
import type { ActionWheel } from '../../src/systems/ActionWheel';
import type { CharacterClass, Monster, Arena } from '../../src/systems/DataLoader';

export interface GameWorld {
  // Systems
  diceRoller?: DiceRoller;
  turnManager?: TurnManager;
  actionWheel?: ActionWheel;

  // Entities
  characters?: CharacterToken[];
  monster?: MonsterToken;

  // Data
  loadedClasses?: CharacterClass[];
  loadedMonsters?: Monster[];
  loadedArenas?: Arena[];

  // Results
  result?: number;
  rolls?: number[];
  error?: Error;

  // Combat
  damageDealt?: number;
  targetHealth?: number;
}

declare module 'quickpickle' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface QuickPickleWorld extends GameWorld {}
}
