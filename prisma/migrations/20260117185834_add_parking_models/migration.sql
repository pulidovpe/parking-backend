-- CreateEnum
CREATE TYPE "ParkingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SpaceStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE');

-- CreateTable
CREATE TABLE "parkings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "ParkingStatus" NOT NULL DEFAULT 'ACTIVE',
    "hourly_rate" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT,
    "has_multiple_levels" BOOLEAN NOT NULL DEFAULT false,
    "total_levels" INTEGER NOT NULL DEFAULT 1,
    "opening_time" TEXT,
    "closing_time" TEXT,
    "is_24_hours" BOOLEAN NOT NULL DEFAULT false,
    "manager_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parkings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_levels" (
    "id" TEXT NOT NULL,
    "parking_id" TEXT NOT NULL,
    "level_number" INTEGER NOT NULL,
    "level_name" TEXT NOT NULL,
    "total_spaces" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spaces" (
    "id" TEXT NOT NULL,
    "parking_id" TEXT NOT NULL,
    "level_id" TEXT,
    "space_number" TEXT NOT NULL,
    "status" "SpaceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_handicapped" BOOLEAN NOT NULL DEFAULT false,
    "is_electric" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parkings_manager_id_idx" ON "parkings"("manager_id");

-- CreateIndex
CREATE INDEX "parking_levels_parking_id_idx" ON "parking_levels"("parking_id");

-- CreateIndex
CREATE UNIQUE INDEX "parking_levels_parking_id_level_number_key" ON "parking_levels"("parking_id", "level_number");

-- CreateIndex
CREATE INDEX "parking_spaces_parking_id_idx" ON "parking_spaces"("parking_id");

-- CreateIndex
CREATE INDEX "parking_spaces_level_id_idx" ON "parking_spaces"("level_id");

-- CreateIndex
CREATE INDEX "parking_spaces_status_idx" ON "parking_spaces"("status");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spaces_parking_id_space_number_key" ON "parking_spaces"("parking_id", "space_number");

-- AddForeignKey
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_levels" ADD CONSTRAINT "parking_levels_parking_id_fkey" FOREIGN KEY ("parking_id") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spaces" ADD CONSTRAINT "parking_spaces_parking_id_fkey" FOREIGN KEY ("parking_id") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spaces" ADD CONSTRAINT "parking_spaces_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "parking_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
