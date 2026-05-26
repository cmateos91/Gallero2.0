# AGENTS.md — Gallero 2.0

> **Entry point para IAs.** Este archivo contiene todo lo que un agente IA necesita saber para trabajar en este proyecto.

## Project Overview

Gallero es un juego de crianza y combate de gallos. El jugador gestiona una granja con gallos que nacen de huevos, crecen, pelean por turnos, y compiten en ranking MMR.

**Monorepo:** `pnpm workspaces` con 3 paquetes:
- `packages/game-engine` — Lógica de juego pura (TypeScript, cero dependencias)
- `apps/api` — Backend Fastify (REST + WebSocket PvP)
- `apps/web` — Frontend Vite + React Router (SPA)

## Quick Start

```bash
# Requisitos: Node >=22, pnpm >=11, Docker
docker-compose up -d                    # PostgreSQL + Redis
pnpm install
pnpm --filter @gallos/game-engine build
pnpm --filter @gallos/api exec prisma migrate dev
pnpm dev                                # Arranca API + Web en paralelo
```

## Architecture

```
packages/game-engine/    ← Lógica pura (TS, cero deps)
        │
        ├── consumido por ── apps/api/     ← Fastify REST + WebSocket
        │                        │
        │                        ├── Prisma → PostgreSQL
        │                        └── Redis → Sesiones combate, rate limiting
        │
        └── consumido por ── apps/web/    ← Vite SPA (React Router)
```

**Principio clave:** El game engine es la fuente de verdad. API y Web lo consumen, nunca duplican lógica. Redis es obligatorio para sesiones de combate.

## Technology Stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | pnpm workspaces |
| Lenguaje | TypeScript 5.7+ (strict, ES2022, ESM) |
| Game Engine | TypeScript puro (cero deps) |
| Backend | Fastify 5.x + Prisma 6.x + ioredis |
| Frontend | Vite 6.x + React 19 + React Router 7 |
| Testing | Vitest + Playwright |
| Infra | PostgreSQL 16 + Redis 7 + Docker |

## Commands

```bash
pnpm dev                  # Dev mode (game-engine build watch → api + web)
pnpm build                # Build all packages
pnpm test                 # Vitest across workspace
pnpm test:economy         # Economy simulation only
pnpm lint                 # ESLint across workspace
pnpm typecheck            # TypeScript check across workspace
pnpm --filter @gallos/game-engine build   # Build solo engine
pnpm --filter @gallos/api dev             # Dev solo API
pnpm --filter @gallos/web dev             # Dev solo Web
```

## Conventions

1. **Un archivo, una responsabilidad.** Máximo 300 líneas. Si crece, dividir.
2. **Tipos explícitos.** Prohibido `any`. Usar `unknown` y type narrowing.
3. **No duplicar lógica.** Si está en el game engine, importarlo desde ahí.
4. **Tests primero (TDD).** Escribir tests ANTES de implementar.
5. **Commits semánticos:** `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`
6. **Nada de assets hasta Fase 5.** Usar placeholders geométricos.
7. **Cero estado en memoria del servidor.** Todo estado efímero en Redis.
8. **Naming del dominio:** gallo, pluma, care, nature, vínculo, torre, pelea.
9. **Idioma:** Código y comentarios técnicos en inglés, dominio en español.

## Where to Find Things

| Qué buscas | Dónde está |
|-----------|-----------|
| Spec completa del proyecto | `PROJECT_SPEC.md` |
| Lenguaje de dominio | `CONTEXT.md` |
| Decisiones de arquitectura | `docs/adr/` |
| Lógica de juego | `packages/game-engine/src/` |
| Endpoints API | `apps/api/src/modules/` |
| Esquema DB | `apps/api/prisma/schema.prisma` |
| Rutas frontend | `apps/web/src/router.tsx` |
| Componentes UI | `apps/web/src/components/` |
| Configuración CI/CD | `.github/workflows/` |

## Current Phase

**Fase 0 — Infraestructura** (en progreso)

Setup del monorepo, configuración de toolchain, Docker Compose, documentación base.

**Siguiente:** Fase 1 — Game Engine (TDD, lógica pura de juego).

## Key Design Decisions

- **Vite en lugar de Next.js:** Next.js como SPA pura es un antipatrón. Vite es más rápido y nativo para SPAs. Ver `docs/adr/003-vite-instead-of-nextjs.md`.
- **Redis obligatorio:** Sesiones de combate persisten en Redis. El servidor es stateless. Ver `docs/adr/001-use-redis-for-sessions.md`.
- **httpOnly cookies para refresh tokens:** Access token en memoria JS, refresh en cookie segura. Ver `docs/adr/002-httpOnly-cookies-for-refresh-tokens.md`.
- **UserInventory normalizado:** Tabla genérica en lugar de columnas en User. Ver `docs/adr/004-generic-inventory-table.md`.
- **Cosméticos diseñados desde Fase 0:** Schema listo aunque la UI venga después. Ver `docs/adr/005-cosmetic-system-v1.md`.
