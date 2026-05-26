-- CreateIndex: User MMR ranking
CREATE INDEX "User_mmr_idx" ON "User"("mmr" DESC);

-- CreateIndex: Rooster por usuario
CREATE INDEX "Rooster_userId_createdAt_idx" ON "Rooster"("userId", "createdAt" DESC);
CREATE INDEX "Rooster_userId_stage_idx" ON "Rooster"("userId", "stage");

-- CreateIndex: Fight historial por usuario
CREATE INDEX "Fight_challengerUserId_createdAt_idx" ON "Fight"("challengerUserId", "createdAt" DESC);
CREATE INDEX "Fight_defenderUserId_createdAt_idx" ON "Fight"("defenderUserId", "createdAt" DESC);

-- CreateIndex: Session cleanup
CREATE INDEX "Session_expiresAt_revokedAt_idx" ON "Session"("expiresAt", "revokedAt");

-- CreateIndex: Friendship por friendId (relación inversa)
CREATE INDEX "Friendship_friendId_idx" ON "Friendship"("friendId");

-- CreateIndex: DailyMissionProgress por fecha
CREATE INDEX "DailyMissionProgress_date_idx" ON "DailyMissionProgress"("date");

-- CreateUniqueConstraint: CosmeticItem slot + name
CREATE UNIQUE INDEX "CosmeticItem_slot_name_key" ON "CosmeticItem"("slot", "name");
