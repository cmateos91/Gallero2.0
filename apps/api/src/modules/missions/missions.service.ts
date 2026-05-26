import type { PrismaClient, DailyMissionProgress } from "@prisma/client";
import {
  DAILY_MISSIONS,
  getStreakBonus,
  todayUtc,
  yesterdayUtc,
} from "@gallos/game-engine";

export async function getDailyProgress(
  prisma: PrismaClient,
  userId: string,
): Promise<DailyMissionProgress> {
  const date = todayUtc();
  return prisma.dailyMissionProgress.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
  });
}

export async function claimMission(
  prisma: PrismaClient,
  userId: string,
  missionKey: string,
): Promise<{ coinsAwarded: number; streakBonus: number }> {
  const date = todayUtc();
  const progress = await getDailyProgress(prisma, userId);

  const mission = DAILY_MISSIONS.find((m) => m.key === missionKey);
  if (!mission) throw Object.assign(new Error("Misión no encontrada"), { status: 404 });
  if (progress.claimed.includes(missionKey)) {
    throw Object.assign(new Error("Misión ya reclamada"), { status: 400 });
  }

  // Verificar completada
  const fieldValue: number =
    missionKey === "WIN_2_FIGHTS" ? progress.fightsWon :
    missionKey === "FEED_3_TIMES" ? progress.feedings :
    missionKey === "TRAIN_ONCE"   ? progress.trainings : 0;

  if (fieldValue < mission.target) {
    throw Object.assign(new Error("Misión no completada todavía"), { status: 400 });
  }

  // Streak update
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streakDays: true, lastStreakDate: true },
  });
  const yesterday = yesterdayUtc();
  const newStreakDays =
    user.lastStreakDate === yesterday ? user.streakDays + 1 :
    user.lastStreakDate === date      ? user.streakDays : 1;

  const streakBonus = getStreakBonus(newStreakDays);
  const totalCoins  = mission.reward + streakBonus;

  await prisma.$transaction([
    prisma.dailyMissionProgress.update({
      where: { userId_date: { userId, date } },
      data: { claimed: [...progress.claimed, missionKey] },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        coins:          { increment: totalCoins },
        streakDays:     newStreakDays,
        lastStreakDate: date,
      },
    }),
    prisma.rewardTransaction.create({
      data: { userId, type: "STREAK", amount: totalCoins },
    }),
  ]);

  return { coinsAwarded: mission.reward, streakBonus };
}
