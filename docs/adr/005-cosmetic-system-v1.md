# ADR-005: Sistema de cosméticos diseñado desde Fase 0

**Fecha:** 2026-05-26
**Estado:** Accepted

## Contexto

El spec original (v1) marcaba el sistema de personalización de gallos (ropa/skins) como "PENDIENTE" para Fase 6. Esto es problemático porque:

1. La personalización cosmética es el vector principal de monetización no pay-to-win.
2. Si el schema no lo contempla desde el inicio, añadirlo después requiere migraciones complejas con datos existentes.
3. Sin un diseño claro de monetización, la economía del juego (monedas) carece de un sink importante.

## Decisión

**Diseñar el schema de cosméticos ahora (Fase 0-2), implementar la UI en Fase 5-6.**

Modelos:
- `CosmeticItem`: Catálogo de items cosméticos (plantilla). Campos: slot (cresta, alas, barba, cuerpo, cola), nombre, descripción, precio, rareza.
- `UserCosmetic`: Propiedad de un cosmético por un usuario. Campos: userId, cosmeticItemId, fecha de adquisición.
- `EquippedCosmetic`: Un cosmético equipado en un gallo específico. Restricción: un gallo solo puede tener un cosmético por slot.

Slots definidos:
- `CRESTA`: Peinados, coronas, sombreros para la cresta.
- `ALAS`: Patrones, colores, adornos para las alas.
- `BARBA`: Estilos de barba/bigote.
- `CUERPO`: Patrones de plumaje, colores base alternativos.
- `COLA`: Estilos de cola, plumas decorativas.

## Alternativas consideradas

1. **Dejarlo para Fase 6 (v1):** Riesgo de migración dolorosa cuando ya hay usuarios. Descarte.
2. **Sistema de capas de pintura (ya existe `paintLayers`):** Las capas de pintura son personalización libre (SVG). Los cosméticos son items adquiribles. Son complementarios, no excluyentes.
3. **Cosméticos como items genéricos en UserInventory:** Pierde la semántica de equipamiento (slot, restricción un-por-slot). Descarte.

## Consecuencias

- **Positivo:** Schema listo para monetización desde el día 1. Migraciones suaves. Economía balanceada desde el inicio (los cosméticos son un sink de monedas).
- **Negativo:** 3 tablas extra en el schema inicial que no se usarán hasta Fase 5-6.
- **Mitigación:** Las tablas son ligeras. Prisma las genera pero no afectan rendimiento hasta que tengan datos. Los endpoints de API se implementan en Fase 3 (CRUD básico) pero la UI completa espera a Fase 5.
