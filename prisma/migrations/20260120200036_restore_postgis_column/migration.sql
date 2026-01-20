-- AlterTable
ALTER TABLE "Parking" ADD COLUMN "location" geometry(Point, 4326);

-- CreateIndex (AGREGAR MANUALMENTE SI NO ESTÁ)
CREATE INDEX "parking_location_idx" ON "Parking" USING GIST ("location");