# Gallero 2.0

Juego de crianza y combate de gallos. Monorepo con game engine TypeScript, API Fastify y frontend Vite SPA.

[![CI](https://github.com/SectorHLabs/gallero/actions/workflows/ci.yml/badge.svg)](https://github.com/SectorHLabs/gallero/actions/workflows/ci.yml)
![Status](https://img.shields.io/badge/phase-0%20infrastructure-blue)

## Requisitos

- **Node.js** >= 22
- **pnpm** >= 11
- **Docker** (para PostgreSQL y Redis en desarrollo)

## Setup rápido

```bash
# 1. Clonar e instalar
git clone <repo-url> && cd Gallero2.0
pnpm install

# 2. Levantar base de datos
docker-compose up -d

# 3. Migrar base de datos
pnpm --filter @gallos/api exec prisma migrate dev

# 4. Build del game engine
pnpm --filter @gallos/game-engine build

# 5. Arrancar en dev
pnpm dev
```

- **API:** http://localhost:3000
- **Web:** http://localhost:5173
- **Prisma Studio:** `pnpm --filter @gallos/api exec prisma studio`

## Estructura

```
Gallero2.0/
├── packages/
│   └── game-engine/      ← Lógica de juego pura (TypeScript, cero deps)
├── apps/
│   ├── api/              ← Backend Fastify (REST + WebSocket PvP)
│   └── web/              ← Frontend Vite + React Router SPA
├── docs/
│   └── adr/              ← Architecture Decision Records
├── PROJECT_SPEC.md       ← Especificación canónica del proyecto
├── AGENTS.md             ← Entry point para IAs
├── CONTEXT.md            ← Lenguaje de dominio
└── CONTRIBUTING.md       ← Guía de contribución
```

## Documentación

| Documento | Audiencia | Contenido |
|-----------|-----------|-----------|
| [PROJECT_SPEC.md](./PROJECT_SPEC.md) | Devs / IAs | Spec completa: mecánicas, API, DB, roadmap |
| [AGENTS.md](./AGENTS.md) | IAs | Stack, comandos, convenciones, dónde encontrar cada cosa |
| [CONTEXT.md](./CONTEXT.md) | Todos | Lenguaje de dominio, glosario de términos |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Devs | Flujo de trabajo, estilo de código, testing |

## Comandos

```bash
pnpm dev              # Dev mode (API + Web en paralelo)
pnpm build            # Build de los 3 paquetes
pnpm test             # Vitest en todo el workspace
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check
```

## Roadmap

| Fase | Estado | Descripción |
|------|--------|-------------|
| 0 | 🔵 En progreso | Infraestructura: monorepo, toolchain, Docker, CI/CD |
| 1 | ⚪ Pendiente | Game Engine: lógica de juego pura con TDD |
| 2 | ⚪ Pendiente | Base de datos: schema Prisma, migración inicial |
| 3 | ⚪ Pendiente | API: endpoints REST + WebSocket PvP |
| 4 | ⚪ Pendiente | Frontend: Vite SPA con placeholders |
| 5 | ⚪ Pendiente | Assets y polish |
| 6 | ⚪ Pendiente | Expansión: cosméticos, logros, clanes |

## Licencia

Propietario — Sector H Labs.
