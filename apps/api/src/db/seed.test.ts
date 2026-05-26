import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { COMBAT_ITEM_CATALOG } from "@gallos/game-engine";

const CPU_BOT_ID = "00000000-0000-4000-8000-000000000001";

const prisma = new PrismaClient();

beforeAll(async () => {
  // El seed debe haberse ejecutado antes de este test (prisma db seed / npm run db:seed)
  // En CI se ejecuta en el job setup. Localmente: pnpm db:seed
});

describe("seed — CombatItems", () => {
  it("inserta exactamente 8 items del catálogo", async () => {
    const count = await prisma.combatItem.count();
    expect(count).toBe(COMBAT_ITEM_CATALOG.length);
  });

  it("todos los type del catálogo existen en BD", async () => {
    for (const item of COMBAT_ITEM_CATALOG) {
      const found = await prisma.combatItem.findUnique({ where: { type: item.id } });
      expect(found).not.toBeNull();
      expect(found!.name).toBe(item.name);
      expect(found!.price).toBe(item.price);
    }
  });

  it("es idempotente — segunda ejecución no duplica", async () => {
    const before = await prisma.combatItem.count();
    // Re-upsert manual del primer item
    const first = COMBAT_ITEM_CATALOG[0];
    await prisma.combatItem.upsert({
      where: { type: first.id },
      update: { name: first.name },
      create: { type: first.id, name: first.name, description: first.description, price: first.price, turns: first.turns, effectValue: first.effectValue },
    });
    const after = await prisma.combatItem.count();
    expect(after).toBe(before);
  });
});

describe("seed — CosmeticItems", () => {
  it("inserta exactamente 15 items (3 por slot)", async () => {
    const count = await prisma.cosmeticItem.count();
    expect(count).toBe(15);
  });

  it("hay 3 items por cada uno de los 5 slots", async () => {
    const slots = ["CRESTA", "ALAS", "BARBA", "CUERPO", "COLA"] as const;
    for (const slot of slots) {
      const count = await prisma.cosmeticItem.count({ where: { slot } });
      expect(count).toBe(3);
    }
  });

  it("cada slot tiene los 3 niveles de rareza", async () => {
    const slots = ["CRESTA", "ALAS", "BARBA", "CUERPO", "COLA"] as const;
    for (const slot of slots) {
      const rarities = await prisma.cosmeticItem.findMany({ where: { slot }, select: { rarity: true } });
      const raritySet = new Set(rarities.map((r) => r.rarity));
      expect(raritySet).toContain("Común");
      expect(raritySet).toContain("Raro");
      expect(raritySet).toContain("Legendario");
    }
  });
});

describe("seed — CPU Bot", () => {
  it("existe el usuario bot con el ID fijo", async () => {
    const bot = await prisma.user.findUnique({ where: { id: CPU_BOT_ID } });
    expect(bot).not.toBeNull();
    expect(bot!.username).toBe("CPU");
    expect(bot!.email).toBe("bot@gallero.local");
  });

  it("el bot tiene exactamente 10 gallos", async () => {
    const count = await prisma.rooster.count({ where: { userId: CPU_BOT_ID } });
    expect(count).toBe(10);
  });

  it("todos los gallos del bot son ADULTO", async () => {
    const nonAdult = await prisma.rooster.count({
      where: { userId: CPU_BOT_ID, stage: { not: "ADULTO" } },
    });
    expect(nonAdult).toBe(0);
  });

  it("hay 2 gallos por cada naturaleza", async () => {
    const natures = ["AGRESIVO", "DEFENSIVO", "VELOZ", "ROBUSTO", "EQUILIBRADO"] as const;
    for (const nature of natures) {
      const count = await prisma.rooster.count({ where: { userId: CPU_BOT_ID, nature } });
      expect(count).toBe(2);
    }
  });
});
