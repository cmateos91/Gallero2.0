import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";
import {
  initCombatState,
  resolveTurn,
  computeMmrDelta,
  computeFightReward,
  createSeededRng,
} from "@gallos/game-engine";
import type { CombatState, CombatMove, Fighter, TurnResult } from "@gallos/game-engine";
import { computeCareMultiplier, computeBondMultiplier } from "../roosters/roosters.lifecycle.js";
import { REDIS_KEYS, TTL } from "../../constants.js";
import { detectSelfFight, checkSameFoeLimit } from "../antiAbuse/antiAbuse.service.js";

type CombatRedisState = {
  fightId:   string;
  state:     CombatState;
  fighterA:  Fighter;
  fighterB:  Fighter;
  seed:      number;
  turn:      number;
  moveA?:    CombatMove;
  moveB?:    CombatMove;
  userIdA:   string;
  userIdB:   string;
};

function buildFighter(rooster: {
  attack: number; defense: number; speed: number; resistance: number;
  careCurrent: number; bondPoints: number;
}): Fighter {
  return {
    attack:         rooster.attack,
    defense:        rooster.defense,
    speed:          rooster.speed,
    resistance:     rooster.resistance,
    careMultiplier: computeCareMultiplier(rooster.careCurrent),
    bondMultiplier: computeBondMultiplier(rooster.bondPoints),
  };
}

export async function startSoloCombat(
  prisma: PrismaClient,
  redis: Redis,
  challengerUserId: string,
  challengerRoosterId: string,
  defenderUserId: string,
  defenderRoosterId: string,
): Promise<{ fightId: string; combatId: string; initialState: CombatState }> {
  detectSelfFight(challengerUserId, defenderUserId);
  await checkSameFoeLimit(prisma, challengerUserId, defenderUserId);

  const [rA, rB] = await Promise.all([
    prisma.rooster.findFirstOrThrow({
      where: { id: challengerRoosterId, userId: challengerUserId, stage: "ADULTO", diedAt: null },
    }),
    prisma.rooster.findFirstOrThrow({
      where: { id: defenderRoosterId, diedAt: null },
    }),
  ]);

  const fighterA = buildFighter(rA);
  const fighterB = buildFighter(rB);
  const seed = Math.floor(Math.random() * 2 ** 31);
  const initialState = initCombatState(fighterA, fighterB);

  const fightId  = randomUUID();
  const combatId = randomUUID();

  const redisState: CombatRedisState = {
    fightId,
    state:   initialState,
    fighterA,
    fighterB,
    seed,
    turn:    0,
    userIdA: challengerUserId,
    userIdB: defenderUserId,
  };

  await redis.setex(REDIS_KEYS.combat(combatId), TTL.COMBAT_S, JSON.stringify(redisState));

  await prisma.fight.create({
    data: {
      id:                  fightId,
      challengerUserId,
      defenderUserId,
      challengerRoosterId: rA.id,
      defenderRoosterId:   rB.id,
      snapshotChallenger:  fighterA as object,
      snapshotDefender:    fighterB as object,
      seed:                String(seed),
    },
  });

  return { fightId, combatId, initialState };
}

export async function submitTurn(
  prisma: PrismaClient,
  redis: Redis,
  combatId: string,
  userId: string,
  move: CombatMove,
): Promise<{ turnResult?: TurnResult; state: CombatState; over: boolean; waiting?: boolean; mmrDeltaA?: number; mmrDeltaB?: number }> {
  const raw = await redis.get(REDIS_KEYS.combat(combatId));
  if (!raw) throw Object.assign(new Error("Combate no encontrado o expirado"), { status: 404 });

  const cs: CombatRedisState = JSON.parse(raw) as CombatRedisState;
  const isA = cs.userIdA === userId;
  const isB = cs.userIdB === userId;
  if (!isA && !isB) throw Object.assign(new Error("No eres parte de este combate"), { status: 403 });

  if (isA) cs.moveA = move;
  else cs.moveB = move;

  if (!cs.moveA || !cs.moveB) {
    await redis.setex(REDIS_KEYS.combat(combatId), TTL.COMBAT_S, JSON.stringify(cs));
    return { state: cs.state, over: false, waiting: true };
  }

  const rng = createSeededRng(cs.seed + cs.turn);
  const { state: newState, turnResult } = resolveTurn(
    cs.state, cs.fighterA, cs.fighterB, cs.moveA, cs.moveB, rng,
  );

  cs.state = newState;
  cs.turn  += 1;
  cs.moveA  = undefined;
  cs.moveB  = undefined;

  if (newState.isOver) {
    const { deltaA, deltaB } = await endCombat(prisma, redis, combatId, cs);
    return { turnResult, state: newState, over: true, mmrDeltaA: deltaA, mmrDeltaB: deltaB };
  }

  await redis.setex(REDIS_KEYS.combat(combatId), TTL.COMBAT_S, JSON.stringify(cs));
  return { turnResult, state: newState, over: false };
}

async function endCombat(
  prisma: PrismaClient,
  redis: Redis,
  combatId: string,
  cs: CombatRedisState,
): Promise<{ deltaA: number; deltaB: number }> {
  // winner: 0 = fighterA (challenger), 1 = fighterB (defender), null = draw
  const result =
    cs.state.winner === 0 ? "CHALLENGER_WIN" :
    cs.state.winner === 1 ? "DEFENDER_WIN"   : "DRAW";

  const mmrResultA =
    result === "CHALLENGER_WIN" ? "win" : result === "DRAW" ? "draw" : "loss";
  const mmrResultB =
    result === "DEFENDER_WIN"   ? "win" : result === "DRAW" ? "draw" : "loss";

  const [userA, userB] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: cs.userIdA }, select: { mmr: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: cs.userIdB }, select: { mmr: true } }),
  ]);

  const deltaA  = computeMmrDelta(userA.mmr, userB.mmr, mmrResultA);
  const deltaB  = computeMmrDelta(userB.mmr, userA.mmr, mmrResultB);
  const rewardA = computeFightReward(mmrResultA);
  const rewardB = computeFightReward(mmrResultB);
  const today   = new Date().toISOString().slice(0, 10);

  await prisma.$transaction([
    prisma.fight.update({
      where: { id: cs.fightId },
      data: { result, turnLog: cs.state as object },
    }),
    prisma.user.update({
      where: { id: cs.userIdA },
      data: { mmr: { increment: deltaA }, coins: { increment: rewardA } },
    }),
    prisma.user.update({
      where: { id: cs.userIdB },
      data: { mmr: { increment: deltaB }, coins: { increment: rewardB } },
    }),
    prisma.rewardTransaction.create({
      data: { userId: cs.userIdA, fightId: cs.fightId, type: "FIGHT", amount: rewardA },
    }),
    prisma.rewardTransaction.create({
      data: { userId: cs.userIdB, type: "FIGHT", amount: rewardB },
    }),
    ...(mmrResultA === "win" ? [prisma.dailyMissionProgress.upsert({
      where:  { userId_date: { userId: cs.userIdA, date: today } },
      update: { fightsWon: { increment: 1 } },
      create: { userId: cs.userIdA, date: today, fightsWon: 1 },
    })] : []),
    ...(mmrResultB === "win" ? [prisma.dailyMissionProgress.upsert({
      where:  { userId_date: { userId: cs.userIdB, date: today } },
      update: { fightsWon: { increment: 1 } },
      create: { userId: cs.userIdB, date: today, fightsWon: 1 },
    })] : []),
  ]);

  await redis.del(REDIS_KEYS.combat(combatId));

  return { deltaA, deltaB };
}

export async function getFight(prisma: PrismaClient, fightId: string) {
  return prisma.fight.findUnique({ where: { id: fightId } });
}
