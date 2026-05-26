import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";
import {
  generateTowerNpc,
  aiPickMoveTower,
  computeTowerFloorCoins,
  initCombatState,
  resolveTurn,
  createSeededRng,
} from "@gallos/game-engine";
import type { CombatState, CombatMove, Fighter, TurnResult, TowerNpc, RoosterNature } from "@gallos/game-engine";
import { computeCareMultiplier, computeBondMultiplier } from "../roosters/roosters.lifecycle.js";
import { REDIS_KEYS, TTL } from "../../constants.js";
import type { TowerRunState } from "./tower.schemas.js";

type FloorCombatState = {
  combatId:    string;
  state:       CombatState;
  playerFighter: Fighter;
  npcFighter:  Fighter;
  npcNature:   RoosterNature;
  floor:       number;
  seed:        number;
  turn:        number;
  npcLastMoves: CombatMove[];
};

export async function startTowerRun(
  prisma: PrismaClient,
  redis: Redis,
  userId: string,
  roosterId: string,
): Promise<TowerRunState> {
  const rooster = await prisma.rooster.findFirstOrThrow({
    where: { id: roosterId, userId, stage: "ADULTO", diedAt: null },
  });

  const playerFighter: Fighter = {
    attack:         rooster.attack,
    defense:        rooster.defense,
    speed:          rooster.speed,
    resistance:     rooster.resistance,
    careMultiplier: computeCareMultiplier(rooster.careCurrent),
    bondMultiplier: computeBondMultiplier(rooster.bondPoints),
  };

  const runId   = randomUUID();
  const runSeed = Math.floor(Math.random() * 2 ** 31);
  const runState: TowerRunState = {
    runId,
    userId,
    roosterId,
    currentFloor: 1,
    runSeed,
    activeCombatId: undefined,
    coinsEarned: 0,
    playerHp: playerFighter.resistance * 3,
    abandoned: false,
  };

  await redis.setex(REDIS_KEYS.towerRun(runId), TTL.TOWER_RUN_S, JSON.stringify(runState));
  return runState;
}

export async function getTowerRun(redis: Redis, runId: string): Promise<TowerRunState | null> {
  const raw = await redis.get(REDIS_KEYS.towerRun(runId));
  if (!raw) return null;
  return JSON.parse(raw) as TowerRunState;
}

export async function startFloorCombat(
  prisma: PrismaClient,
  redis: Redis,
  userId: string,
  runId: string,
): Promise<{ combatId: string; npc: ReturnType<typeof generateTowerNpc>; initialState: CombatState }> {
  const runRaw = await redis.get(REDIS_KEYS.towerRun(runId));
  if (!runRaw) throw Object.assign(new Error("Run no encontrado"), { status: 404 });
  const run: TowerRunState = JSON.parse(runRaw) as TowerRunState;
  if (run.userId !== userId) throw Object.assign(new Error("No autorizado"), { status: 403 });
  if (run.activeCombatId) throw Object.assign(new Error("Ya hay un combate activo en este piso"), { status: 400 });

  const rooster = await prisma.rooster.findFirstOrThrow({ where: { id: run.roosterId } });
  const playerFighter: Fighter = {
    attack:         rooster.attack,
    defense:        rooster.defense,
    speed:          rooster.speed,
    resistance:     rooster.resistance,
    careMultiplier: computeCareMultiplier(rooster.careCurrent),
    bondMultiplier: computeBondMultiplier(rooster.bondPoints),
  };

  const npc = generateTowerNpc(run.currentFloor, run.runSeed);
  const npcFighter: Fighter = {
    attack:         npc.attack,
    defense:        npc.defense,
    speed:          npc.speed,
    resistance:     npc.resistance,
    careMultiplier: 1,
    bondMultiplier: 1,
  };

  const combatId = randomUUID();
  const initialState = initCombatState(playerFighter, npcFighter);
  // Override player HP from persisted run state (survives across floors)
  const stateWithHp: CombatState = {
    ...initialState,
    fighterA: { ...initialState.fighterA, hp: run.playerHp },
  };

  const floorCombat: FloorCombatState = {
    combatId,
    state:        stateWithHp,
    playerFighter,
    npcFighter,
    npcNature:    npc.nature,
    floor:        run.currentFloor,
    seed:         run.runSeed + run.currentFloor * 1000,
    turn:         0,
    npcLastMoves: [],
  };

  run.activeCombatId = combatId;
  await Promise.all([
    redis.setex(REDIS_KEYS.towerRun(runId), TTL.TOWER_RUN_S, JSON.stringify(run)),
    redis.setex(`tower:combat:${combatId}`, TTL.TOWER_RUN_S, JSON.stringify({ ...floorCombat, runId })),
  ]);

  return { combatId, npc, initialState: stateWithHp };
}

export async function submitFloorTurn(
  redis: Redis,
  runId: string,
  combatId: string,
  userId: string,
  playerMove: CombatMove,
): Promise<{ turnResult: TurnResult; state: CombatState; over: boolean; playerWon?: boolean }> {
  const raw = await redis.get(`tower:combat:${combatId}`);
  if (!raw) throw Object.assign(new Error("Combate de torre no encontrado"), { status: 404 });
  const fc = JSON.parse(raw) as FloorCombatState & { runId: string };
  if (fc.runId !== runId) throw Object.assign(new Error("No autorizado"), { status: 403 });

  const npcMove = aiPickMoveTower(fc.floor, fc.npcLastMoves, fc.npcNature, createSeededRng(fc.seed + fc.turn), fc.state);
  fc.npcLastMoves = [...fc.npcLastMoves.slice(-2), npcMove];

  const rng = createSeededRng(fc.seed + fc.turn + 9999);
  const { state: newState, turnResult } = resolveTurn(
    fc.state, fc.playerFighter, fc.npcFighter, playerMove, npcMove, rng,
  );

  fc.state = newState;
  fc.turn += 1;

  if (newState.isOver) {
    const playerWon = newState.winner === 0;
    await redis.del(`tower:combat:${combatId}`);
    return { turnResult, state: newState, over: true, playerWon };
  }

  await redis.setex(`tower:combat:${combatId}`, TTL.TOWER_RUN_S, JSON.stringify(fc));
  return { turnResult, state: newState, over: false };
}

export async function advanceFloor(
  redis: Redis,
  userId: string,
  runId: string,
  playerHpAfterFloor: number,
): Promise<TowerRunState> {
  const raw = await redis.get(REDIS_KEYS.towerRun(runId));
  if (!raw) throw Object.assign(new Error("Run no encontrado"), { status: 404 });
  const run: TowerRunState = JSON.parse(raw) as TowerRunState;
  if (run.userId !== userId) throw Object.assign(new Error("No autorizado"), { status: 403 });

  const floorCoins = computeTowerFloorCoins(run.currentFloor);
  run.coinsEarned    += floorCoins;
  run.currentFloor   += 1;
  run.activeCombatId  = undefined;
  run.playerHp        = Math.max(1, playerHpAfterFloor);

  await redis.setex(REDIS_KEYS.towerRun(runId), TTL.TOWER_RUN_S, JSON.stringify(run));
  return run;
}

export async function abandonRun(
  prisma: PrismaClient,
  redis: Redis,
  userId: string,
  runId: string,
): Promise<{ coinsEarned: number; floorReached: number }> {
  const raw = await redis.get(REDIS_KEYS.towerRun(runId));
  if (!raw) throw Object.assign(new Error("Run no encontrado"), { status: 404 });
  const run: TowerRunState = JSON.parse(raw) as TowerRunState;
  if (run.userId !== userId) throw Object.assign(new Error("No autorizado"), { status: 403 });

  const floorsCompleted = run.currentFloor - 1;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { towerHighFloor: true } });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: run.coinsEarned },
        towerHighFloor: Math.max(user.towerHighFloor, floorsCompleted),
      },
    }),
    ...(run.coinsEarned > 0 ? [prisma.rewardTransaction.create({
      data: { userId, type: "TOWER", amount: run.coinsEarned },
    })] : []),
  ]);

  await redis.del(REDIS_KEYS.towerRun(runId));

  return { coinsEarned: run.coinsEarned, floorReached: floorsCompleted };
}
