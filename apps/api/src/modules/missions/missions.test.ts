import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../server.js";
import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { todayUtc } from "@gallos/game-engine";

let app: FastifyInstance;
const prisma = getPrisma();
let accessToken: string;
let userId: string;

const EMAIL = `missions-test-${Date.now()}@test.com`;
const USERNAME = `mtest${Date.now()}`.slice(0, 19);

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET  = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  app = await buildServer();

  const reg = await app.inject({
    method: "POST", url: "/auth/register",
    payload: { email: EMAIL, username: USERNAME, password: "Pass123!" },
  });
  const body = reg.json<{ accessToken: string; user: { id: string } }>();
  accessToken = body.accessToken;
  userId = body.user.id;
});

afterAll(async () => {
  await prisma.rewardTransaction.deleteMany({ where: { userId } });
  await prisma.dailyMissionProgress.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await app.close();
});

const auth = () => ({ authorization: `Bearer ${accessToken}` });

describe("GET /missions/daily", () => {
  it("devuelve misiones y progreso", async () => {
    const res = await app.inject({ method: "GET", url: "/missions/daily", headers: auth() });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ missions: unknown[]; progress: unknown }>();
    expect(body.missions.length).toBe(3);
    expect(body.progress).toBeTruthy();
  });
});

describe("POST /missions/daily/claim/:key", () => {
  it("reclama misión completada", async () => {
    const today = todayUtc();
    // Simular que la misión TRAIN_ONCE está completada
    await prisma.dailyMissionProgress.upsert({
      where: { userId_date: { userId, date: today } },
      update: { trainings: 1 },
      create: { userId, date: today, trainings: 1 },
    });

    const res = await app.inject({
      method: "POST", url: "/missions/daily/claim/TRAIN_ONCE", headers: auth(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ coinsAwarded: number }>();
    expect(body.coinsAwarded).toBe(25);
  });

  it("rechaza reclamar dos veces la misma misión", async () => {
    const res = await app.inject({
      method: "POST", url: "/missions/daily/claim/TRAIN_ONCE", headers: auth(),
    });
    expect(res.statusCode).toBe(400);
  });

  it("rechaza misión no completada", async () => {
    const res = await app.inject({
      method: "POST", url: "/missions/daily/claim/WIN_2_FIGHTS", headers: auth(),
    });
    expect(res.statusCode).toBe(400);
  });
});
