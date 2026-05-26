# ADR-004: Tabla genérica UserInventory en lugar de columnas en User

**Fecha:** 2026-05-26
**Estado:** Accepted

## Contexto

El spec original (v1) modelaba el inventario de comida y agua como columnas directas en la tabla `User`:

```prisma
model User {
  granoCount Int
  maizCount  Int
  // ... 8 tipos más de comida
  aguaCount  Int
}
```

Esto presenta varios problemas:
- Añadir un nuevo tipo de comida requiere migración de schema.
- Consultar "cuánta comida total tiene el usuario" requiere sumar 10 columnas.
- No escala a otros tipos de items (accesorios de valla ya tienen su propia tabla `PlacedAccessory`).
- Es una denormalización prematura.

## Decisión

**Tabla genérica `UserInventory` con clave compuesta `[userId, itemType, itemKey]`:**

```prisma
model UserInventory {
  id       String  @id @default(uuid())
  userId   String
  itemType InventoryItemType  // FOOD | WATER | ACCESSORY
  itemKey  String             // "grano", "maiz", "agua", etc.
  quantity Int
    
  user User @relation(...)
  
  @@unique([userId, itemType, itemKey])
}
```

- Los 11 contadores del modelo `User` se eliminan.
- `UserCombatItem` se mantiene separado porque los items de combate tienen semántica distinta (precio, efecto, duración).
- `PlacedAccessory` se mantiene separado porque tiene posición en pantalla.

## Alternativas consideradas

1. **Columnas en User (v1):** Simple pero inflexible. Descarte.
2. **Una tabla por tipo de item:** `UserFood`, `UserWater`, `UserAccessory`. Demasiadas tablas para un concepto similar. Descarte.
3. **JSON column en User:** `inventory Json`. No hay integridad referencial ni queries eficientes. Descarte.

## Consecuencias

- **Positivo:** Añadir items sin migración. Queries agregadas simples (`SUM(quantity) WHERE userId = X`). Extensible a cualquier tipo futuro.
- **Negativo:** Un JOIN extra en queries que necesitan inventario + usuario. La clave `itemKey` es un string sin FK a tabla maestra.
- **Mitigación:** El JOIN es sobre índice único compuesto. El `itemKey` se valida en capa de servicio con constantes del game engine.
