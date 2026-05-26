import type { PrismaClient } from "@prisma/client";

export async function runCareDecay(prisma: PrismaClient): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE "Rooster"
    SET "careCurrent" = GREATEST(0, "careCurrent" - 1)
    WHERE stage != 'HUEVO' AND "diedAt" IS NULL
  `;
  return result;
}
