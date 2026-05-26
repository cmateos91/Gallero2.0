# @gallos/api

Backend API — Fastify 5.x con REST + WebSocket PvP.

## Stack

- **Fastify 5** — HTTP server
- **Prisma 6** — ORM para PostgreSQL
- **ioredis** — Redis client (sesiones de combate, rate limiting, blacklist)
- **JWT** — Autenticación (access + httpOnly refresh cookie)
- **Zod** — Validación de requests
- **Pino** — Logger estructurado

## Estructura (definida en PROJECT_SPEC.md §4.1)

```
src/
├── server.ts                  # Bootstrap: Fastify + plugins + health routes
├── instrument.ts              # Sentry init
├── db/
│   ├── prisma.ts              # PrismaClient singleton
│   ├── redis.ts               # Redis client (lazy)
│   └── runtime.ts             # Re-exports
├── jobs/
│   ├── scheduler.ts           # Gestor de intervalos
│   └── careDecay.job.ts       # Batch SQL: decrementa careCurrent
└── modules/
    ├── auth/                  # auth.routes.ts, auth.service.ts, auth.guard.ts
    ├── roosters/              # roosters.routes.ts, roosters.service.ts, cpu-seed.ts
    ├── fights/                # fights.routes.ts, fights.service.ts
    ├── pvp/                   # pvp.routes.ts (WS), pvp.manager.ts, pvp.redis.ts
    ├── tower/                 # tower.routes.ts, tower.service.ts
    ├── friends/               # friends.routes.ts, friends.service.ts
    ├── ranking/               # ranking.routes.ts
    ├── shop/                  # shop.routes.ts, shop.service.ts
    ├── inventory/             # inventory.routes.ts, inventory.service.ts
    ├── cosmetics/             # cosmetics.routes.ts, cosmetics.service.ts
    ├── missions/              # missions.routes.ts, missions.service.ts
    ├── profile/               # profile.routes.ts
    ├── rewards/               # rewards.service.ts
    ├── ops/                   # ops.routes.ts (health, readiness)
    └── antiAbuse/             # antiAbuse.service.ts
```

## Autenticación

- Access token: JWT 15 min, devuelto en body. Frontend lo guarda en memoria JS.
- Refresh token: JWT 30 días, httpOnly Secure SameSite=Lax cookie.
- Rotación: al refrescar, se revoca sesión anterior (Redis blacklist).

## Comandos

```bash
pnpm --filter @gallos/api dev              # Dev con hot reload (tsx watch)
pnpm --filter @gallos/api build            # Compila TypeScript
pnpm --filter @gallos/api test             # Corre tests
pnpm --filter @gallos/api typecheck        # TypeScript check
pnpm --filter @gallos/api db:migrate       # Prisma migrate
pnpm --filter @gallos/api db:studio        # Prisma Studio (GUI)
pnpm --filter @gallos/api db:seed          # Seeds
```
