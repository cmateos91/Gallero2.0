# @gallos/game-engine

Game engine package — TypeScript puro, cero dependencias externas. Contiene TODA la lógica de juego.

## Reglas

- **Cero dependencias.** Ni `zod`, ni `lodash`, ni nada. Solo TypeScript stdlib.
- **TDD.** Tests escritos antes que la implementación.
- **Funciones puras y determinísticas.** Todas las funciones de lógica son puras (misma entrada → misma salida). PRNG con seed para reproducibilidad.
- **Tipos exportados.** Todos los tipos públicos se exportan desde `index.ts`.

## Estructura (definida en PROJECT_SPEC.md §1.1)

```
src/
├── index.ts              # Barrel export (contrato público)
├── version.ts            # Constante de versión semver
├── care.ts               # Naturalezas, cuidado, vínculo, costes de entrenamiento
├── combat.ts             # Motor de combate interactivo por turnos
├── combat-items.ts       # Catálogo de objetos de combate
├── rooster-needs.ts      # Hambre, sed, salud, crecimiento
├── ranking.ts            # Sistema ELO / MMR
├── rewards.ts            # Recompensas de combate
├── missions.ts           # Misiones diarias y rachas
├── tower.ts              # Generación de NPCs de torre e IA
└── economy.ts            # Simulación de economía
```

Cada archivo `.ts` tiene su correspondiente `.test.ts` en el mismo directorio.

## Convenciones

- **Tipos:** Interfaces para objetos públicos, types para unions/primitivas.
- **Constantes:** UPPER_SNAKE_CASE (`HUNGER_DECAY_PER_HOUR`, `ENERGY_MAX`).
- **Unidades:** Timestamps siempre en milisegundos, duraciones en horas.
- **Dominio en español:** Gallo, naturaleza, huevo, pollo, pluma, vínculo, torre.

## Comandos

```bash
pnpm --filter @gallos/game-engine build    # Compila a dist/
pnpm --filter @gallos/game-engine dev      # Build en watch mode
pnpm --filter @gallos/game-engine test     # Corre tests
pnpm --filter @gallos/game-engine typecheck # TypeScript check
```
