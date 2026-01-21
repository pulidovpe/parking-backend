-- 1. Habilitar PostGIS (Siempre es bueno asegurarlo)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. CORRECCIÓN: Borrar metadata de Reservation si se creó por error
-- Usamos DO $$ ... BEGIN ... END $$ para que no falle si la columna no existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'metadata') THEN
        ALTER TABLE "reservations" DROP COLUMN "metadata";
    END IF;
END $$;

-- 3. AGREGAR: Metadata a Transaction (Lo que realmente queremos)
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- 4. POSTGIS: Asegurar columna Location en Parking
-- Prisma podría intentar borrarla, así que la re-declaramos explícitamente
ALTER TABLE "parkings" ADD COLUMN IF NOT EXISTS "location" geometry(Point, 4326);

-- 5. Crear el índice espacial
CREATE INDEX IF NOT EXISTS "parking_location_idx" ON "parkings" USING GIST ("location");