# PROJECT_SPEC.md — Gallero Rebuild Specification v2.0

> **Propósito:** Fuente única de verdad para reconstruir Gallero desde cero, con estándares profesionales de producción.
> **Audiencia:** IAs y desarrolladores. Contiene TODO lo necesario sin ambigüedad.
> **Idioma:** Español para conceptos de dominio, inglés para términos técnicos.

---

## Reglas de Reconstrucción (LEER PRIMERO)

1. **Nada de assets hasta que funcione.** Placeholders geométricos (divs de colores, formas CSS). Assets visuales solo en Fase 5, tras tests verificados.
2. **Organización estricta.** Cada dominio en su propio módulo. Máximo 300 líneas por archivo. Cero lógica de negocio en componentes UI.
3. **Tests primero (TDD).** Vitest para unitarios, Playwright para e2e. Escribir tests ANTES de implementar.
4. **Game engine primero.** `@gallos/game-engine`: TypeScript puro, cero dependencias. Toda la lógica de juego vive aquí.
5. **API después.** Fastify REST + WebSocket PvP. Prisma + PostgreSQL. Redis para sesiones de combate (obligatorio, no opcional).
6. **Frontend al final.** Vite + React Router. SPA pura. Sin SSR, sin frameworks CSS (CSS Modules + styled-jsx).
7. **Commits atómicos y semánticos.** `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`. Un commit por unidad de funcionalidad testeada.
8. **No mezclar concerns.** Game engine no sabe de HTTP. API no sabe de UI. Web no tiene lógica de negocio.
9. **Redis es obligatorio.** Toda sesión de combate (solo, PvP, torre) persiste en Redis. Nada de estado de juego en memoria del servidor.
10. **Seguridad desde el día 0.** Refresh tokens solo en httpOnly cookies. CSP estricto. Rate limiting por endpoint.

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Monorepo | pnpm workspaces | 11.x | `apps/*` + `packages/*` |
| Node | Node.js | 22.x | LTS |
| Lenguaje | TypeScript | 5.7+ | Strict mode, ES2022, ESM |
| Game Engine | TypeScript puro | — | Cero dependencias externas |
| Backend | Fastify | 5.x | REST + WebSocket |
| ORM | Prisma | 6.x | PostgreSQL |
| Cache / Sesiones | Redis (ioredis) | 5.x | Obligatorio. Sesiones de combate, rate limiting, session blacklist |
| Auth | JWT + Google OAuth | — | `jsonwebtoken` + `google-auth-library`. Refresh token en httpOnly cookie |
| Seguridad HTTP | @fastify/helmet | — | Headers de seguridad (CSP, HSTS, etc.) |
| Validación | Zod | 4.x | Schemas compartidos entre API y frontend |
| Frontend | Vite + React Router | 6.x / 7.x | SPA pura, sin SSR. React Router en library mode |
| UI | React | 19.x | CSS Modules + styled-jsx |
| Data Fetching | SWR | 2.x | Auto-refresh en focus/reconnect |
| Testing | Vitest + Playwright | — | Unit + E2E |
| CI/CD | GitHub Actions | — | Lint → Test → Build → Deploy |
| Monitoring | Sentry + heartbeat | — | Producción |
| Mobile (opcional) | Capacitor | — | Envoltorio nativo, Fase 6 |

---

## Arquitectura General

```
packages/game-engine/    ← Lógica de juego pura (TS, cero deps)
        │
        ├── consumido por ── apps/api/     ← Fastify REST API + WebSocket PvP
        │                        │
        │                        ├── Prisma → PostgreSQL
        │                        ├── Redis → Sesiones combate + Rate limiting + Blacklist
        │                        └── Jobs (care decay, cleanup)
        │
        └── consumido por ── apps/web/    ← Vite + React Router SPA
```

**Principio clave:** El game engine es la fuente de verdad de TODA la lógica de juego. API y Web lo consumen, nunca duplican. Redis es el source of truth para estado efímero de combate.

---

## 1. Game Engine (`packages/game-engine`)

Paquete TypeScript puro. Cero dependencias. Compilado con `tsc`. Entry point: `src/index.ts` (barrel export).

### 1.1 Estructura de archivos

```
src/
├── index.ts              # Barrel export
├── version.ts            # Constante de versión
├── care.ts               # Naturalezas, cuidado, vínculo, costes de entrenamiento
├── combat.ts             # Motor de combate (interactivo por turnos)
├── combat-items.ts       # Catálogo de objetos de combate
├── rooster-needs.ts      # Hambre, sed, salud, crecimiento
├── ranking.ts            # Sistema ELO / MMR
├── rewards.ts            # Recompensas de combate
├── missions.ts           # Misiones diarias y rachas
├── tower.ts              # Generación de NPCs de torre e IA
└── economy.ts            # Simulación de economía (Fase 1)
```

### 1.2 Mecánicas detalladas

#### 1.2.1 Ciclo de vida del gallo (Rooster)

**Etapas (RoosterStage):** `"HUEVO"` | `"POLLO"` | `"ADULTO"`

**HUEVO:**
- Tiene rangos de stats pre-rolados al crearse (`eggAttackMin`/`Max`, etc.)
- Tiene `quality`: `"Común"` | `"Normal"` | `"Raro"` | `"Legendario"`
- Tiene `hatchReadyAt`: timestamp ISO de cuándo puede eclosionar
- Tier y tiempos de eclosión base:
  - Común: 30 min, stats 6-16
  - Normal: 1 hora, stats 10-24
  - Raro: 2 horas, stats 16-35
  - Legendario: 4 horas, stats 24-48
- `careCurrent` al eclosionar determina calidad del roll de stats
- Al eclosionar, naturaleza aleatoria asignada

**POLLO:**
- Crece pasivamente si hambre Y sed > 50 (`GROWTH_MIN_RESOURCE = 50`)
- Velocidad de crecimiento: `computeGrowthPerHour(avgStats) = 9.0 * 0.92^avgStats`, clamp [1.5, 8.0]
- Evoluciona a ADULTO cuando `growthProgress >= 100`

**ADULTO:**
- Puede combatir, entrenar, fusionarse
- `growthProgress = 100` fijo

#### 1.2.2 Stats del gallo

4 stats base:
- **attack (Ataque):** Daño infligido
- **defense (Defensa):** Reduce daño recibido
- **speed (Velocidad):** Probabilidad de esquivar, prioridad en empates
- **resistance (Resistencia):** HP = resistance * 3

**Naturalezas (RoosterNature):** `"AGRESIVO"` | `"DEFENSIVO"` | `"VELOZ"` | `"ROBUSTO"` | `"EQUILIBRADO"`

Deltas de entrenamiento por naturaleza (`NATURE_DELTAS`):

| Naturaleza | ATK | DEF | SPD | RES | Total |
|-----------|-----|-----|-----|-----|-------|
| AGRESIVO | +3 | +1 | +1 | +0 | +5 |
| DEFENSIVO | +0 | +3 | +1 | +1 | +5 |
| VELOZ | +1 | +0 | +3 | +1 | +5 |
| ROBUSTO | +1 | +1 | +0 | +3 | +5 |
| EQUILIBRADO | +1 | +1 | +1 | +1 | +4 |

#### 1.2.3 Sistema de cuidado (Care)

- **Care Current:** Valor 0-100 que decae 1 punto cada 2 horas (`CARE_DECAY_INTERVAL_MS = 7,200,000ms`)
- **Care Multiplier:** `computeCareMultiplier(care) = 0.7 + (care/100) * 0.4` → rango [0.70, 1.10]
- **Bond Points (vínculo):** Gana +1 por cada acción de cuidar
  - `computeBondMultiplier(points)`: >= 500 → 1.03, >= 250 → 1.02, >= 100 → 1.01, default 1.00
- **Train cost:** `trainCareCost(avgStats)` — coste de cuidado para entrenar (<18: 5, 18-25: 8, 26-34: 12, 35-44: 18, >=45: 25)
- **randomNature():** Retorna naturaleza aleatoria

#### 1.2.4 Necesidades (Hambre, Sed, Salud)

Constantes:
- `HUNGER_DECAY_PER_HOUR = 4`
- `THIRST_DECAY_PER_HOUR = 8`
- `HUNGER_PER_FEED = 20`
- `THIRST_PER_DRINK = 25`
- `CARE_DECAY_PER_HOUR = 0.5`
- `DEAD_RESCUE_WINDOW_MS = 7 días`
- `GROWTH_MIN_RESOURCE = 50`

**Algoritmo de salud (dual-need):**
- `hungerValue = 100 - hungerSatiety`
- `thirstValue = 100 - thirstHydration`
- `healthValue = 100 - avg(hungerValue, thirstValue) - dualPenalty`
- `dualPenalty = max(0, min(hungerValue, thirstValue) - 50) * 2`
- **Muerte:** healthValue <= 0 SOLO si AMBAS necesidades cruzan el umbral 50 simultáneamente

**Proyección de crecimiento:** `getProjectedRoosterGrowth(rooster, nowMs)` → `RoosterGrowthProjection`

**Snapshot visual:** `getRoosterNeedSnapshot(rooster, nowMs)` → `{ hungerValue, thirstValue, healthValue }`

#### 1.2.5 Sistema de combate

**Sistema interactivo por turnos (principal):**

Tipos de movimiento (`CombatMove`): `"atacar"` | `"defender"` | `"esquivar"` | `"huir"` | `"usar_objeto"`

**Energía:**
- `ENERGY_MAX = 100`, `ENERGY_START = 50`
- `ENERGY_ATTACK_COST = 30`, `ENERGY_DEFEND_RECOVER = 25`, `ENERGY_DODGE_COST = 10`

**Mecánicas:**
1. **Ataque débil:** energía < 30 → daño ×0.5
2. **Defensa:** reduce daño a la mitad (defense × 2). Recupera 25 energía.
3. **Contraataque:** si defiendes y recibes daño > 0 → contraatacas 40% de tu daño
4. **Esquivar:** prob = min(0.75, defenderSpeed / (defenderSpeed + attackerSpeed))
   - Éxito: 0 daño, siguiente ataque momentum ×1.5
   - Fallo: daño ×1.3
5. **Ataque cargado:** 2 defensas consecutivas → siguiente ataque ×1.8
6. **Momentum:** esquiva exitosa → siguiente ataque ×1.5

**Fórmula de daño:**
- `effectiveAtk = attack * careMultiplier * bondMultiplier + buffs`
- `effectiveDef = defense * careMultiplier * bondMultiplier + buffs` (×2 si defendiendo)
- `rawDamage = max(1, floor((effectiveAtk / max(1, effectiveDef)) * 8 * variance))`
- `variance = 0.85 + rng() * 0.3`

**API del sistema de combate:**
- `initCombatState(a, b)` → CombatState inicial
- `resolveTurn(state, fighterA, fighterB, moveA, moveB, rng)` → `{ state, turnResult }`
- `aiPickMove(rng, state?)` → CombatMove
- `applyCombatItem(itemType, state, fighterA, fighterB, itemTurns)` → `{ newState, result }`
- `createSeededRng(seed)` → () => number (PRNG determinístico, mulberry32)

**Buff system:**
```typescript
type CombatBuff = {
  stat: "attack" | "defense" | "speed";
  value: number;
  turnsRemaining: number;
  isSwap?: boolean;
  targetStat?: "attack" | "defense" | "speed";
};
```
- Se decrementan al final de cada turno. No stackean. Swaps afectan a ambos fighters.

#### 1.2.6 Objetos de combate

Tipos (`CombatItemType`):
- `hp_potion_small/medium/large`: 25%/50%/100% HP
- `frenzy/fortress/speed_boost`: +2 stat por varios turnos
- `swap_attack_speed`: Intercambia tu ATK con SPD rival
- `swap_defense_attack`: Intercambia tu DEF con ATK rival

Catálogo: `COMBAT_ITEM_CATALOG` (8 items). Función: `findCombatItemDescriptor(id)`

#### 1.2.7 Ranking MMR (Elo)

- `computeMmrDelta(player, rival, result)` → entero. K = 24.
- `expected = 1 / (1 + 10^((rival - player) / 400))`
- `actual = 1 (win), 0.5 (draw), 0 (loss)`
- Retorna `round(K * (actual - expected))`

#### 1.2.8 Recompensas

- `computeFightReward(result)`: Win = 30, Draw = 15, Loss = 10

#### 1.2.9 Misiones diarias

`DAILY_MISSIONS` (3 misiones fijas):
1. `WIN_2_FIGHTS`: 50 monedas (field: fightsWon)
2. `FEED_3_TIMES`: 30 monedas (field: feedings)
3. `TRAIN_ONCE`: 25 monedas (field: trainings)

`STREAK_BONUSES`: 3 días → +20, 7 días → +75, 14 días → +150, 30 días → +300

- `getStreakBonus(streakDays)` → bonus máximo aplicable
- `todayUtc()` → "YYYY-MM-DD" UTC
- `yesterdayUtc()` → "YYYY-MM-DD" UTC

#### 1.2.10 Torre

**Generación de NPCs:**
- `generateTowerNpc(floor, runSeed)` → TowerNpc
- PRNG determinístico con seed = runSeed + floor * 7919
- Bosses cada 5 pisos (stats ×1.15)
- Campaña pisos 1-10: bosses fijos (Piso 5: "Polvorin" AGRESIVO, Piso 10: "Don Gallo" EQUILIBRADO)
- Pisos >10: 6 bosses rotativos (Sombra, Volcan, Muralla, Titan, Tormenta, Fenix)
- Stats base: 10 + floor * 1.2, modificados por sesgo de naturaleza

**IA de torre:** `aiPickMoveTower(floor, playerLastMoves, npcNature, rng, combatState?)` → TowerAiMove
- Pisos 1-5: uniforme con sesgo de naturaleza
- Pisos 6-10: 50% atacar, 25% defender, 25% esquivar
- Pisos 11-20: 40% counter al último movimiento
- Pisos 21+: 50% counter a últimos 3 movimientos
- Override por energía: <30 → 65% defender; cargado → 85% atacar; momentum → 80% atacar

**Recompensas:** `computeTowerFloorCoins(floor)`: 5 + floor * 2 (boss ×1.5)

#### 1.2.11 Simulación de economía (NUEVO)

`economy.ts` contiene una simulación determinística de la economía del juego:

- `SimulationConfig`: parámetros ajustables (rewards, precios, drops diarios, actividad del jugador)
- `simulatePlayerDay(day: number, config: SimulationConfig, rng: PRNG)` → `DayResult`
- `simulatePlayerLifetime(days: number, config: SimulationConfig)` → `LifetimeResult`
  - Proyecta acumulación de monedas, gastos típicos, tasa de adquisición de gallos, inflación
- **Uso:** Script en `packages/game-engine/scripts/simulate-economy.ts` para validar el balance antes de tocar código de producción
- Se ejecuta como parte de la suite de tests (`pnpm test:economy`)

---

## 2. Base de Datos (Prisma Schema)

### 2.1 Enums

```prisma
enum RoosterStage           { HUEVO POLLO ADULTO }
enum RoosterNature          { AGRESIVO DEFENSIVO VELOZ ROBUSTO EQUILIBRADO }
enum FriendRequestStatus    { PENDING ACCEPTED REJECTED }
enum FightResult            { CHALLENGER_WIN DEFENDER_WIN DRAW }
enum RewardType             { FIGHT WEEKLY_RANKING STREAK TOWER }
enum InventoryItemType      { FOOD WATER ACCESSORY }
enum CosmeticSlot           { CRESTA ALAS BARBA CUERPO COLA }
```

### 2.2 Modelos (19)

| Modelo | Campos clave | Relaciones |
|--------|-------------|------------|
| **User** | id, email (unique), username (unique), passwordHash, mmr (default 1000), coins, towerHighFloor, streakDays, lastStreakDate, lastInventoryRefillAt, fenceScreen | → Rooster[], FeatherCollectible[], Session[], RewardTransaction[], UserCombatItem[], PlacedAccessory[], UserInventory[], UserCosmetic[], EquippedCosmetic[], DailyMissionProgress[], Friendship[], FriendRequest[] |
| **Rooster** | id, userId, name, stage, nature, attack/defense/speed/resistance base, careCurrent, bondPoints, hunger, thirst, growthProgress (0-100), quality, eggStatRanges, customColors (JSON), paintLayers (JSON), positionX/Y, homeScreen, isAtHome, onFence, diedAt, createdAt, updatedAt | → User, Fight[challenger], Fight[defender] |
| **Fight** | id, challengerUserId, defenderUserId, challengerRoosterId, defenderRoosterId, snapshotChallenger (JSON), snapshotDefender (JSON), seed, turnLog (JSON), result, createdAt | → User (×2), Rooster (×2) |
| **Session** | id, userId, refreshTokenHash, userAgent, ipAddress, expiresAt, revokedAt, createdAt | → User |
| **Friendship** | id, userId, friendId, createdAt | → User (×2), @@unique([userId, friendId]) |
| **FriendRequest** | id, senderId, receiverId, status, createdAt, updatedAt | → User (×2), @@unique([senderId, receiverId]) |
| **FeatherCollectible** | id, userId, xPct, yPct, scale, rotationDeg, screen, collectedAt | → User |
| **RewardTransaction** | id, userId, fightId?, type, amount, createdAt | → User |
| **CombatItem** | id, type (unique), name, description, price, turns, effectValue | → UserCombatItem[] |
| **UserCombatItem** | id, userId, itemId, quantity | → User, CombatItem, @@unique([userId, itemId]) |
| **UserInventory** | id, userId, itemType (InventoryItemType), itemKey (String), quantity | → User, @@unique([userId, itemType, itemKey]) |
| **PlacedAccessory** | id, userId, type, screen, positionX, positionY | → User |
| **DailyMissionProgress** | id, userId, date (String YYYY-MM-DD), fightsWon, feedings, trainings, claimed (String[]), createdAt | → User, @@unique([userId, date]) |
| **CosmeticItem** | id, slot (CosmeticSlot), name, description, price, rarity | → UserCosmetic[], EquippedCosmetic[] |
| **UserCosmetic** | id, userId, cosmeticItemId, acquiredAt | → User, CosmeticItem, @@unique([userId, cosmeticItemId]) |
| **EquippedCosmetic** | id, userId, roosterId, cosmeticItemId, slot | → User, Rooster, CosmeticItem, @@unique([roosterId, slot]) |

**Cambios clave vs spec original:**
- `User` ya no tiene 10 columnas de comida + agua. Se migran a `UserInventory`.
- Se añaden `CosmeticItem`, `UserCosmetic`, `EquippedCosmetic` para el sistema de skins.
- `UserInventory` es genérico: `itemType` + `itemKey` + `quantity`. Soporta comida, agua, accesorios de valla.

---

## 3. Redis — Esquema de claves (OBLIGATORIO)

Redis es el source of truth para TODO estado efímero de juego. Nada de sesiones en memoria del servidor.

| Key Pattern | Contenido | TTL | Notas |
|-------------|-----------|-----|-------|
| `combat:{combatId}` | CombatState serializado (JSON) | 2h | Combate solo activo |
| `pvp:room:{roomId}` | PvPRoomState (ambos fighters, turnos, timeout) | 2h | Sala PvP activa |
| `pvp:queue` | Sorted set de jugadores en cola (score = timestamp) | — | Matchmaking |
| `pvp:challenge:{inviteId}` | Challenge payload (retador, gallo, timestamp) | 60s | Desafío pendiente |
| `tower:run:{runId}` | TowerRunState (piso actual, HP, NPC, seed) | 2h | Run de torre activa |
| `rate:{userId}` | Contador de requests | 1min | Rate limiting |
| `rate:{ip}` | Contador de requests | 1min | Rate limiting por IP |
| `session:blacklist:{sessionId}` | "1" | 30d | Sesiones revocadas |
| `ws:{userId}` | `{ wsConnectionId, connectedAt }` | — | Conexiones WebSocket activas |

---

## 4. API (`apps/api`) — Fastify Backend

### 4.1 Estructura de módulos

```
src/
├── server.ts                  # Bootstrap: Fastify + plugins + routes + jobs
├── instrument.ts              # Sentry init
├── db/
│   ├── prisma.ts              # PrismaClient singleton
│   ├── redis.ts               # Redis client (ioredis)
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
    ├── ops/                   # ops.routes.ts (health, readiness, heartbeat)
    └── antiAbuse/             # antiAbuse.service.ts
```

### 4.2 Plugins / Middleware global

- **@fastify/helmet** → Headers de seguridad: CSP, HSTS, X-Content-Type-Options, etc.
- **@fastify/cors** → Orígenes configurados por variable de entorno. Cero wildcard en producción.
- **@fastify/rate-limit** → Con Redis store. 100 req/min global, límites específicos por endpoint.
- **@fastify/compress** → gzip/brotli para payloads >1KB.
- **Sentry (@sentry/node)** → Contexto de usuario en requests autenticadas.
- **@fastify/websocket** → Solo ruta `/ws/pvp`.

### 4.3 Auth (JWT + Google OAuth + httpOnly cookies)

**Tokens:**
- **Access token:** JWT `{ sub: userId, type: "access" }`, 15 min expiry. Se devuelve en el body de la respuesta. El frontend lo guarda en memoria (variable JS), nunca en localStorage.
- **Refresh token:** JWT `{ sub: userId, sid: sessionId, type: "refresh" }`, 30 días expiry. Se establece como **httpOnly, Secure, SameSite=Lax cookie**. El frontend nunca lo lee.
- **Rotación:** Al refrescar, se revoca la sesión anterior (se añade a blacklist en Redis), se crea nueva sesión + nueva cookie.
- **Password hashing:** scrypt con salt 16 bytes, formato `salt:hashhex`.

**Endpoints:**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /auth/register | No | Registro. Setea refresh cookie + retorna access token + user |
| POST | /auth/login | No | Login. Setea refresh cookie + retorna access token + user |
| POST | /auth/google | No | Google OAuth (idToken). Setea refresh cookie + retorna access token + user |
| POST | /auth/refresh | Cookie | Refresca access token usando httpOnly cookie (automática). Rota sesión |
| POST | /auth/logout | Cookie | Revoca refresh token (blacklist Redis) + clear cookie |
| GET | /auth/me | Bearer | Perfil público del usuario |
| GET | /auth/feathers | Bearer | Plumas no recogidas |
| POST | /auth/feathers/roll | Bearer | Tirar para spawn de pluma (90s cooldown) |
| POST | /auth/collect-feather | Bearer | Recoger pluma (+1 moneda) |

**Auth guard:**
- `authenticatedRoute()` wrapper extrae `Bearer <token>` del header, verifica JWT, inyecta userId.
- Errores auth → 401. Errores negocio → 400.

**Flujo de refresh en frontend:**
1. API client envía request con `Authorization: Bearer <accessToken>`
2. Si 401 → llama a `POST /auth/refresh` (la cookie viaja automáticamente)
3. Si refresh OK → guarda nuevo access token en memoria → retry original request
4. Si refresh falla (cookie expirada/revocada) → clear memoria → redirect /login

### 4.4 Roosters

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /roosters/bootstrap | Primer huevo gratis |
| POST | /roosters/bootstrap-and-hatch | Onboarding: crea + eclosiona huevo Común |
| GET | /roosters | Lista gallos con sync de ciclo de vida |
| POST | /roosters | Crea huevo |
| POST | /roosters/fuse | Fusiona 2 ADULTOS → 1 huevo |
| PATCH | /roosters/:id/rename | Renombrar |
| PATCH | /roosters/:id/position | Actualizar posición |
| PATCH | /roosters/:id/colors | Customizar colores |
| PATCH | /roosters/:id/paint-layers | Customizar capas de pintura |
| POST | /roosters/:id/care | Cuidar (+care, +bond) |
| POST | /roosters/:id/train | Entrenar (max 3/día) |
| POST | /roosters/:id/matadero | Vender gallo |
| POST | /roosters/:id/remove-dead | Enterrar gallo muerto |
| POST | /roosters/:id/feed | Alimentar (consume de UserInventory) |
| POST | /roosters/:id/drink | Dar agua (consume de UserInventory) |
| POST | /roosters/:id/collect-food | Recoger comida gratis |
| POST | /roosters/:id/buy-food | Comprar comida con monedas |
| GET | /roosters/:id/combat-items | Objetos de combate |
| POST | /roosters/:id/combat-items/:itemId/use | Usar objeto |
| GET | /roosters/accessories | Accesorios colocados + inventario |
| POST | /roosters/accessories/place | Colocar accesorio |
| POST | /roosters/accessories/:id/store | Guardar accesorio |
| POST | /roosters/fence/place | Colocar valla |
| POST | /roosters/:id/fence/join | Subir a valla (max 2) |
| POST | /roosters/:id/fence/leave | Bajar de valla |
| POST | /roosters/fence/remove | Quitar valla |
| GET | /roosters/egg-shop | Tienda de huevos |
| POST | /roosters/buy-egg | Comprar huevo |
| POST | /roosters/claim-free-egg | Huevo gratis diario |

**Lógica de ciclo de vida (syncRoosterLifecycle):**
- Se ejecuta en cada lectura de gallos. Calcula decay, proyecta crecimiento, detecta muerte/eclosión.
- Transiciones discretas (hatch, death, evolution) se persisten en DB.
- Decay continuo solo en memoria para lecturas. No se persiste cada vez.

**Fusión:** 2 adultos → stats promedio padres, clamp [9, 34], spread ±2. Calidad resultante según avg stats. Padres eliminados.

**Tienda de huevos:**
- Misterioso (80c): 50% Común, 35% Normal, 13% Raro, 2% Legendario
- Selecto (200c): 10% Común, 40% Normal, 35% Raro, 15% Legendario
- Dorado (500c): 0% Común, 15% Normal, 50% Raro, 35% Legendario
- Max 5 huevos por usuario. Gratis diario: mismo tier que Misterioso, <3 huevos activos.

**CPU Bot:** Usuario especial con 10 gallos adultos pre-configurados. Creado en startup. Oponente PvE.

### 4.5 Fights (Combate Solo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /fights/solo/start | Iniciar combate. Crea estado en Redis (TTL 2h) |
| POST | /fights/solo/:id/turn | Enviar movimiento. Resuelve, actualiza Redis |
| GET | /fights/:id | Obtener registro de combate finalizado |

- Estado de combate en Redis, no en memoria. Sobrevive reinicios.
- Anti-abuso: max 3 combates vs mismo usuario en 24h.
- Al finalizar: actualiza MMR, crea Fight record + RewardTransaction.
- Seed determinístico para reproducibilidad.
- Snapshot de stats al iniciar (no cambian durante el combate).

### 4.6 PvP (WebSocket)

**Endpoint:** `GET /ws/pvp`

**Protocolo de mensajes (con heartbeats):**

| Tipo | Dir | Payload |
|------|-----|---------|
| auth | C→S | `{ type: "auth", payload: { token } }` |
| connected | S→C | `{ userId, username }` |
| ping | C→S | `{ type: "ping" }` |
| pong | S→C | `{ type: "pong", payload: { serverTime } }` |
| challenge:send | C→S | `{ targetUsername, roosterId }` |
| challenge:received | S→C | `{ challengerUsername, roosterName, inviteId }` |
| challenge:sent | S→C | Confirmación |
| challenge:expired | S→C | Timeout 60s |
| challenge:accept | C→S | `{ inviteId }` |
| challenge:decline | C→S | Rechazar |
| challenge:declined | S→C | Notificar |
| fight:start | S→C | `{ roomId, role, myFighter, oppFighter, initialState }` |
| turn:move | C→S | `{ roomId, move }` |
| turn:result | S→C | TurnLog + hp/energy |
| fight:over | S→C | `{ winner, mmrDelta, coins }` |
| fight:cancelled | S→C | Timeout/abandono |
| fight:error | S→C | Error de persistencia |

- **Heartbeat:** Cliente envía `ping` cada 25s. Servidor responde `pong`. Si no hay ping en 60s → desconexión.
- Timeout de turno: 30s → auto "huir". Doble timeout → combate cancelado.
- Salas en Redis (TTL 2h). Recuperación tras crash.
- Mismo sistema MMR/recompensas que solo.

### 4.7 Torre

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /tower/runs/start | Iniciar run. Crea estado en Redis (TTL 2h) |
| GET | /tower/runs/:id | Obtener estado de run desde Redis |
| POST | /tower/runs/:id/start-floor | Iniciar combate en piso actual |
| POST | /tower/runs/:id/turn | Enviar movimiento |
| POST | /tower/runs/:id/advance | Avanzar siguiente piso |
| POST | /tower/runs/:id/abandon | Abandonar run (cobrar monedas) |

- **Estado de run en Redis**, no en localStorage del cliente. El servidor es source of truth.
- El frontend puede cachear en localStorage para UX (recuperar tras refresh), pero valida contra Redis.
- Campaña pisos 1-10 gratuitos. `towerHighFloor` = récord personal.

### 4.8 Friends

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /friends | Lista de amigos con estado online |
| GET | /friends/search?q= | Buscar jugadores |
| GET | /friends/requests | Solicitudes pendientes recibidas |
| POST | /friends | Enviar solicitud |
| POST | /friends/requests/:id/accept | Aceptar |
| POST | /friends/requests/:id/reject | Rechazar |
| DELETE | /friends/:friendId | Eliminar |

### 4.9 Cosméticos (NUEVO)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /cosmetics | Catálogo de items cosméticos disponibles |
| GET | /cosmetics/mine | Mis cosméticos adquiridos |
| POST | /cosmetics/:id/buy | Comprar cosmético (monedas) |
| POST | /cosmetics/:id/equip | Equipar en gallo específico |
| POST | /cosmetics/:id/unequip | Desequipar de gallo |

### 4.10 Otros módulos

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| Ranking | GET /ranking/leaderboard | Top 50 MMR (cache Redis 30s) |
| Inventory | GET /inventory, POST /inventory/buy | Gestión de inventario (comida, agua, accesorios) |
| Rewards | POST /rewards/claim-weekly | Premio semanal (100 monedas) |
| Shop | GET /shop/combat-items, POST /shop/combat-items/:id/buy | Tienda de objetos de combate |
| Profile | GET /profile/me | Perfil con stats agregados |
| Missions | GET /missions/daily, POST /missions/daily/claim/:key | Misiones diarias |
| Ops | GET /health, GET /health/ready, GET /health/heartbeat | Health checks |

### 4.11 Jobs en background

- **Care decay:** Cada 15 min, batch SQL decrementa careCurrent.
- **Auto-cleanup dead roosters:** En cada lectura de lista, elimina muertos expirados (>7 días).
- **Session cleanup:** Diario, limpia sesiones expiradas de DB y blacklist Redis.
- **Redis TTL:** Ioredis maneja expiración automática de claves con TTL.

---

## 5. Frontend (`apps/web`) — Vite + React Router SPA

### 5.1 Principios

- **Vite** como bundler/dev server. HMR instantáneo. Sin SSR.
- **React Router 7** en library mode (createBrowserRouter). Sin file-based routing.
- **CSS Modules + styled-jsx.** Sin frameworks CSS.
- **SWR** para data fetching con auto-refresh en focus/reconnect.
- **Access token en memoria** (variable JS). **Refresh token en httpOnly cookie** (automático).
- **API client** con auto-refresh en 401 usando la cookie.

### 5.2 Estructura

```
apps/web/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                # Entry: ReactDOM.createRoot + RouterProvider
    ├── router.tsx              # createBrowserRouter con todas las rutas
    ├── globals.css             # Estilos globales + tokens CSS
    ├── app/
    │   ├── layout.tsx          # AppShell: providers + outlet
    │   ├── home.tsx            # HOME: Granja principal
    │   ├── login.tsx
    │   ├── register.tsx
    │   ├── gallinero.tsx       # Gestión de gallos
    │   ├── huevos.tsx          # Tienda de huevos
    │   ├── roosters.tsx        # Sala de incubación
    │   ├── fights.tsx          # Combate solo
    │   ├── fights-pvp.tsx      # PvP
    │   ├── ranking.tsx         # Leaderboard
    │   ├── torre.tsx           # Torre
    │   ├── perfil.tsx          # Perfil jugador
    │   ├── ropa.tsx            # Personalización (Fase 5-6)
    │   ├── comida.tsx          # Tienda de comida
    │   ├── bebidas.tsx         # Tienda de agua
    │   ├── amigos.tsx          # Amigos
    │   └── ajustes.tsx         # Settings
    ├── components/             # Componentes reutilizables
    │   ├── ui/                 # Botones, inputs, cards, modales
    │   ├── battle/             # BattleHpCard, BattleMoveButtons
    │   ├── farm/               # Componentes de la granja
    │   └── layout/             # AppShell, NavigationWheel, OfflineScreen
    ├── context/                # React contexts
    │   ├── auth.tsx            # AuthContext
    │   ├── pvp.tsx             # PvpContext (WebSocket)
    │   ├── route-transition.tsx
    │   └── toast.tsx           # ToastContext
    ├── features/               # Feature-sliced: hooks + components + lib por feature
    ├── hooks/                  # Hooks globales
    ├── lib/
    │   ├── api/                # API client por dominio
    │   │   ├── client.ts       # requestAuth (con refresh automático)
    │   │   ├── auth.ts
    │   │   ├── roosters.ts
    │   │   ├── fights.ts
    │   │   ├── tower.ts
    │   │   ├── friends.ts
    │   │   ├── cosmetics.ts
    │   │   └── inventory.ts
    │   ├── swr.ts              # SWR config + apiKeys + fetcher
    │   └── settings.ts         # Persistencia de settings
    └── types/                  # Declaraciones de tipos
```

### 5.3 Configuración de rutas

```typescript
// src/router.tsx
createBrowserRouter([
  {
    element: <RootLayout />,    // Providers: Auth → Toast → SWRConfig
    errorElement: <ErrorBoundary />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      {
        element: <AuthGuard />,  // Redirige a /login si no autenticado
        children: [
          {
            element: <AppShell />,  // Navegación + outlet
            children: [
              { index: true, element: <Home /> },
              { path: "gallinero", element: <Gallinero /> },
              { path: "huevos", element: <Huevos /> },
              { path: "roosters", element: <Roosters /> },
              { path: "fights", element: <Fights /> },
              { path: "fights/pvp", element: <Pvp /> },
              { path: "ranking", element: <Ranking /> },
              { path: "torre", element: <Torre /> },
              { path: "perfil", element: <Perfil /> },
              { path: "comida", element: <Comida /> },
              { path: "bebidas", element: <Bebidas /> },
              { path: "amigos", element: <Amigos /> },
              { path: "ajustes", element: <Ajustes /> },
              { path: "ropa", element: <Ropa /> },
              { path: "*", element: <NotFound /> },
            ],
          },
        ],
      },
    ],
  },
]);
```

### 5.4 Context Providers (orden de wrapping en RootLayout)

```
AuthProvider → ToastProvider → SWRConfig → Outlet
```

**AuthContext:**
```typescript
{
  user: AuthUserDto | null,
  accessToken: string | null,    // en memoria, NUNCA en localStorage
  loading: boolean,
  isAuthenticated: boolean,
  login(emailOrUsername, password): Promise<void>,
  register(email, username, password): Promise<void>,
  loginGoogle(idToken): Promise<void>,
  logout(): Promise<void>,
  refreshAccessToken(): Promise<string | null>
}
```

### 5.5 API Client con auto-refresh

```typescript
// lib/api/client.ts
async function requestAuth<T>(url: string, options?: RequestInit): Promise<T> {
  const token = authContext.accessToken;
  let res = await fetch(url, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
    credentials: "include",  // envía cookies httpOnly
  });

  if (res.status === 401) {
    const newToken = await authContext.refreshAccessToken();
    if (newToken) {
      res = await fetch(url, {
        ...options,
        headers: { ...options?.headers, Authorization: `Bearer ${newToken}` },
        credentials: "include",
      });
    } else {
      authContext.logout();
      throw new AuthError("Session expired");
    }
  }

  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

### 5.6 Páginas y funcionalidad

#### HOME (`/`) — La Granja

**Layout:** 3 pantallas swipeables horizontalmente (izquierda, centro, derecha).

**Elementos visuales (placeholders geométricos hasta Fase 5):**
- Ciclo día/noche según hora real. Gallos dormidos de noche.
- Gallo principal renderizado grande. Gallos secundarios en posiciones.
- Drops: plumas, saltamontes, excrementos.
- Valla/Accesorios decorativos.
- HUD: barras de hambre/sed/salud/crecimiento, contador de monedas.

**Interacciones:**
- Drag gallos para cambiar posición
- Drag comida/agua al gallo (drag & drop)
- Tap gallo para acariciar (care)
- Tap drops para recoger/limpiar
- Swipe para cambiar pantalla

| Elemento | Mecánica |
|----------|----------|
| Plumas | Spawn cada 90s. Tap → +1 moneda. Max 40/día |
| Saltamontes | Drops aleatorios → +1 al inventario |
| Excrementos | Spawn cada 15-60 min. Tap → limpiar |
| Suciedad | Acumula cada 2h sin limpiar. Posiciones seeded |
| Sueño | Noche: gallos cierran ojos |

**Navegación:** Rueda o grid (configurable).

#### Gallinero (`/gallinero`)

- Estantería con 6 gallos por página (3 arriba, 3 abajo). Drag & drop para reordenar.
- Búsqueda por nombre. Ordenación: creación, nivel, nombre, naturaleza, stats.
- Ruleta de detalle: stats, renombrar, matadero, mover a home, fusionar.
- Gallos muertos: opción de enterrar.
- **Fusión:** Seleccionar 2 adultos → preview de huevo → confirmar.

#### Resto de páginas

Funcionalidad idéntica a la descrita en el spec original para:
- Sala de Huevos (`/roosters`): swipeable, countdown, animación balanceo.
- Tienda de Huevos (`/huevos`): 3 productos, huevo gratis diario.
- Combate Solo (`/fights`): selección oponente → confirmación → combate → resultado.
- PvP (`/fights/pvp`): desafío → espera → combate WebSocket → resultado.
- Torre (`/torre`): intro → selección gallo → preview → combate → resultado piso → fin run.
- Ranking (`/ranking`): top 50, podio, búsqueda, añadir amigo.
- Amigos (`/amigos`): lista, solicitudes, búsqueda, desafiar.
- Perfil (`/perfil`): stats, racha, récord torre, conteo gallos.
- Tienda Comida (`/comida`): catálogo con páginas, quantity stepper.
- Tienda Bebidas (`/bebidas`): agua, stepper.
- Ajustes (`/ajustes`): sonido, estilo nav, username, logout, versión.
- Ropa (`/ropa`): skins equipables por slot (Fase 5-6).

### 5.7 PvP WebSocket en frontend

**PvpContext:**
- Conexión a `ws://<API_HOST>/ws/pvp`. Auth vía mensaje inicial con access token.
- Auto-reconnect con backoff exponencial (1s, 2s, 4s, max 30s). Pausa en background.
- Heartbeat: envía `ping` cada 25s. Si no hay `pong` en 10s → reconexión.
- Estado: connected, desafíos entrantes/salientes, sala activa, resultado.

### 5.8 Otros sistemas

- **RouteTransitionContext:** View Transition API. `push`, `replace`, `back`. Tipos: forwards, backwards, drill-in, drill-out, swap.
- **ToastContext:** `pushToast(message, kind)`, `dismissToast(id)`. Auto-dismiss 3.5s. Animación slide-in/out.
- **TutorialOverlay:** Overlays por escena, persistidos en localStorage. No se repiten.
- **useSettings():** `{ sound: boolean, navStyle: "grid" | "wheel" }`. Persistido en localStorage.
- **OfflineScreen, LoadingScreen, SplashScreen, GallineroSkeleton:** Estados de carga/error.
- **ErrorBoundary:** En rutas principales.

---

## 6. Sistema de Plumas (Economía)

### Fuentes de ingreso

| Fuente | Cantidad | Frecuencia/Límite |
|--------|----------|-------------------|
| Recoger pluma | +1 | Max 40/día |
| Victoria combate | +30 | Ilimitado |
| Empate combate | +15 | Ilimitado |
| Derrota combate | +10 | Ilimitado |
| Piso de torre | 5 + floor*2 (boss ×1.5) | Por piso |
| Ranking semanal | 100 | 1/semana |
| Venta gallo (matadero) | Variable (nivel, salud) | Por gallo |
| Entierro gallo muerto | 8% valor base | Por gallo muerto |
| Misiones diarias | 25-50 + streak bonus | Por misión |

### Gastos

| Concepto | Coste |
|----------|-------|
| Huevo Misterioso | 80 |
| Huevo Selecto | 200 |
| Huevo Dorado | 500 |
| Comida (varios) | 36-120 |
| Agua | 24 |
| Objetos de combate | 60-180 |
| Cosméticos | Por definir (simular primero) |

### Simulación de economía (validación pre-implementación)

**Script: `packages/game-engine/scripts/simulate-economy.ts`**

- Simula N días de actividad de diferentes perfiles de jugador (casual, activo, hardcore).
- Proyecta: monedas acumuladas, gallos adquiridos, tasa de abandono según escasez/abundancia.
- Output: gráfico de evolución de monedas, alertas si hay inflación/deflación.
- Se ejecuta en CI. Si los parámetros cambian, se re-simula.
- **Regla:** Ningún precio o reward se commitea sin haber pasado la simulación.

---

## 7. Roadmap de Reconstrucción

### Fase 0 — Infraestructura

- [ ] Inicializar monorepo pnpm (`pnpm-workspace.yaml`, `.npmrc`)
- [ ] Configurar TypeScript base (`tsconfig.base.json`)
- [ ] Configurar ESLint + Prettier
- [ ] Crear `packages/game-engine` con build script (tsc)
- [ ] Crear `apps/api` con Fastify skeleton + Prisma
- [ ] Crear `apps/web` con Vite + React Router skeleton
- [ ] Configurar Vitest en los 3 paquetes
- [ ] Configurar GitHub Actions: CI (lint → typecheck → test)
- [ ] Configurar Docker Compose para desarrollo local (PostgreSQL + Redis)
- [ ] Crear `.env.example` para todos los paquetes

### Fase 1 — Game Engine (sin assets, tests primero)

- [ ] 1.1 `version.ts`
- [ ] 1.2 `care.ts` (naturalezas, cuidado, vínculo, costes)
- [ ] 1.3 `rooster-needs.ts` (hambre, sed, salud, crecimiento)
- [ ] 1.4 `combat-items.ts` (catálogo)
- [ ] 1.5 `combat.ts` (motor interactivo por turnos)
- [ ] 1.6 `ranking.ts` (MMR)
- [ ] 1.7 `rewards.ts` (recompensas)
- [ ] 1.8 `missions.ts` (misiones diarias)
- [ ] 1.9 `tower.ts` (NPCs e IA)
- [ ] 1.10 `economy.ts` (simulación de economía)
- [ ] 1.11 Script `simulate-economy.ts` + integración en tests
- [ ] 1.12 `index.ts` (barrel export)

### Fase 2 — Base de Datos

- [ ] Schema de Prisma (19 modelos, 7 enums)
- [ ] Migración inicial
- [ ] Seeds: CombatItem templates, CosmeticItem templates, CPU bot user

### Fase 3 — API (módulo por módulo, tests primero)

- [ ] 3.1 Server skeleton + plugins (helmet, cors, rate-limit, compress, websocket)
- [ ] 3.2 Auth (JWT + Google OAuth + httpOnly cookies)
- [ ] 3.3 Redis client + esquema de claves
- [ ] 3.4 Roosters (CRUD, lifecycle, care, train, feed, fuse, egg shop)
- [ ] 3.5 Inventory (comida, agua, accesorios)
- [ ] 3.6 Fights solo (con Redis)
- [ ] 3.7 PvP WebSocket (con Redis, heartbeats)
- [ ] 3.8 Torre (con Redis, server-side state)
- [ ] 3.9 Friends
- [ ] 3.10 Cosmetics (catálogo, compra, equipar)
- [ ] 3.11 Ranking + Rewards
- [ ] 3.12 Shop + Missions + Profile
- [ ] 3.13 Ops (health, readiness, heartbeat) + Anti-abuse
- [ ] 3.14 Background jobs (care decay, session cleanup)
- [ ] 3.15 CPU Bot seed

### Fase 4 — Frontend (componentes con placeholders, sin assets)

- [ ] 4.1 Vite config + React Router + providers
- [ ] 4.2 API client con auto-refresh (httpOnly cookie)
- [ ] 4.3 Login / Register / Google OAuth
- [ ] 4.4 Home (granja) — MECÁNICAS con placeholders geométricos
- [ ] 4.5 Gallinero v2
- [ ] 4.6 Sala de huevos
- [ ] 4.7 Tienda de huevos
- [ ] 4.8 Combate solo
- [ ] 4.9 PvP WebSocket + heartbeats
- [ ] 4.10 Torre
- [ ] 4.11 Ranking
- [ ] 4.12 Amigos
- [ ] 4.13 Perfil
- [ ] 4.14 Tienda de comida
- [ ] 4.15 Tienda de bebidas
- [ ] 4.16 Ajustes
- [ ] 4.17 Tienda de cosméticos (placeholder, Fase 5-6 completa)
- [ ] 4.18 Navegación + transiciones
- [ ] 4.19 Tutorial
- [ ] 4.20 Toast notifications
- [ ] 4.21 Estados offline/loading/error (OfflineScreen, LoadingScreen, ErrorBoundary)

### Fase 5 — Assets y Polish

**SOLO cuando TODAS las funcionalidades estén completas y testeadas:**
- [ ] Sprites de gallos (cuerpo, partes, slots de cosméticos)
- [ ] Fondos (granja día/tarde/noche, gallinero, arena)
- [ ] Iconos de UI (navegación, comida, objetos, cosméticos)
- [ ] Animaciones Lottie (molino, girasol, árbol, pájaro)
- [ ] Fuentes (Cinzel, Crimson Text, Almond Milky)
- [ ] Efectos de sonido + música ambiente
- [ ] PWA (manifest, service worker, iconos)
- [ ] Assets de cosméticos (cresta, alas, barba, cuerpo, cola)

### Fase 6 — Expansión (Post-rebuild)

- [ ] 6.1 Completo de tienda de cosméticos (UI + assets)
- [ ] 6.2 Logros (Achievements)
- [ ] 6.3 Notificaciones in-app (Web Push)
- [ ] 6.4 Temporadas + pase de batalla
- [ ] 6.5 Torneo semanal automatizado
- [ ] 6.6 Clanes
- [ ] 6.7 Intercambio entre jugadores
- [ ] 6.8 Visitar granjas de amigos
- [ ] 6.9 Capacitor wrapper (iOS/Android)
- [ ] 6.10 Admin panel (gestión de usuarios, economía, bans)

---

## 8. Seguridad

### 8.1 Autenticación

- Access token JWT: 15 min, en memoria del frontend (nunca localStorage/sessionStorage).
- Refresh token JWT: 30 días, en cookie `httpOnly`, `Secure`, `SameSite=Lax`.
- Rotación de refresh token en cada uso. Sesión anterior se revoca (Redis blacklist).
- Passwords: scrypt con salt 16 bytes.

### 8.2 Headers HTTP (via @fastify/helmet)

- `Content-Security-Policy`: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:*; img-src 'self' data:
- `Strict-Transport-Security`: max-age=31536000; includeSubDomains
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY
- `Referrer-Policy`: strict-origin-when-cross-origin

### 8.3 Rate Limiting (Redis-backed)

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| /auth/login | 5 | 1 min |
| /auth/register | 3 | 1 min |
| /auth/refresh | 10 | 1 min |
| Global resto | 100 | 1 min |

### 8.4 Validación

- Zod schemas compartidos en un paquete `packages/shared-schemas` (opcional, sino inline en API).
- Toda request validada antes de tocar DB o game engine.

### 8.5 Anti-Abuse

- Max 3 combates vs mismo usuario en 24h.
- Detección de auto-pelea (mismo IP, mismo dispositivo).
- Cooldowns en acciones de economía (plumas: 90s, comida gratis: 1h).
- Rate limit en WebSocket: max 5 conexiones por usuario.

---

## 9. CI/CD (GitHub Actions)

### Pipeline: Pull Request

```yaml
name: CI
on: [pull_request]
jobs:
  lint:      # ESLint + Prettier check
  typecheck: # tsc --noEmit en los 3 paquetes
  test:      # Vitest (unit + economy simulation)
  build:     # Build de los 3 paquetes
```

### Pipeline: Main Branch

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test-and-build:  # Mismos checks que CI
  deploy-api:      # Build + deploy API a producción
  deploy-web:      # Build + deploy Web a CDN / Vercel / Railway
```

### Entornos

- **Development:** Docker Compose local (PostgreSQL + Redis + API + Web)
- **Staging:** Rama `staging`, mismo deploy que prod pero en entorno aislado
- **Production:** Rama `main`, despliegue automático

---

## 10. Monitoring & Observability

- **Sentry:** Errores de API y frontend. Contexto de usuario en requests autenticadas.
- **Health checks:**
  - `GET /health` → 200 (servidor up)
  - `GET /health/ready` → 200 si PostgreSQL + Redis responden
  - `GET /health/heartbeat` → 200 con timestamp
- **WebSocket heartbeat:** Cliente → servidor cada 25s. Log de desconexiones anómalas.
- **Redis monitoring:** Latencia de comandos Redis (ioredis emite eventos).
- **Job monitoring:** Care decay y session cleanup loguean duración y errores.
- **Logging estructurado:** pino (incluido en Fastify). Niveles: trace, debug, info, warn, error, fatal.

---

## 11. Pruebas (Testing Strategy)

### Unitarios (Vitest)

- **Game engine:** 100% de cobertura. Cada función pura, cada constante, cada caso borde.
- **API services:** Con Prisma mockeado (o base de datos de prueba en Docker).
- **Frontend hooks/contexts:** Con React Testing Library.

### Integración

- **API endpoints:** Fastify inject + PostgreSQL/Redis de prueba.
- **WebSocket PvP:** Dos clientes WS simulando combate completo.
- **Redis:** Verificar que las claves persisten/expiran correctamente.

### E2E (Playwright)

- Flujo de onboarding: registro → bootstrap → eclosión → alimentar → primer combate.
- Flujo PvP: login dos usuarios → challenge → combate → resultado.
- Flujo torre: selección gallo → pisos 1-3 → abandonar.
- Flujo economía: comprar huevo → comprar comida → alimentar → recoger plumas.

### Simulación de economía

- Script `simulate-economy.ts` ejecutado en CI.
- Falla el build si la economía proyecta inflación >20% en 90 días o déficit crónico.

---

## 12. Variables de Entorno

### API (`apps/api/.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| DATABASE_URL | Sí | — | PostgreSQL connection string |
| REDIS_URL | Sí | — | Redis connection string (obligatorio) |
| JWT_ACCESS_SECRET | Sí | — | Secreto para access tokens |
| JWT_REFRESH_SECRET | Sí | — | Secreto para refresh tokens |
| GOOGLE_CLIENT_ID | Para Google OAuth | — | Google OAuth client ID |
| SENTRY_DSN | No | — | Solo producción |
| PORT | No | 3000 | Puerto del servidor |
| NODE_ENV | No | development | "production" activa Sentry + restricciones |
| CORS_ALLOWED_ORIGINS | No | http://localhost:5173 | Orígenes extra CORS (coma-separado) |
| COOKIE_DOMAIN | No | — | Dominio de la cookie (producción) |

### Web (`apps/web/.env`)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| VITE_API_URL | Sí | URL base del API |
| VITE_WS_URL | Sí | URL WebSocket del API |
| VITE_GOOGLE_CLIENT_ID | Para Google OAuth | Google OAuth client ID |
| VITE_SENTRY_DSN | No | Solo producción |
| VITE_ENABLE_DEV_HATCH | No | Botón dev hatch (solo desarrollo) |

---

## 13. Comandos del Monorepo

```bash
pnpm dev                  # Dev: game-engine build (watch) → api + web
pnpm build                # Build de los 3 paquetes
pnpm test                 # Vitest en todo el workspace
pnpm test:economy         # Solo simulación de economía
pnpm lint                 # ESLint en todo el workspace
pnpm typecheck            # TypeScript check en todo el workspace
pnpm --filter @gallos/game-engine build   # Build solo engine
pnpm --filter @gallos/api dev             # Dev solo API
pnpm --filter @gallos/web dev             # Dev solo Web (Vite)
```

---

## 14. Principios de Código

1. **Un archivo, una responsabilidad.** Máximo 300 líneas. Si crece, dividir.
2. **Tipos explícitos.** Prohibido `any`. Usar `unknown` y type narrowing.
3. **No duplicar lógica.** Si está en el game engine, importarlo desde ahí. Nunca reimplementar.
4. **Manejo de errores explícito.** Toda función async debe manejar errores o documentar que no lo hace.
5. **Naming del dominio.** Usar: gallo, pluma, care, nature, vínculo, torre, pelea, etc.
6. **Sin console.log en producción.** Usar `pino` logger en API, nada en frontend.
7. **Commits semánticos:** `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `perf:`, `security:`
8. **Tests descriptivos:** `it("should kill rooster when both hunger and thirst exceed threshold")`
9. **Cero estado en memoria del servidor.** Todo estado efímero va a Redis. El servidor debe ser stateless.
10. **Simulación antes de números mágicos.** Cualquier reward, precio o tasa debe pasar por `simulate-economy.ts`.

---

## 15. Architecture Decision Records (ADR)

Las decisiones de arquitectura importantes se documentan en `docs/adr/` con el formato:

```
docs/adr/
├── 001-use-redis-for-sessions.md
├── 002-httpOnly-cookies-for-refresh-tokens.md
├── 003-vite-instead-of-nextjs.md
├── 004-generic-inventory-table.md
└── 005-cosmetic-system-v1.md
```

Cada ADR contiene: **Contexto, Decisión, Alternativas consideradas, Consecuencias.**

Se crea un ADR para cada decisión que afecte arquitectura, seguridad o modelo de datos.

---

## 16. Documentación Adicional Requerida

Además de este spec, el proyecto debe contener (crear en Fase 0):

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| README.md | Raíz | Setup rápido, requisitos, enlaces a docs |
| CONTRIBUTING.md | Raíz | Guía de contribución, flujo de git, estilo de código |
| docker-compose.yml | Raíz | PostgreSQL + Redis para desarrollo local |
| .github/workflows/ci.yml | Raíz | Pipeline de CI/CD |
| APPS_README.md | apps/api/ | Setup específico de API |
| APPS_README.md | apps/web/ | Setup específico de Web |

---

*Versión: 2.0 — Mayo 2026*
*Este documento es la especificación canónica para la reconstrucción de Gallero desde cero.*
