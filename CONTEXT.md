# CONTEXT.md — Domain Language

> **Lenguaje de dominio para Gallero.** Definiciones canónicas de todos los conceptos del juego.
> **Idioma:** Español para conceptos de dominio, inglés para términos técnicos.
> **Uso:** Cualquier IA que trabaje en este proyecto debe usar estos términos consistentemente.

## Conceptos principales

### Gallo (Rooster)
La unidad central del juego. Un gallo pasa por 3 etapas: huevo, pollo, adulto. Tiene stats (ataque, defensa, velocidad, resistencia), una naturaleza, y necesidades (hambre, sed).

### Huevo (Egg)
Primera etapa de vida. Tiene calidad (Común/Normal/Raro/Legendario), rangos de stats pre-rolados, y un timer de eclosión. Recibe cuidado para mejorar stats al nacer.

### Pollo (Chick)
Segunda etapa. Crece pasivamente si está bien alimentado e hidratado. No puede combatir.

### Adulto (Adult)
Tercera etapa. Puede combatir, entrenar, y fusionarse con otro adulto.

### Calidad (Quality)
Rareza del gallo: `"Común"` | `"Normal"` | `"Raro"` | `"Legendario"`. Determina stats base y tiempo de eclosión.

### Naturaleza (Nature)
Personalidad del gallo que sesga sus stats al entrenar: `"AGRESIVO"` (+ATK), `"DEFENSIVO"` (+DEF), `"VELOZ"` (+SPD), `"ROBUSTO"` (+RES), `"EQUILIBRADO"` (balanceado).

## Stats y combate

### Stats base
- **Ataque (attack):** Determina el daño infligido en combate.
- **Defensa (defense):** Reduce el daño recibido. Se duplica al usar el movimiento "defender".
- **Velocidad (speed):** Determina probabilidad de esquivar y prioridad en empates.
- **Resistencia (resistance):** Determina HP máximo = resistance * 3.

### Movimientos de combate
- **Atacar:** Inflige daño. Cuesta 30 de energía.
- **Defender:** Reduce daño a la mitad, recupera 25 de energía. Posibilidad de contraataque.
- **Esquivar:** Probabilidad de evitar daño basado en velocidad. Cuesta 10 de energía.
- **Huir:** Escapar del combate (resulta en derrota).
- **Usar objeto:** Consumir un ítem del inventario de combate.

### Energía
Recurso táctico en combate. Máximo 100, empieza en 50. Se gasta al atacar/esquivar, se recupera al defender.

## Cuidado y necesidades

### Care (Cuidado)
Valor 0-100 que decae con el tiempo. Multiplica stats efectivos en combate (rango 0.70-1.10). Se incrementa acariciando al gallo.

### Bond (Vínculo)
Puntos acumulados al cuidar al gallo. Otorga multiplicador pequeño a stats en combate (max 1.03).

### Hambre (Hunger)
Necesidad que decae 4 puntos/hora. Se restaura alimentando (20 puntos por comida).

### Sed (Thirst)
Necesidad que decae 8 puntos/hora (el doble que el hambre). Se restaura dando agua (25 puntos).

### Salud (Health)
Derivada de hambre y sed. Si ambas caen por debajo de 50 simultáneamente, el gallo muere.

### Dual-need
Sistema que hace que la muerte solo ocurra si AMBAS necesidades están descuidadas. Un gallo sin comida pero con agua NO muere, y viceversa.

## Economía

### Monedas (Coins)
Moneda del juego. Se ganan combatiendo, recogiendo plumas, vendiendo gallos, completando misiones. Se gastan en huevos, comida, agua, objetos de combate y cosméticos.

### Plumas (Feathers)
Drops que aparecen en la granja. Recogerlas da +1 moneda. Máximo 40/día.

### MMR (Matchmaking Rating)
Sistema ELO para ranking. K=24. Sube al ganar, baja al perder. Determina emparejamientos.

### Torre (Tower)
Modo PvE de pisos consecutivos. Cada piso tiene un NPC gallo generado proceduralmente. Bosses cada 5 pisos.

### Misión diaria (Daily Mission)
3 misiones que se resetean cada día: ganar 2 combates, alimentar 3 veces, entrenar 1 vez.

### Racha (Streak)
Días consecutivos completando misiones. Otorga bonus de monedas incremental.

## Relaciones

- Un **User** tiene muchos **Roosters**
- Un **Rooster** pertenece a un **User**
- Un **Fight** involucra dos **Users** y dos **Roosters** (challenger y defender)
- Un **Rooster** puede equipar **Cosmetics** por slot (cresta, alas, barba, cuerpo, cola)
- Un **User** tiene **UserInventory** (comida, agua, accesorios)
- Un **User** tiene **Friends** (relación bidireccional)

## Términos técnicos (inglés)

| Español | Inglés (código) |
|---------|----------------|
| Gallo | Rooster |
| Huevo | Egg |
| Pollo | Chick |
| Pelea / Combate | Fight |
| Cuidado | Care |
| Vínculo | Bond |
| Naturaleza | Nature |
| Pluma | Feather |
| Valla | Fence |
| Gallinero | Coop / Roost |
| Matadero | Sell / Butcher |
| Torre | Tower |
| Rachas | Streaks |
