import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    await reply.code(401).send({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    await reply.code(500).send({ error: "Server misconfiguration" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { sub: string; type: string };
    if (payload.type !== "access") throw new Error("Wrong token type");
    req.userId = payload.sub;
  } catch {
    await reply.code(401).send({ error: "Invalid or expired token" });
  }
}
