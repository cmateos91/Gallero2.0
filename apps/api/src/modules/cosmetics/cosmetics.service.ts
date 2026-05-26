import type { PrismaClient, CosmeticSlot } from "@prisma/client";

export async function getCatalog(prisma: PrismaClient) {
  return prisma.cosmeticItem.findMany({ orderBy: [{ slot: "asc" }, { price: "asc" }] });
}

export async function getMineWithEquipped(prisma: PrismaClient, userId: string) {
  const owned = await prisma.userCosmetic.findMany({
    where: { userId },
    include: { cosmetic: true },
  });
  const equipped = await prisma.equippedCosmetic.findMany({
    where: { userId },
    include: { cosmetic: true },
  });
  return { owned, equipped };
}

export async function buyCosmeticItem(
  prisma: PrismaClient,
  userId: string,
  cosmeticItemId: string,
): Promise<void> {
  const item = await prisma.cosmeticItem.findUniqueOrThrow({ where: { id: cosmeticItemId } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } });

  const alreadyOwned = await prisma.userCosmetic.findUnique({
    where: { userId_cosmeticItemId: { userId, cosmeticItemId } },
  });
  if (alreadyOwned) throw Object.assign(new Error("Ya tienes este cosmético"), { status: 409 });
  if (user.coins < item.price) throw Object.assign(new Error("Monedas insuficientes"), { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { coins: { decrement: item.price } } }),
    prisma.userCosmetic.create({ data: { userId, cosmeticItemId } }),
  ]);
}

export async function equipCosmetic(
  prisma: PrismaClient,
  userId: string,
  roosterId: string,
  cosmeticItemId: string,
): Promise<void> {
  const owned = await prisma.userCosmetic.findUnique({
    where: { userId_cosmeticItemId: { userId, cosmeticItemId } },
  });
  if (!owned) throw Object.assign(new Error("No tienes este cosmético"), { status: 403 });

  const rooster = await prisma.rooster.findFirst({ where: { id: roosterId, userId } });
  if (!rooster) throw Object.assign(new Error("Gallo no encontrado"), { status: 404 });

  const item = await prisma.cosmeticItem.findUniqueOrThrow({ where: { id: cosmeticItemId } });

  await prisma.equippedCosmetic.upsert({
    where: { roosterId_slot: { roosterId, slot: item.slot } },
    update: { cosmeticItemId },
    create: { userId, roosterId, cosmeticItemId, slot: item.slot },
  });
}

export async function unequipCosmetic(
  prisma: PrismaClient,
  userId: string,
  roosterId: string,
  slot: string,
): Promise<void> {
  await prisma.equippedCosmetic.deleteMany({
    where: { userId, roosterId, slot: slot as CosmeticSlot },
  });
}
