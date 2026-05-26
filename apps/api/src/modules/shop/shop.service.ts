import type { PrismaClient } from "@prisma/client";

export async function getCombatItemsCatalog(prisma: PrismaClient, userId: string) {
  const items = await prisma.combatItem.findMany();
  const userItems = await prisma.userCombatItem.findMany({
    where: { userId },
    select: { itemId: true, quantity: true },
  });
  const qtyMap = new Map(userItems.map((i) => [i.itemId, i.quantity]));
  return items.map((item) => ({ ...item, owned: qtyMap.get(item.id) ?? 0 }));
}

export async function buyCombatItem(
  prisma: PrismaClient,
  userId: string,
  itemId: string,
  qty: number,
): Promise<void> {
  const item = await prisma.combatItem.findUniqueOrThrow({ where: { id: itemId } });
  const totalCost = item.price * qty;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } });
  if (user.coins < totalCost) {
    throw Object.assign(new Error("Monedas insuficientes"), { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { coins: { decrement: totalCost } } }),
    prisma.userCombatItem.upsert({
      where: { userId_itemId: { userId, itemId } },
      update: { quantity: { increment: qty } },
      create: { userId, itemId, quantity: qty },
    }),
  ]);
}
