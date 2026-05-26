# ADR-001: Usar Redis para sesiones de combate

**Fecha:** 2026-05-26
**Estado:** Accepted

## Contexto

El juego tiene combates por turnos (solo, torre, PvP) que pueden durar varios minutos. El estado del combate incluye: HP, energía, buffs activos, historial de turnos, seed del RNG.

En el spec original (v1), las sesiones se almacenaban en memoria del servidor Node (`Map`). Esto significa que un reinicio del servidor (deploy, crash, OOM) destruye todos los combates activos.

## Decisión

**Toda sesión de combate se persiste en Redis.** El servidor Node es completamente stateless respecto al estado de juego.

- Combates solo: `combat:{combatId}` → TTL 2h
- Salas PvP: `pvp:room:{roomId}` → TTL 2h
- Runs de torre: `tower:run:{runId}` → TTL 2h
- Desafíos PvP: `pvp:challenge:{inviteId}` → TTL 60s
- Cola de matchmaking: `pvp:queue` → Sorted Set
- Rate limiting: `rate:{userId}` / `rate:{ip}` → TTL 1m
- Sesiones revocadas: `session:blacklist:{sessionId}` → TTL 30d
- Conexiones WebSocket: `ws:{userId}` → sin TTL

## Alternativas consideradas

1. **Sesiones en memoria (Map):** El spec original. Descarte: no sobrevive reinicios, no escala horizontal.
2. **PostgreSQL:** Sesiones en tabla dedicada. Descarte: latencia más alta, desgaste innecesario de DB para estado efímero.
3. **SQLite en memoria:** Descarte: mismo problema que Map (no sobrevive reinicios del proceso).

## Consecuencias

- **Positivo:** El servidor puede reiniciarse sin perder combates. Escala horizontal (múltiples instancias comparten Redis). Recuperación tras crash.
- **Negativo:** Redis se vuelve obligatorio (no opcional). Latencia de red extra (~1ms en local). Mayor complejidad de infraestructura.
- **Mitigación:** Docker Compose incluye Redis por defecto. CI incluye Redis como service container.
