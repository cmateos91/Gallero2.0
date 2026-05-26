-- CreateEnum
CREATE TYPE "RoosterStage" AS ENUM ('HUEVO', 'POLLO', 'ADULTO');

-- CreateEnum
CREATE TYPE "RoosterNature" AS ENUM ('AGRESIVO', 'DEFENSIVO', 'VELOZ', 'ROBUSTO', 'EQUILIBRADO');

-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FightResult" AS ENUM ('CHALLENGER_WIN', 'DEFENDER_WIN', 'DRAW');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('FIGHT', 'WEEKLY_RANKING', 'STREAK', 'TOWER');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('FOOD', 'WATER', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "CosmeticSlot" AS ENUM ('CRESTA', 'ALAS', 'BARBA', 'CUERPO', 'COLA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "mmr" INTEGER NOT NULL DEFAULT 1000,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "towerHighFloor" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" TEXT,
    "lastInventoryRefillAt" TIMESTAMP(3),
    "fenceScreen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rooster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "RoosterStage" NOT NULL,
    "nature" "RoosterNature",
    "quality" TEXT NOT NULL DEFAULT 'Común',
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "resistance" INTEGER NOT NULL,
    "careCurrent" INTEGER NOT NULL DEFAULT 50,
    "bondPoints" INTEGER NOT NULL DEFAULT 0,
    "hunger" INTEGER NOT NULL DEFAULT 100,
    "thirst" INTEGER NOT NULL DEFAULT 100,
    "growthProgress" INTEGER NOT NULL DEFAULT 0,
    "eggStatRanges" JSONB,
    "hatchReadyAt" TIMESTAMP(3),
    "customColors" JSONB,
    "paintLayers" JSONB,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "homeScreen" TEXT,
    "isAtHome" BOOLEAN NOT NULL DEFAULT false,
    "onFence" BOOLEAN NOT NULL DEFAULT false,
    "diedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rooster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "challengerUserId" TEXT NOT NULL,
    "defenderUserId" TEXT NOT NULL,
    "challengerRoosterId" TEXT NOT NULL,
    "defenderRoosterId" TEXT NOT NULL,
    "snapshotChallenger" JSONB NOT NULL,
    "snapshotDefender" JSONB NOT NULL,
    "seed" TEXT NOT NULL,
    "turnLog" JSONB,
    "result" "FightResult",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatherCollectible" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xPct" DOUBLE PRECISION NOT NULL,
    "yPct" DOUBLE PRECISION NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "rotationDeg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "screen" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3),

    CONSTRAINT "FeatherCollectible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fightId" TEXT,
    "type" "RewardType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "turns" INTEGER NOT NULL,
    "effectValue" INTEGER NOT NULL,

    CONSTRAINT "CombatItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCombatItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserCombatItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "itemKey" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacedAccessory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "screen" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PlacedAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMissionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "fightsWon" INTEGER NOT NULL DEFAULT 0,
    "feedings" INTEGER NOT NULL DEFAULT 0,
    "trainings" INTEGER NOT NULL DEFAULT 0,
    "claimed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CosmeticItem" (
    "id" TEXT NOT NULL,
    "slot" "CosmeticSlot" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'Común',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CosmeticItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCosmetic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cosmeticItemId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquippedCosmetic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roosterId" TEXT NOT NULL,
    "cosmeticItemId" TEXT NOT NULL,
    "slot" "CosmeticSlot" NOT NULL,

    CONSTRAINT "EquippedCosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId_friendId_key" ON "Friendship"("userId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardTransaction_fightId_key" ON "RewardTransaction"("fightId");

-- CreateIndex
CREATE UNIQUE INDEX "CombatItem_type_key" ON "CombatItem"("type");

-- CreateIndex
CREATE UNIQUE INDEX "UserCombatItem_userId_itemId_key" ON "UserCombatItem"("userId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventory_userId_itemType_itemKey_key" ON "UserInventory"("userId", "itemType", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMissionProgress_userId_date_key" ON "DailyMissionProgress"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserCosmetic_userId_cosmeticItemId_key" ON "UserCosmetic"("userId", "cosmeticItemId");

-- CreateIndex
CREATE UNIQUE INDEX "EquippedCosmetic_roosterId_slot_key" ON "EquippedCosmetic"("roosterId", "slot");

-- AddForeignKey
ALTER TABLE "Rooster" ADD CONSTRAINT "Rooster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_challengerUserId_fkey" FOREIGN KEY ("challengerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_defenderUserId_fkey" FOREIGN KEY ("defenderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_challengerRoosterId_fkey" FOREIGN KEY ("challengerRoosterId") REFERENCES "Rooster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_defenderRoosterId_fkey" FOREIGN KEY ("defenderRoosterId") REFERENCES "Rooster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatherCollectible" ADD CONSTRAINT "FeatherCollectible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardTransaction" ADD CONSTRAINT "RewardTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardTransaction" ADD CONSTRAINT "RewardTransaction_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCombatItem" ADD CONSTRAINT "UserCombatItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCombatItem" ADD CONSTRAINT "UserCombatItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CombatItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventory" ADD CONSTRAINT "UserInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacedAccessory" ADD CONSTRAINT "PlacedAccessory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMissionProgress" ADD CONSTRAINT "DailyMissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_cosmeticItemId_fkey" FOREIGN KEY ("cosmeticItemId") REFERENCES "CosmeticItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_roosterId_fkey" FOREIGN KEY ("roosterId") REFERENCES "Rooster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_cosmeticItemId_fkey" FOREIGN KEY ("cosmeticItemId") REFERENCES "CosmeticItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
