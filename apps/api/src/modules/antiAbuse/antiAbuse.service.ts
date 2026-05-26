import type { PrismaClient } from "@prisma/client";

export function detectSelfFight(userIdA: string, userIdB: string): void {
  if (userIdA === userIdB) {
    throw Object.assign(new Error("No puedes combatir contra ti mismo"), { status: 400 });
  }
}

export async function checkSameFoeLimit(
  prisma: PrismaClient,
  challengerUserId: string,
  defenderUserId: string,
): Promise<void> {
  const since = new Date(Date.now() - 24 * 3600_000);
  const count = await prisma.fight.count({
    where: {
      challengerUserId,
      defenderUserId,
      createdAt: { gte: since },
    },
  });
  if (count >= 3) {
    throw Object.assign(
      new Error("Máximo 3 combates contra el mismo rival en 24 horas"),
      { status: 429 },
    );
  }
}
