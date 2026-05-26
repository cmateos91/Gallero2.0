import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getPrisma } from "../db/prisma.js";
import { runCareDecay } from "./careDecay.job.js";

const prisma = getPrisma();
let testUserId: string;
let testRoosterId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email:    `caredecay-test-${Date.now()}@test.com`,
      username: `cdtest${Date.now()}`.slice(0, 20),
    },
  });
  testUserId = user.id;

  const rooster = await prisma.rooster.create({
    data: {
      userId: testUserId,
      name: "DecayTest",
      stage: "ADULTO",
      quality: "Normal",
      attack: 10, defense: 10, speed: 10, resistance: 10,
      careCurrent: 50,
      bondPoints: 0,
      hunger: 100, thirst: 100,
      growthProgress: 100,
    },
  });
  testRoosterId = rooster.id;
});

afterAll(async () => {
  await prisma.rooster.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } });
});

describe("runCareDecay", () => {
  it("decrementa careCurrent de gallos adultos", async () => {
    const before = await prisma.rooster.findUniqueOrThrow({
      where: { id: testRoosterId }, select: { careCurrent: true },
    });

    await runCareDecay(prisma);

    const after = await prisma.rooster.findUniqueOrThrow({
      where: { id: testRoosterId }, select: { careCurrent: true },
    });

    expect(after.careCurrent).toBe(before.careCurrent - 1);
  });

  it("no decrementa por debajo de 0", async () => {
    await prisma.rooster.update({
      where: { id: testRoosterId },
      data: { careCurrent: 0 },
    });

    await runCareDecay(prisma);

    const after = await prisma.rooster.findUniqueOrThrow({
      where: { id: testRoosterId }, select: { careCurrent: true },
    });
    expect(after.careCurrent).toBe(0);
  });

  it("no afecta a huevos", async () => {
    const egg = await prisma.rooster.create({
      data: {
        userId: testUserId,
        name: "EggTest",
        stage: "HUEVO",
        quality: "Común",
        attack: 6, defense: 6, speed: 6, resistance: 6,
        careCurrent: 50,
        bondPoints: 0,
        hunger: 100, thirst: 100,
        growthProgress: 0,
        hatchReadyAt: new Date(Date.now() + 3600_000),
      },
    });

    await runCareDecay(prisma);

    const after = await prisma.rooster.findUniqueOrThrow({
      where: { id: egg.id }, select: { careCurrent: true },
    });
    expect(after.careCurrent).toBe(50);

    await prisma.rooster.delete({ where: { id: egg.id } });
  });
});
