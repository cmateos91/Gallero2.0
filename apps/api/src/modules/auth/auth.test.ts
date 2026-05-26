import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../server.js";
import type { FastifyInstance } from "fastify";
import { getPrisma } from "../../db/prisma.js";

let app: FastifyInstance;
const prisma = getPrisma();

const TEST_USER = {
  email:    `auth-test-${Date.now()}@test.com`,
  username: `authtest${Date.now()}`.slice(0, 20),
  password: "Password123!",
};

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET  = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  app = await buildServer();
});

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { contains: "auth-test-" } },
    select: { id: true },
  });
  const ids = users.map(u => u.id);
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await app.close();
});

describe("POST /auth/register", () => {
  it("crea usuario y devuelve accessToken + cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url:    "/auth/register",
      payload: TEST_USER,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ accessToken: string; user: { id: string } }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.id).toBeTruthy();
    expect(res.headers["set-cookie"]).toBeTruthy();
  });

  it("rechaza email duplicado", async () => {
    const res = await app.inject({
      method: "POST",
      url:    "/auth/register",
      payload: TEST_USER,
    });
    expect(res.statusCode).toBe(409);
  });

  it("valida formato de email", async () => {
    const res = await app.inject({
      method: "POST",
      url:    "/auth/register",
      payload: { email: "not-an-email", username: "newuser", password: "pass123" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("devuelve accessToken con credenciales correctas", async () => {
    const res = await app.inject({
      method: "POST",
      url:    "/auth/login",
      payload: { emailOrUsername: TEST_USER.email, password: TEST_USER.password },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(body.accessToken).toBeTruthy();
  });

  it("rechaza password incorrecta", async () => {
    const res = await app.inject({
      method: "POST",
      url:    "/auth/login",
      payload: { emailOrUsername: TEST_USER.email, password: "wrongpassword" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("devuelve perfil con Bearer válido", async () => {
    const loginRes = await app.inject({
      method:  "POST",
      url:     "/auth/login",
      payload: { emailOrUsername: TEST_USER.email, password: TEST_USER.password },
    });
    const { accessToken } = loginRes.json<{ accessToken: string }>();

    const meRes = await app.inject({
      method:  "GET",
      url:     "/auth/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(meRes.statusCode).toBe(200);
    const body = meRes.json<{ username: string }>();
    expect(body.username).toBe(TEST_USER.username);
  });

  it("devuelve 401 sin Bearer", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("devuelve 401 con token inválido", async () => {
    const res = await app.inject({
      method:  "GET",
      url:     "/auth/me",
      headers: { authorization: "Bearer invalid.token.here" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("limpia la cookie", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/logout" });
    expect(res.statusCode).toBe(204);
  });
});
