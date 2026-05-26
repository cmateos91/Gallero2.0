export type TowerRunState = {
  runId:          string;
  userId:         string;
  roosterId:      string;
  currentFloor:   number;
  runSeed:        number;
  activeCombatId?: string;
  coinsEarned:    number;
  playerHp:       number;
  abandoned:      boolean;
};
