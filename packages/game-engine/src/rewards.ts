export function computeFightReward(result: "win" | "draw" | "loss"): number {
  if (result === "win") return 30;
  if (result === "draw") return 15;
  return 10;
}
