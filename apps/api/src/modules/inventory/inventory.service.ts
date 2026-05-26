import type { PrismaClient, InventoryItemType, UserInventory } from "@prisma/client";

export async function getInventory(prisma: PrismaClient, userId: string): Promise<UserInventory[]> {
  return prisma.userInventory.findMany({ where: { userId } });
}

export async function addItem(
  prisma: PrismaClient,
  userId: string,
  itemType: InventoryItemType,
  itemKey: string,
  qty: number,
): Promise<void> {
  await prisma.userInventory.upsert({
    where: { userId_itemType_itemKey: { userId, itemType, itemKey } },
    update: { quantity: { increment: qty } },
    create: { userId, itemType, itemKey, quantity: qty },
  });
}

export async function consumeItem(
  prisma: PrismaClient,
  userId: string,
  itemType: InventoryItemType,
  itemKey: string,
  qty: number,
): Promise<void> {
  const item = await prisma.userInventory.findUnique({
    where: { userId_itemType_itemKey: { userId, itemType, itemKey } },
  });
  if (!item || item.quantity < qty) {
    throw Object.assign(new Error(`Sin suficiente ${itemKey} en inventario`), { status: 400 });
  }
  await prisma.userInventory.update({
    where: { userId_itemType_itemKey: { userId, itemType, itemKey } },
    data: { quantity: { decrement: qty } },
  });
}

const REFILL_INTERVAL_MS = 24 * 3600_000;

export async function refillInventory(prisma: PrismaClient, userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { lastInventoryRefillAt: true },
  });

  const now = Date.now();
  const lastRefill = user.lastInventoryRefillAt?.getTime() ?? 0;
  if (now - lastRefill < REFILL_INTERVAL_MS) {
    throw Object.assign(new Error("Ya reclamaste el reabastecimiento hoy"), { status: 429 });
  }

  await prisma.$transaction([
    prisma.userInventory.upsert({
      where: { userId_itemType_itemKey: { userId, itemType: "FOOD", itemKey: "comida_basica" } },
      update: { quantity: { increment: 3 } },
      create: { userId, itemType: "FOOD", itemKey: "comida_basica", quantity: 3 },
    }),
    prisma.userInventory.upsert({
      where: { userId_itemType_itemKey: { userId, itemType: "WATER", itemKey: "agua" } },
      update: { quantity: { increment: 2 } },
      create: { userId, itemType: "WATER", itemKey: "agua", quantity: 2 },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { lastInventoryRefillAt: new Date(now) },
    }),
  ]);
}
