import yaml from 'js-yaml';
import type { EquipmentDefinition } from '@src/types/Equipment';

export class EquipmentLoader {
  private definitions: Map<string, EquipmentDefinition> = new Map();

  loadFromYAML(yamlContent: string): EquipmentDefinition[] {
    const data = yaml.load(yamlContent) as { equipment: EquipmentDefinition[] };
    const equipment = data.equipment || [];
    this.definitions.clear();
    for (const def of equipment) {
      this.definitions.set(def.id, def);
    }
    return equipment;
  }

  getById(id: string): EquipmentDefinition | undefined {
    return this.definitions.get(id);
  }
}
