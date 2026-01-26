export interface CharacterAttributes {
  str: number;
  dex: number;
  mnd: number;
  spr: number;
}

export interface CharacterData {
  id: string;
  name: string;
  attributes: CharacterAttributes;
  weapon: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}
