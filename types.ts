
export enum Race {
  Human = '人类',
  Elf = '精灵',
  Dwarf = '矮人',
  Orc = '兽人',
  Dragonkin = '龙裔',
  Tiefling = '提夫林'
}

export enum SocialClass {
  Serf = '农奴',
  Commoner = '平民',
  Merchant = '商人',
  Knight = '骑士',
  Noble = '贵族',
  Royalty = '王室'
}

export interface Appearance {
  score: number;
  hairColor: string;
  eyeColor: string;
  faceShape: string;
  eyeShape: string;
  description: string;
}

export interface Attribute {
  value: number;
  description: string;
}

export interface NPC {
  id: string;
  identity: string;
  race: Race;
  socialClass: SocialClass;
  appearance: Appearance;
  combat: Attribute;
  constitution: Attribute;
  intelligence: Attribute;
  tags: string[];
  personality: string;
  likes: string[];
  dislikes: string[];
  backstory: string;
  preference: string;
  generation: number;
}

export enum OutcomeType {
  Happy = '幸福',
  Normal = '平平',
  Bitter = '怨偶'
}

export interface MarriageResult {
  outcome: OutcomeType;
  story: string;
  children: NPC[];
}
