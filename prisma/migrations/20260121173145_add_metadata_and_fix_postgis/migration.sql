-- 1. Habilitar PostGIS (Vital para la Shadow DB)
CREATE EXTENSION IF NOT EXISTS postgis;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "metadata" JSONB;

-- 2. Agregar la columna metadata (Generado por Prisma para Fase 1H Extra)
ALTER TABLE "Transaction" ADD COLUMN     "metadata" JSONB;

-- 3. Restaurar/Asegurar columna Location (Para PostGIS)
-- Usamos "IF NOT EXISTS" para que no falle en tu DB actual que ya la tiene
ALTER TABLE "parkings" ADD COLUMN IF NOT EXISTS "location" geometry(Point, 4326);

-- 4. Crear el índice espacial (Solo si no existe)
CREATE INDEX IF NOT EXISTS "parking_location_idx" ON "parkings" USING GIST ("location");
