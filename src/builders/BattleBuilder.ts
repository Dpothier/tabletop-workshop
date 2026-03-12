import type { Arena, Monster, CharacterClass } from '@src/systems/DataLoader';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { BattleState } from '@src/state/BattleState';
import type { Entity } from '@src/entities/Entity';
import type { GameContext } from '@src/types/Effect';
import type { CharacterData } from '@src/types/CharacterData';
import type { EquipmentLoader } from '@src/data/EquipmentLoader';
import { BattleGrid } from '@src/state/BattleGrid';
import { ActionWheel } from '@src/systems/ActionWheel';
import { Character } from '@src/entities/Character';
import { MonsterEntity, StateConfig } from '@src/entities/MonsterEntity';
import { ActionRegistry } from '@src/systems/ActionRegistry';
import { TurnController } from '@src/systems/TurnController';
import { EffectRegistry } from '@src/systems/EffectRegistry';
import { ZoneSystem } from '@src/systems/ZoneSystem';
import { PassiveAuraSystem } from '@src/systems/PassiveAuraSystem';
import { MoveEffect } from '@src/effects/MoveEffect';
import { AttackEffect } from '@src/effects/AttackEffect';
import { DrawBeadsEffect } from '@src/effects/DrawBeadsEffect';
import { CoordinateEffect } from '@src/effects/CoordinateEffect';
import { AssessEffect } from '@src/effects/AssessEffect';
import { SanctuaryEffect } from '@src/effects/SanctuaryEffect';
import { WarpEffect } from '@src/effects/WarpEffect';
import { StabilizeEffect } from '@src/effects/StabilizeEffect';
import { PhoenixBurstEffect } from '@src/effects/PhoenixBurstEffect';
import { TemporalShiftEffect } from '@src/effects/TemporalShiftEffect';
import { BlessEffect } from '@src/effects/BlessEffect';
import { RenewEffect } from '@src/effects/RenewEffect';
import { OverwriteEffect } from '@src/effects/OverwriteEffect';
import { CommandEffect } from '@src/effects/CommandEffect';
import { RallyEffect } from '@src/effects/RallyEffect';
import { InspireEffect } from '@src/effects/InspireEffect';
import { GreatGuardEffect } from '@src/effects/GreatGuardEffect';
import { ShieldWallEffect } from '@src/effects/ShieldWallEffect';
import { RebukeEffect } from '@src/effects/RebukeEffect';
import { RiposteEffect } from '@src/effects/RiposteEffect';
import { BlockEffect } from '@src/effects/BlockEffect';
import { LoadEffect } from '@src/effects/LoadEffect';
import { CrushEffect } from '@src/effects/CrushEffect';
import { SlamEffect } from '@src/effects/SlamEffect';
import { CleaveEffect } from '@src/effects/CleaveEffect';
import { SweepEffect } from '@src/effects/SweepEffect';
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
  private characterData?: CharacterData[];
  private equipmentLoader?: EquipmentLoader;

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
   * Set character data for the party.
   * Automatically sets partySize from array length.
   */
  withCharacterData(characters: CharacterData[]): this {
    this.characterData = characters;
    this.partySize = characters.length;
    return this;
  }

  /**
   * Set the equipment loader for equipping characters by weaponId.
   */
  withEquipmentLoader(loader: EquipmentLoader): this {
    this.equipmentLoader = loader;
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

    // 2. Create ZoneSystem
    const zoneSystem = new ZoneSystem();
    grid.setZoneSystem(zoneSystem);

    // 2a. Create PassiveAuraSystem
    const passiveAuraSystem = new PassiveAuraSystem();

    // 2b. Create EffectRegistry with effects
    const effectRegistry = new EffectRegistry();
    effectRegistry.register('move', new MoveEffect());
    effectRegistry.register('attack', new AttackEffect());
    effectRegistry.register('drawBeads', new DrawBeadsEffect());
    effectRegistry.register('coordinate', new CoordinateEffect());
    effectRegistry.register('assess', new AssessEffect());
    effectRegistry.register('sanctuary', new SanctuaryEffect(zoneSystem));
    effectRegistry.register('warp', new WarpEffect());
    effectRegistry.register('stabilize', new StabilizeEffect());
    effectRegistry.register('phoenixBurst', new PhoenixBurstEffect());
    effectRegistry.register('temporalShift', new TemporalShiftEffect());
    effectRegistry.register('bless', new BlessEffect());
    effectRegistry.register('renew', new RenewEffect());
    effectRegistry.register('overwrite', new OverwriteEffect());
    effectRegistry.register('command', new CommandEffect());
    effectRegistry.register('rally', new RallyEffect());
    effectRegistry.register('inspire', new InspireEffect());
    effectRegistry.register('greatGuard', new GreatGuardEffect());
    effectRegistry.register('shieldWall', new ShieldWallEffect());
    effectRegistry.register('rebuke', new RebukeEffect());
    effectRegistry.register('riposte', new RiposteEffect());
    effectRegistry.register('block', new BlockEffect());
    effectRegistry.register('load', new LoadEffect());
    effectRegistry.register('crush', new CrushEffect());
    effectRegistry.register('slam', new SlamEffect());
    effectRegistry.register('cleave', new CleaveEffect());
    effectRegistry.register('sweep', new SweepEffect());

    // 3. Build entity map (needed for character construction)
    const entityMap: Map<string, Entity> = new Map();

    // 4. Create characters at spawn points (without actionRegistry - will add later)
    const characters = this.createCharacters(grid, entityMap);

    // 5. Create monster
    const monsterEntity = this.createMonster(grid, entityMap);

    // 6. Create action wheel (all at position 0)
    const wheel = this.createActionWheel(characters);

    // 7. Initialize bead hands
    this.initializeBeadHands(characters);

    // 8. Create TurnController
    const turnController = new TurnController(wheel, monsterEntity, characters, zoneSystem);

    // 9. Create GameContext factory function (now has access to grid, characters, monsterEntity)
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
      getWheel: () => wheel,
    });

    // 10. Create action systems with hydration dependencies
    const actionRegistry = new ActionRegistry(effectRegistry, createGameContext);
    actionRegistry.registerAll(this.actions);

    // 11. Create BattleStateObserver
    const stateObserver = new BattleStateObserver();

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
      zoneSystem,
      passiveAuraSystem,
    };
  }

  private createCharacters(grid: BattleGrid, entityMap: Map<string, Entity>): Character[] {
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
        undefined,
        i
      );

      // Apply character data if available
      if (this.characterData && this.characterData[i]) {
        const data = this.characterData[i];
        character.setCharacterData(data.name, data.attributes, data.weapon);

        // Equip weapon via EquipmentLoader if available
        if (this.equipmentLoader && data.weapon) {
          const equipment = this.equipmentLoader.getById(data.weapon);
          if (equipment) {
            character.equip(equipment);
          }
        }
      }

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
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      const attrs = this.characterData?.[i]?.attributes;

      if (attrs) {
        // Map attributes to bead colors: STR→red, DEX→green, MND→blue, SPR→white
        character.initializeBeadHand({
          red: attrs.str,
          green: attrs.dex,
          blue: attrs.mnd,
          white: attrs.spr,
        });
      } else {
        character.initializeBeadHand();
      }

      // Draw starting beads (3)
      if (character.hasBeadHand()) {
        character.drawBeadsToHand(3);
      }
    }
  }
}
