import { CombatResolver } from './CombatResolver';
import type { Monster, MonsterAttack, MonsterPhase } from './DataLoader';

export interface Position {
  x: number;
  y: number;
}

export interface CharacterInfo {
  x: number;
  y: number;
  health: number;
}

export interface MonsterAction {
  type: 'attack' | 'move' | 'none';
  target?: CharacterInfo;
  attack?: MonsterAttack;
  destination?: Position;
}

export class MonsterAI {
  private readonly combatResolver: CombatResolver;

  constructor(combatResolver: CombatResolver) {
    this.combatResolver = combatResolver;
  }

  findClosestTarget(monsterPosition: Position, characters: CharacterInfo[]): CharacterInfo | null {
    // Filter to only alive characters
    const aliveCharacters = characters.filter((c) => c.health > 0);

    if (aliveCharacters.length === 0) {
      return null;
    }

    let closest: CharacterInfo | null = null;
    let minDistance = Infinity;

    for (const char of aliveCharacters) {
      const distance = this.combatResolver.getDistance(
        monsterPosition.x,
        monsterPosition.y,
        char.x,
        char.y
      );
      if (distance < minDistance) {
        minDistance = distance;
        closest = char;
      }
    }

    return closest;
  }

  selectAttack(monster: Monster, currentPhase: MonsterPhase | null): MonsterAttack | null {
    // Get available attack keys
    let attackKeys: string[];

    if (currentPhase?.attacks && currentPhase.attacks.length > 0) {
      attackKeys = currentPhase.attacks;
    } else {
      attackKeys = Object.keys(monster.attacks);
    }

    if (attackKeys.length === 0) {
      return null;
    }

    // Select random attack from available
    const randomKey = attackKeys[Math.floor(Math.random() * attackKeys.length)];
    return monster.attacks[randomKey] || null;
  }

  calculateMovement(
    monsterPosition: Position,
    targetPosition: Position,
    speed: number,
    arenaWidth: number,
    arenaHeight: number,
    blockedPositions: Position[]
  ): Position | null {
    const dx = Math.sign(targetPosition.x - monsterPosition.x);
    const dy = Math.sign(targetPosition.y - monsterPosition.y);

    let newX = monsterPosition.x;
    let newY = monsterPosition.y;

    // Try to move toward target
    for (let i = 0; i < speed; i++) {
      const nextX = newX + dx;
      const nextY = newY + dy;

      // Check bounds
      if (nextX < 0 || nextX >= arenaWidth || nextY < 0 || nextY >= arenaHeight) {
        break;
      }

      // Check if blocked
      const isBlocked = blockedPositions.some((pos) => pos.x === nextX && pos.y === nextY);
      if (isBlocked) {
        break;
      }

      newX = nextX;
      newY = nextY;
    }

    // Only return if we actually moved
    if (newX !== monsterPosition.x || newY !== monsterPosition.y) {
      return { x: newX, y: newY };
    }

    return null;
  }

  decideAction(
    monsterPosition: Position,
    monster: Monster,
    currentPhase: MonsterPhase | null,
    characters: CharacterInfo[],
    arenaWidth: number,
    arenaHeight: number,
    blockedPositions: Position[]
  ): MonsterAction | null {
    // Find closest target
    const target = this.findClosestTarget(monsterPosition, characters);
    if (!target) {
      return { type: 'none' };
    }

    // Select an attack
    const attack = this.selectAttack(monster, currentPhase);
    if (!attack) {
      return { type: 'none' };
    }

    // Check if in range
    const range = attack.range || 1;
    const inRange = this.combatResolver.isInRange(
      monsterPosition.x,
      monsterPosition.y,
      target.x,
      target.y,
      range
    );

    if (inRange) {
      return { type: 'attack', target, attack };
    }

    // Out of range, calculate movement
    const speed = monster.stats.speed || 2;
    const destination = this.calculateMovement(
      monsterPosition,
      target,
      speed,
      arenaWidth,
      arenaHeight,
      blockedPositions
    );

    if (destination) {
      return { type: 'move', destination };
    }

    return { type: 'none' };
  }
}
