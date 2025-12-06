import yaml from 'js-yaml';

export interface CharacterClass {
  name: string;
  icon?: string;
  description?: string;
  stats: {
    health: number;
    speed: number;
    damage: string;
    range?: number;
    armor?: number;
  };
  abilities?: Ability[];
  rulebook_notes?: string;
}

export interface Ability {
  name: string;
  description?: string;
  effect: string;
  value?: string;
  cooldown?: number;
}

export interface MonsterAttack {
  name: string;
  range?: number;
  area?: string;
  damage: string;
  effect?: string;
}

export interface MonsterPhase {
  threshold: string;
  behavior: string;
  attacks: string[];
  special?: string;
}

export interface Monster {
  name: string;
  description?: string;
  stats: {
    health: number;
    armor?: number;
    speed?: number;
  };
  phases?: MonsterPhase[];
  attacks: Record<string, MonsterAttack>;
  rulebook_notes?: string;
}

export interface Arena {
  name: string;
  description?: string;
  width: number;
  height: number;
  terrain?: string[][];
  playerSpawns?: { x: number; y: number }[];
  monsterSpawn?: { x: number; y: number };
  hazards?: {
    type: string;
    positions: { x: number; y: number }[];
    effect: string;
  }[];
  rulebook_notes?: string;
}

export interface Rules {
  turn_structure: {
    phases: string[];
    description?: string;
  };
  movement: {
    type: string;
    difficult_terrain_cost?: number;
  };
  combat: {
    attack_roll?: string;
    damage_reduction?: string;
  };
  conditions: Record<
    string,
    {
      name: string;
      effect: string;
      duration?: string;
    }
  >;
}

export interface GameData {
  classes: CharacterClass[];
  monsters: Monster[];
  arenas: Arena[];
  rules: Rules;
}

async function loadYaml<T>(path: string): Promise<T> {
  const response = await fetch(path);
  const text = await response.text();
  return yaml.load(text) as T;
}

export async function loadGameData(): Promise<GameData> {
  const [classesData, monstersData, arenasData, rules] = await Promise.all([
    loadYaml<{ classes: CharacterClass[] }>('/data/characters/classes.yaml'),
    loadYaml<{ monsters: Monster[] }>('/data/monsters/index.yaml'),
    loadYaml<{ arenas: Arena[] }>('/data/arenas/index.yaml'),
    loadYaml<Rules>('/data/rules/core.yaml'),
  ]);

  return {
    classes: classesData.classes,
    monsters: monstersData.monsters,
    arenas: arenasData.arenas,
    rules,
  };
}
