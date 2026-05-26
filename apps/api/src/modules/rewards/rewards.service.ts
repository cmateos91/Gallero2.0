import type { PrismaClient } from "@prisma/client";

const WEEKLY_REWARD = 100;

export async function claimWeeklyReward(prisma: PrismaClient, userId: string): Promise<{ coins: number }> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);
  const lastWeekly = await prisma.rewardTransaction.findFirst({
    where: { userId, type: "WEEKLY_RANKING", createdAt: { gte: weekAgo } },
    orderBy: { createdAt: "desc" },
  });
  if (lastWeekly) throw Object.assign(new Error("Ya reclamaste el premio semanal"), { status: 429 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { coins: { increment: WEEKLY_REWARD } } }),
    prisma.rewardTransaction.create({ data: { userId, type: "WEEKLY_RANKING", amount: WEEKLY_REWARD } }),
  ]);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } });
  return { coins: user.coins };
}
