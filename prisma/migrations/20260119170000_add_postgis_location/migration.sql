-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location column to parkings table
ALTER TABLE parkings ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);

-- Create spatial index for fast geospatial queries
CREATE INDEX IF NOT EXISTS parkings_location_idx ON parkings USING GIST (location);