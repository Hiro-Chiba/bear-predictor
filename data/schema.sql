-- Neon (PostgreSQL) スキーマ定義
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS bear_reports (
    id SERIAL PRIMARY KEY,
    datetime TIMESTAMPTZ NOT NULL,
    latitude NUMERIC(8, 5) NOT NULL,
    longitude NUMERIC(8, 5) NOT NULL,
    species VARCHAR(120) NOT NULL,
    risk_level VARCHAR(8) NOT NULL CHECK (risk_level IN ('低', '中', '高')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bear_reports_datetime ON bear_reports (datetime DESC);
CREATE INDEX IF NOT EXISTS idx_bear_reports_location ON bear_reports USING GIST (ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326));

CREATE TABLE IF NOT EXISTS weather_observations (
    id SERIAL PRIMARY KEY,
    observed_at TIMESTAMPTZ NOT NULL,
    latitude NUMERIC(8, 5) NOT NULL,
    longitude NUMERIC(8, 5) NOT NULL,
    temperature NUMERIC(5, 2),
    precipitation NUMERIC(5, 2),
    snow_depth NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_observations_observed_at ON weather_observations (observed_at DESC);

CREATE TABLE IF NOT EXISTS terrain_features (
    id SERIAL PRIMARY KEY,
    latitude NUMERIC(8, 5) NOT NULL,
    longitude NUMERIC(8, 5) NOT NULL,
    elevation NUMERIC(6, 2),
    slope_angle NUMERIC(5, 2),
    distance_to_settlement NUMERIC(6, 2),
    fruit_availability NUMERIC(4, 2)
);

CREATE INDEX IF NOT EXISTS idx_terrain_features_location ON terrain_features USING GIST (ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326));
