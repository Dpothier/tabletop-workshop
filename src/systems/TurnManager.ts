import { CharacterToken, MonsterToken } from '../entities/Token';
import { Rules } from './DataLoader';

export class TurnManager {
  public currentTurn = 1;
  private characters: CharacterToken[];
  private monster: MonsterToken;
  public rules: Rules;

  constructor(characters: CharacterToken[], monster: MonsterToken, rules: Rules) {
    this.characters = characters;
    this.monster = monster;
    this.rules = rules;
  }

  getCondition(name: string) {
    return this.rules.conditions[name];
  }

  nextTurn() {
    this.currentTurn++;
  }

  getAliveCharacters(): CharacterToken[] {
    return this.characters.filter((c) => c.currentHealth > 0);
  }

  isPartyDefeated(): boolean {
    return this.getAliveCharacters().length === 0;
  }

  isMonsterDefeated(): boolean {
    return this.monster.currentHealth <= 0;
  }
}
