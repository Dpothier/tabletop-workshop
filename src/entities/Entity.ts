import { BattleGrid, MoveResult, Position } from '@src/state/BattleGrid';
import type { DefenseStats } from '@src/types/Combat';

/**
 * Result of an attack on an entity.
 */
export interface AttackResult {
  success: boolean;
  damage: number;
}

/**
 * Entity is the base class for all game entities (characters, monsters).
 * It manages health and delegates position queries to the BattleGrid.
 *
 * This is a pure game logic class with no rendering dependencies,
 * making it easily testable.
 */
export class Entity {
  public readonly id: string;
  public readonly maxHealth: number;
  public currentHealth: number;
  public armor: number = 0;
  public guard: number = 0;
  public evasion: number = 0;
  public stabilizedWounds: number = 0;
  protected readonly grid: BattleGrid;

  constructor(id: string, maxHealth: number, grid: BattleGrid) {
    this.id = id;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.grid = grid;
  }

  /**
   * Get the current position of this entity.
   * Delegates to the BattleGrid (single source of truth for positions).
   */
  getPosition(): Position | null {
    return this.grid.getPosition(this.id);
  }

  /**
   * Move this entity to a new position.
   * Delegates to the BattleGrid for validation and state update.
   */
  moveTo(dest: Position): MoveResult {
    return this.grid.moveEntity(this.id, dest);
  }

  /**
   * Receive damage from an attack.
   * Reduces health (cannot go below 0).
   */
  receiveAttack(damage: number): AttackResult {
    const actualDamage = Math.min(damage, this.currentHealth);
    this.currentHealth = Math.max(0, this.currentHealth - damage);
    return {
      success: true,
      damage: actualDamage,
    };
  }

  /**
   * Heal the entity.
   * Cannot exceed max health.
   */
  heal(amount: number): void {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  /**
   * Check if this entity is alive (health > 0).
   */
  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  /**
   * Get defense stats for combat resolution.
   */
  getDefenseStats(): DefenseStats {
    return {
      armor: this.armor,
      guard: this.guard,
      evasion: this.evasion,
    };
  }

  /**
   * Set armor value.
   */
  setArmor(amount: number): void {
    this.armor = amount;
  }

  /**
   * Set guard value (for defensive stance).
   */
  setGuard(amount: number): void {
    this.guard = amount;
  }

  /**
   * Reset guard to 0 (at start of turn).
   */
  resetGuard(): void {
    this.guard = 0;
  }

  /**
   * Set evasion value.
   */
  setEvasion(amount: number): void {
    this.evasion = amount;
  }

  /**
   * Receive damage directly (bypasses combat resolution).
   * Used by CombatResolver after determining final damage.
   */
  receiveDamage(amount: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  /**
   * Get total wounds (health lost).
   */
  getWounds(): number {
    return this.maxHealth - this.currentHealth;
  }

  /**
   * Get hand size based on current health and stabilized wounds.
   */
  getHandSize(): number {
    return Math.max(0, this.currentHealth + this.stabilizedWounds);
  }

  /**
   * Stabilize wounds (cannot exceed total wounds).
   */
  stabilize(count: number): void {
    this.stabilizedWounds = Math.min(count, this.getWounds());
  }
}
