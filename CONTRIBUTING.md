# CONTRIBUTING.md — Gallero 2.0

## Flujo de trabajo

1. **Crear branch desde `main`:** `feat/nombre-funcionalidad`, `fix/nombre-bug`, `chore/nombre-tarea`
2. **TDD:** Escribir tests primero. Verificar que fallen. Implementar. Verificar que pasen.
3. **Commits atómicos:** Un commit por unidad de funcionalidad testeada.
4. **PR a `main`:** Requiere CI verde (lint + typecheck + test).
5. **Merge squash.** El mensaje del PR debe ser descriptivo.

## Convenciones de commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: añadir sistema de cuidado de gallos
fix: corregir cálculo de salud con dual-need
refactor: extraer constantes de combate a archivo separado
test: añadir tests para crecimiento de pollos
chore: actualizar dependencias
docs: documentar API de torre
```

## Estilo de código

### TypeScript

- **Strict mode activado.** Sin excepciones.
- **Prohibido `any`.** Usar `unknown` con type narrowing.
- **Tipos explícitos** en firmas de funciones exportadas.
- **Interfaces para objetos públicos, types para unions/primitivas.**
- **Un archivo, una responsabilidad.** Máximo 300 líneas.

### Naming

- **Archivos:** kebab-case (`rooster-needs.ts`, `combat-items.ts`)
- **Funciones:** camelCase (`computeGrowthPerHour`, `getRoosterNeedSnapshot`)
- **Tipos/Interfaces:** PascalCase (`RoosterStage`, `CombatState`)
- **Constantes:** UPPER_SNAKE_CASE (`HUNGER_DECAY_PER_HOUR`, `ENERGY_MAX`)
- **Enums:** PascalCase, valores en el idioma de dominio (`RoosterStage.HUEVO`, `RoosterNature.AGRESIVO`)

### Imports

Orden:
1. Built-in modules (`node:*`)
2. External packages (`fastify`, `react`)
3. Internal packages (`@gallos/game-engine`)
4. Relative imports (`./care`, `../utils`)

### React

- **Componentes:** PascalCase, una carpeta por componente si tiene sub-archivos.
- **Hooks:** camelCase con prefijo `use` (`useAuth`, `useRoosters`).
- **Contextos:** PascalCase con sufijo `Context` (`AuthContext`, `PvpContext`).
- **CSS Modules:** mismo nombre que el componente (`HomePage.module.css`).

## Testing (TDD)

1. **Escribir el test primero.** Describir el comportamiento esperado.
2. **Verificar que falla** (rojo).
3. **Implementar el código mínimo** para que pase (verde).
4. **Refactorizar** manteniendo tests verdes.

```typescript
// Ejemplo de test descriptivo
it("should kill rooster when both hunger and thirst exceed threshold", () => {
  const rooster = createRooster({ hunger: 5, thirst: 5 });
  const result = computeHealth(rooster);
  expect(result).toBeLessThanOrEqual(0);
});
```

### Estructura de tests

- Tests unitarios junto al archivo que testean: `care.ts` → `care.test.ts`
- Tests de integración en carpeta `__tests__/` o `tests/`
- Tests E2E en `apps/web/e2e/` (Playwright)

## Estructura de PR

El body del PR debe incluir:

```markdown
## Qué cambia
Descripción breve.

## Por qué
Contexto de la decisión.

## Cómo probarlo
Pasos para verificar el cambio.

## Capturas (si aplica)
Screenshots o GIFs.

## Checklist
- [ ] Tests pasan
- [ ] Lint pasa
- [ ] Typecheck pasa
- [ ] No hay console.log
```

## Idiomas

- **Código:** Inglés (variables, funciones, tipos, comentarios)
- **Conceptos de dominio:** Español (gallo, huevo, pluma, cuidado, vínculo)
- **Documentación:** Español
- **Commits:** Inglés o español, consistente dentro del mismo commit
