import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../server.js";
import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import { CPU_BOT_ID } from "../../constants.js";

let app: FastifyInstance;
const prisma = getPrisma();
let accessToken: string;
let userId: string;
let roosterId: string;

const EMAIL = `fights-test-${Date.now()}@test.com`;
const USERNAME = `fights${Date.now()}`.slice(0, 17);

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

  // Crear un gallo adulto para el usuario
  const rooster = await prisma.rooster.create({
    data: {
      userId,
      name: "TestFighter",
      stage: "ADULTO",
      nature: "EQUILIBRADO",
      quality: "Normal",
      attack: 20, defense: 20, speed: 20, resistance: 20,
      careCurrent: 80,
      bondPoints: 0,
      hunger: 100, thirst: 100,
      growthProgress: 100,
    },
  });
  roosterId = rooster.id;
});

afterAll(async () => {
  await prisma.fight.deleteMany({
    where: { OR: [{ challengerUserId: userId }, { defenderUserId: userId }] },
  });
  await prisma.rooster.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await app.close();
});

const auth = () => ({ authorization: `Bearer ${accessToken}` });

describe("POST /fights/solo/start", () => {
  it("inicia un combate solo vs CPU", async () => {
    const cpuRoosters = await prisma.rooster.findMany({ where: { userId: CPU_BOT_ID }, take: 1 });
    expect(cpuRoosters.length).toBeGreaterThan(0);
    const cpuRooster = cpuRoosters[0];

    const res = await app.inject({
      method: "POST", url: "/fights/solo/start",
      headers: auth(),
      payload: {
        challengerRoosterId: roosterId,
        defenderUserId:      CPU_BOT_ID,
        defenderRoosterId:   cpuRooster.id,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ fightId: string; combatId: string; initialState: unknown }>();
    expect(body.fightId).toBeTruthy();
    expect(body.combatId).toBeTruthy();
    expect(body.initialState).toBeTruthy();
  });

  it("rechaza combate contra sí mismo", async () => {
    const res = await app.inject({
      method: "POST", url: "/fights/solo/start",
      headers: auth(),
      payload: {
        challengerRoosterId: roosterId,
        defenderUserId:      userId,
        defenderRoosterId:   roosterId,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /fights/solo/:combatId/turn", () => {
  it("procesa un turno de combate", async () => {
    const cpuRoosters = await prisma.rooster.findMany({ where: { userId: CPU_BOT_ID }, take: 1 });
    const cpuRooster = cpuRoosters[0];

    const startRes = await app.inject({
      method: "POST", url: "/fights/solo/start",
      headers: auth(),
      payload: { challengerRoosterId: roosterId, defenderUserId: CPU_BOT_ID, defenderRoosterId: cpuRooster.id },
    });
    const { combatId } = startRes.json<{ combatId: string }>();

    const turnRes = await app.inject({
      method: "POST", url: `/fights/solo/${combatId}/turn`,
      headers: auth(),
      payload: { move: "atacar" },
    });
    expect([200, 201]).toContain(turnRes.statusCode);
    const body = turnRes.json<{ state: unknown; over: boolean }>();
    expect(body.state).toBeTruthy();
    expect(typeof body.over).toBe("boolean");
  });
});
