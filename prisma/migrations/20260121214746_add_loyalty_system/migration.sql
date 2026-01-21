-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "PointSource" AS ENUM ('RESERVATION_COMPLETED', 'REGISTRATION_BONUS', 'MANUAL_ADJUSTMENT', 'REDEMPTION');

-- CreateTable
CREATE TABLE "LoyaltyProfile" (
    "id" TEXT NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyLog" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" "PointSource" NOT NULL,
    "description" TEXT,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProfile_userId_key" ON "LoyaltyProfile"("userId");

-- AddForeignKey
ALTER TABLE "LoyaltyProfile" ADD CONSTRAINT "LoyaltyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyLog" ADD CONSTRAINT "LoyaltyLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LoyaltyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
