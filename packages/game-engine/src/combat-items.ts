export type CombatItemType =
  | "hp_potion_small"
  | "hp_potion_medium"
  | "hp_potion_large"
  | "frenzy"
  | "fortress"
  | "speed_boost"
  | "swap_attack_speed"
  | "swap_defense_attack";

export interface CombatItemDescriptor {
  id: CombatItemType;
  name: string;
  description: string;
  price: number;
  turns: number;
  effectValue: number;
}

export const COMBAT_ITEM_CATALOG: readonly CombatItemDescriptor[] = [
  {
    id: "hp_potion_small",
    name: "Poción pequeña",
    description: "Recupera el 25% del HP máximo",
    price: 15,
    turns: 0,
    effectValue: 25,
  },
  {
    id: "hp_potion_medium",
    name: "Poción mediana",
    description: "Recupera el 50% del HP máximo",
    price: 30,
    turns: 0,
    effectValue: 50,
  },
  {
    id: "hp_potion_large",
    name: "Poción grande",
    description: "Recupera el 100% del HP máximo",
    price: 60,
    turns: 0,
    effectValue: 100,
  },
  {
    id: "frenzy",
    name: "Frenesí",
    description: "Aumenta el ataque en +2 durante 3 turnos",
    price: 25,
    turns: 3,
    effectValue: 2,
  },
  {
    id: "fortress",
    name: "Fortaleza",
    description: "Aumenta la defensa en +2 durante 3 turnos",
    price: 25,
    turns: 3,
    effectValue: 2,
  },
  {
    id: "speed_boost",
    name: "Impulso veloz",
    description: "Aumenta la velocidad en +2 durante 3 turnos",
    price: 25,
    turns: 3,
    effectValue: 2,
  },
  {
    id: "swap_attack_speed",
    name: "Cambio táctico",
    description: "Intercambia tu ataque con la velocidad rival",
    price: 40,
    turns: 1,
    effectValue: 0,
  },
  {
    id: "swap_defense_attack",
    name: "Inversión táctica",
    description: "Intercambia tu defensa con el ataque rival",
    price: 40,
    turns: 1,
    effectValue: 0,
  },
];

export function findCombatItemDescriptor(id: CombatItemType): CombatItemDescriptor | undefined {
  return COMBAT_ITEM_CATALOG.find((item) => item.id === id);
}
