-- Initial schema for feetflow
-- Run manually: psql -h localhost -U your_user -d your_db -f 001_initial_schema.sql

CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_samples_is_active ON samples (is_active);
