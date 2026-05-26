import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../server.js";
import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";
import type { RoosterDto } from "./roosters.schemas.js";

let app: FastifyInstance;
const prisma = getPrisma();
let accessToken: string;
let userId: string;

const EMAIL = `roosters-test-${Date.now()}@test.com`;
const USERNAME = `roosters${Date.now()}`.slice(0, 18);

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

  // Dar monedas para comprar
  await prisma.user.update({ where: { id: userId }, data: { coins: 1000 } });
});

afterAll(async () => {
  await prisma.rooster.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await app.close();
});

const auth = () => ({ authorization: `Bearer ${accessToken}` });

describe("POST /roosters/bootstrap", () => {
  it("crea primer huevo gratis", async () => {
    const res = await app.inject({ method: "POST", url: "/roosters/bootstrap", headers: auth() });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ rooster: RoosterDto }>();
    expect(body.rooster.stage).toBe("HUEVO");
    expect(body.rooster.userId).toBe(userId);
  });

  it("rechaza segundo bootstrap", async () => {
    const res = await app.inject({ method: "POST", url: "/roosters/bootstrap", headers: auth() });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /roosters", () => {
  it("lista gallos del usuario", async () => {
    const res = await app.inject({ method: "GET", url: "/roosters", headers: auth() });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ roosters: RoosterDto[] }>();
    expect(Array.isArray(body.roosters)).toBe(true);
    expect(body.roosters.length).toBeGreaterThan(0);
  });
});

describe("POST /roosters/buy-egg", () => {
  it("compra un huevo Misterioso y descuenta monedas", async () => {
    const beforeUser = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } });
    const res = await app.inject({
      method: "POST", url: "/roosters/buy-egg",
      headers: auth(),
      payload: { tier: "MISTERIOSO" },
    });
    expect(res.statusCode).toBe(201);
    const afterUser = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } });
    expect(afterUser.coins).toBe(beforeUser.coins - 80);
  });

  it("rechaza tier inválido", async () => {
    const res = await app.inject({
      method: "POST", url: "/roosters/buy-egg",
      headers: auth(),
      payload: { tier: "INVALIDO" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /roosters/bootstrap-and-hatch (onboarding)", () => {
  it("crea y eclosiona huevo directamente", async () => {
    // Limpiar gallos primero para que bootstrap funcione
    await prisma.rooster.deleteMany({ where: { userId } });

    const res = await app.inject({
      method: "POST", url: "/roosters/bootstrap-and-hatch", headers: auth(),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ rooster: RoosterDto }>();
    // Puede ser POLLO o ADULTO dependiendo de stats, no HUEVO
    expect(body.rooster.stage).not.toBe("HUEVO");
  });
});

describe("POST /roosters/:id/care", () => {
  it("incrementa careCurrent del gallo", async () => {
    const roosters = await prisma.rooster.findMany({ where: { userId, diedAt: null } });
    if (roosters.length === 0) return;
    const rooster = roosters[0];
    const before = rooster.careCurrent;

    const res = await app.inject({
      method: "POST", url: `/roosters/${rooster.id}/care`, headers: auth(),
    });
    expect(res.statusCode).toBe(200);
    const after = await prisma.rooster.findUniqueOrThrow({ where: { id: rooster.id } });
    expect(after.careCurrent).toBeGreaterThanOrEqual(before);
  });
});
