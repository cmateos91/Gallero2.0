export type MmrResult = "win" | "draw" | "loss";

export const MMR_K = 24;

export function computeMmrDelta(
  playerMmr: number,
  rivalMmr: number,
  result: MmrResult,
): number {
  const expected = 1 / (1 + Math.pow(10, (rivalMmr - playerMmr) / 400));
  const actual = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  return Math.round(MMR_K * (actual - expected));
}
