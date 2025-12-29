import type { Arena, Monster, CharacterClass } from '@src/systems/DataLoader';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { BattleState } from '@src/state/BattleState';
import type { Entity } from '@src/entities/Entity';
import type { GameContext } from '@src/types/Effect';
import { BattleGrid } from '@src/state/BattleGrid';
import { ActionWheel } from '@src/systems/ActionWheel';
import { Character } from '@src/entities/Character';
import { MonsterEntity, StateConfig } from '@src/entities/MonsterEntity';
import { ActionRegistry } from '@src/systems/ActionRegistry';
import { TurnController } from '@src/systems/TurnController';
import { EffectRegistry } from '@src/systems/EffectRegistry';
import { MoveEffect } from '@src/effects/MoveEffect';
import { AttackEffect } from '@src/effects/AttackEffect';
import { DrawBeadsEffect } from '@src/effects/DrawBeadsEffect';
import { BattleStateObserver } from '@src/systems/BattleStateObserver';

/**
 * Builder for constructing battle state.
 * Configured by MenuScene, produces BattleState for BattleScene.
 */
export class BattleBuilder {
  private monster?: Monster;
  private arena?: Arena;
  private partySize = 4;
  private classes: CharacterClass[] = [];
  private actions: ActionDefinition[] = [];

  /**
   * Set the monster for this battle
   */
  withMonster(monster: Monster): this {
    this.monster = monster;
    return this;
  }

  /**
   * Set the arena for this battle
   */
  withArena(arena: Arena): this {
    this.arena = arena;
    return this;
  }

  /**
   * Set the party size (default: 4)
   */
  withPartySize(size: number): this {
    this.partySize = size;
    return this;
  }

  /**
   * Set available character classes
   */
  withClasses(classes: CharacterClass[]): this {
    this.classes = classes;
    return this;
  }

  /**
   * Set available actions
   */
  withActions(actions: ActionDefinition[]): this {
    this.actions = actions;
    return this;
  }

  /**
   * Build the complete battle state
   */
  build(): BattleState {
    if (!this.monster) throw new Error('BattleBuilder: monster is required');
    if (!this.arena) throw new Error('BattleBuilder: arena is required');
    if (this.classes.length === 0) throw new Error('BattleBuilder: classes are required');

    // 1. Create grid (single source of truth for positions)
    const grid = new BattleGrid(this.arena.width, this.arena.height);

    // 2. Create action systems
    const actionRegistry = new ActionRegistry();
    actionRegistry.registerAll(this.actions);

    // 3. Build entity map (needed for character construction)
    const entityMap: Map<string, Entity> = new Map();

    // 4. Create characters at spawn points
    const characters = this.createCharacters(grid, entityMap, actionRegistry);

    // 5. Create monster
    const monsterEntity = this.createMonster(grid, entityMap);

    // 6. Create action wheel (all at position 0)
    const wheel = this.createActionWheel(characters);

    // 7. Initialize bead hands
    this.initializeBeadHands(characters);

    // 8. Create TurnController
    const turnController = new TurnController(wheel, monsterEntity, characters);

    // 9. Create EffectRegistry with effects
    const effectRegistry = new EffectRegistry();
    effectRegistry.register('move', new MoveEffect());
    effectRegistry.register('attack', new AttackEffect());
    effectRegistry.register('drawBeads', new DrawBeadsEffect());

    // 10. Create BattleStateObserver
    const stateObserver = new BattleStateObserver();

    // 11. Create GameContext factory function
    const createGameContext = (actorId: string): GameContext => ({
      grid,
      actorId,
      getEntity: (id: string) => {
        if (id === 'monster') return monsterEntity;
        return characters.find((c) => c.id === id);
      },
      getBeadHand: (entityId: string) => {
        const char = characters.find((c) => c.id === entityId);
        return char?.getBeadHand();
      },
    });

    return {
      arena: this.arena,
      monster: this.monster,
      classes: this.classes,
      actions: this.actions,
      grid,
      wheel,
      characters,
      monsterEntity,
      entityMap,
      actionRegistry,
      turnController,
      effectRegistry,
      stateObserver,
      createGameContext,
    };
  }

  private createCharacters(
    grid: BattleGrid,
    entityMap: Map<string, Entity>,
    actionRegistry: ActionRegistry
  ): Character[] {
    const spawnPoints = this.arena!.playerSpawns || [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];

    const characters: Character[] = [];

    for (let i = 0; i < this.partySize; i++) {
      const charClass = this.classes[i % this.classes.length];
      const spawn = spawnPoints[i];
      const characterId = `hero-${i}`;

      // Register position in grid
      grid.register(characterId, spawn.x, spawn.y);

      // Create Character entity
      const character = new Character(
        characterId,
        charClass.stats.health,
        grid,
        entityMap,
        actionRegistry
      );

      characters.push(character);
      entityMap.set(characterId, character);
    }

    return characters;
  }

  private createMonster(grid: BattleGrid, entityMap: Map<string, Entity>): MonsterEntity {
    const monsterSpawn = this.arena!.monsterSpawn || { x: 5, y: 4 };

    // Register monster position
    grid.register('monster', monsterSpawn.x, monsterSpawn.y);

    // Create MonsterEntity
    const monsterEntity = new MonsterEntity('monster', this.monster!.stats.health, grid);
    entityMap.set('monster', monsterEntity);

    // Initialize monster bead system if configured
    if (this.monster!.beads && this.monster!.states && this.monster!.start_state) {
      monsterEntity.initializeBeadBag(this.monster!.beads);

      // Convert states record to array of StateConfig
      const stateConfigs: StateConfig[] = Object.entries(this.monster!.states).map(
        ([name, state]) => ({
          name,
          damage: state.damage,
          wheel_cost: state.wheel_cost,
          range: state.range,
          area: state.area,
          transitions: state.transitions,
        })
      );

      monsterEntity.initializeStateMachine(stateConfigs, this.monster!.start_state);
    }

    return monsterEntity;
  }

  private createActionWheel(characters: Character[]): ActionWheel {
    const wheel = new ActionWheel();

    // Add all characters to wheel at position 0
    for (const character of characters) {
      wheel.addEntity(character.id, 0);
    }

    // Add monster at position 0
    wheel.addEntity('monster', 0);

    return wheel;
  }

  private initializeBeadHands(characters: Character[]): void {
    for (const character of characters) {
      character.initializeBeadHand();
      // Draw starting beads (3)
      if (character.hasBeadHand()) {
        character.drawBeadsToHand(3);
      }
    }
  }
}
