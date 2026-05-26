import { PrismaClient } from "@prisma/client";
import { COMBAT_ITEM_CATALOG } from "@gallos/game-engine";

const prisma = new PrismaClient();

// ─── Constante pública — también usada en Fase 3 ─────────────────────────────
export const CPU_BOT_ID = "00000000-0000-0000-0000-000000000001";

// ─── CombatItem templates ─────────────────────────────────────────────────────

async function seedCombatItems() {
  for (const item of COMBAT_ITEM_CATALOG) {
    await prisma.combatItem.upsert({
      where: { type: item.id },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        turns: item.turns,
        effectValue: item.effectValue,
      },
      create: {
        type: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        turns: item.turns,
        effectValue: item.effectValue,
      },
    });
  }
  console.log(`✓ CombatItems: ${COMBAT_ITEM_CATALOG.length} items`);
}

// ─── CosmeticItem templates ───────────────────────────────────────────────────

const COSMETIC_CATALOG = [
  // CRESTA
  { slot: "CRESTA" as const, name: "Mohawk",    description: "Cresta estilo mohawk",        price: 50,  rarity: "Común" },
  { slot: "CRESTA" as const, name: "Dorada",    description: "Cresta bañada en oro",         price: 200, rarity: "Raro" },
  { slot: "CRESTA" as const, name: "Holograma", description: "Cresta holográfica futurista", price: 500, rarity: "Legendario" },
  // ALAS
  { slot: "ALAS" as const, name: "Sedosas",    description: "Alas suaves y ligeras",        price: 60,  rarity: "Común" },
  { slot: "ALAS" as const, name: "Metálicas",  description: "Alas forjadas en metal",       price: 150, rarity: "Raro" },
  { slot: "ALAS" as const, name: "Fuego",      description: "Alas envueltas en llamas",     price: 350, rarity: "Legendario" },
  // BARBA
  { slot: "BARBA" as const, name: "Clásica",   description: "Barba tradicional",            price: 40,  rarity: "Común" },
  { slot: "BARBA" as const, name: "Trenza",    description: "Barba con trenzas decorativas", price: 120, rarity: "Raro" },
  { slot: "BARBA" as const, name: "Diamante",  description: "Barba incrustada de diamantes", price: 400, rarity: "Legendario" },
  // CUERPO
  { slot: "CUERPO" as const, name: "Básico",   description: "Plumaje estándar",             price: 30,  rarity: "Común" },
  { slot: "CUERPO" as const, name: "Floral",   description: "Plumaje con motivos florales", price: 100, rarity: "Raro" },
  { slot: "CUERPO" as const, name: "Armadura", description: "Armadura de gallo guerrero",   price: 300, rarity: "Legendario" },
  // COLA
  { slot: "COLA" as const, name: "Esponjosa",  description: "Cola suave y esponjosa",       price: 50,  rarity: "Común" },
  { slot: "COLA" as const, name: "Brillante",  description: "Cola con plumas iridiscentes", price: 180, rarity: "Raro" },
  { slot: "COLA" as const, name: "Llama",      description: "Cola en forma de llama",       price: 350, rarity: "Legendario" },
] as const;

async function seedCosmeticItems() {
  for (const item of COSMETIC_CATALOG) {
    await prisma.cosmeticItem.upsert({
      where: { slot_name: { slot: item.slot, name: item.name } },
      update: { description: item.description, price: item.price, rarity: item.rarity },
      create: { slot: item.slot, name: item.name, description: item.description, price: item.price, rarity: item.rarity },
    });
  }
  console.log(`✓ CosmeticItems: ${COSMETIC_CATALOG.length} items (3 por slot)`);
}

// ─── CPU Bot user + roosters ──────────────────────────────────────────────────

const CPU_ROOSTERS = [
  { id: "00000000-0000-0000-0001-000000000001", name: "Rojo Fuego I",    nature: "AGRESIVO" as const,    attack: 28, defense: 18, speed: 20, resistance: 18 },
  { id: "00000000-0000-0000-0001-000000000002", name: "Rojo Fuego II",   nature: "AGRESIVO" as const,    attack: 28, defense: 18, speed: 20, resistance: 18 },
  { id: "00000000-0000-0000-0001-000000000003", name: "Escudo Gris I",   nature: "DEFENSIVO" as const,   attack: 16, defense: 30, speed: 18, resistance: 20 },
  { id: "00000000-0000-0000-0001-000000000004", name: "Escudo Gris II",  nature: "DEFENSIVO" as const,   attack: 16, defense: 30, speed: 18, resistance: 20 },
  { id: "00000000-0000-0000-0001-000000000005", name: "Viento Negro I",  nature: "VELOZ" as const,       attack: 20, defense: 16, speed: 30, resistance: 18 },
  { id: "00000000-0000-0000-0001-000000000006", name: "Viento Negro II", nature: "VELOZ" as const,       attack: 20, defense: 16, speed: 30, resistance: 18 },
  { id: "00000000-0000-0000-0001-000000000007", name: "Titán I",         nature: "ROBUSTO" as const,     attack: 18, defense: 22, speed: 16, resistance: 28 },
  { id: "00000000-0000-0000-0001-000000000008", name: "Titán II",        nature: "ROBUSTO" as const,     attack: 18, defense: 22, speed: 16, resistance: 28 },
  { id: "00000000-0000-0000-0001-000000000009", name: "Equilibrio I",    nature: "EQUILIBRADO" as const, attack: 22, defense: 22, speed: 22, resistance: 22 },
  { id: "00000000-0000-0000-0001-000000000010", name: "Equilibrio II",   nature: "EQUILIBRADO" as const, attack: 22, defense: 22, speed: 22, resistance: 22 },
] as const;

async function seedCpuBot() {
  await prisma.user.upsert({
    where: { id: CPU_BOT_ID },
    update: {},
    create: {
      id: CPU_BOT_ID,
      email: "bot@gallero.local",
      username: "CPU",
      passwordHash: null,
      mmr: 1000,
      coins: 0,
    },
  });

  for (const rooster of CPU_ROOSTERS) {
    await prisma.rooster.upsert({
      where: { id: rooster.id },
      update: {},
      create: {
        id: rooster.id,
        userId: CPU_BOT_ID,
        name: rooster.name,
        stage: "ADULTO",
        nature: rooster.nature,
        quality: "Normal",
        attack: rooster.attack,
        defense: rooster.defense,
        speed: rooster.speed,
        resistance: rooster.resistance,
        careCurrent: 100,
        bondPoints: 0,
        hunger: 100,
        thirst: 100,
        growthProgress: 100,
      },
    });
  }
  console.log(`✓ CPU Bot: 1 usuario + ${CPU_ROOSTERS.length} gallos ADULTO`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...\n");
  await seedCombatItems();
  await seedCosmeticItems();
  await seedCpuBot();
  console.log("\n✓ Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
