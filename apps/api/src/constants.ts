export const CPU_BOT_ID = "00000000-0000-4000-8000-000000000001";

export const REDIS_KEYS = {
  combat:           (id: string) => `combat:${id}`,
  towerRun:         (id: string) => `tower:run:${id}`,
  pvpRoom:          (id: string) => `pvp:room:${id}`,
  pvpChallenge:     (id: string) => `pvp:challenge:${id}`,
  pvpQueue:         "pvp:queue",
  sessionBlacklist: (sid: string) => `session:blacklist:${sid}`,
  wsUser:           (uid: string) => `ws:${uid}`,
  rankingCache:     "ranking:top50",
} as const;

export const TTL = {
  COMBAT_S:            7200,
  TOWER_RUN_S:         7200,
  PVP_ROOM_S:          7200,
  PVP_CHALLENGE_S:     60,
  SESSION_BLACKLIST_S: 2592000,
  RANKING_CACHE_S:     30,
} as const;
