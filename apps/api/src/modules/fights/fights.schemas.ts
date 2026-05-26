import { z } from "zod";

export const CombatMoveSchema = z.enum(["atacar", "defender", "esquivar", "huir", "usar_objeto"]);

export const StartSoloCombatSchema = z.object({
  challengerRoosterId: z.string().uuid(),
  defenderUserId:      z.string().uuid(),
  defenderRoosterId:   z.string().uuid(),
});

export const SubmitTurnSchema = z.object({
  move: CombatMoveSchema,
});
