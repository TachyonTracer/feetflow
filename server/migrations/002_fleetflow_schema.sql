-- FleetFlow schema for feetflow (descriptive PKs, soft delete on users/vehicles/drivers/trips)
-- Run manually: psql -h <host> -U <user> -d <database> -f migrations/002_fleetflow_schema.sql

-- ENUM types (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
        CREATE TYPE vehicle_status AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
        CREATE TYPE driver_status AS ENUM ('on_duty', 'on_trip', 'off_duty', 'suspended');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
        CREATE TYPE trip_status AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('manager', 'dispatcher', 'safety_officer', 'financial_analyst');
    END IF;
END$$;

-- Tables (descriptive primary key column names; no hard DELETE – use soft delete only)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    max_capacity_kg NUMERIC(10,2) NOT NULL,
    odometer_km NUMERIC(12,2) NOT NULL DEFAULT 0,
    acquisition_cost NUMERIC(12,2) NOT NULL,
    status vehicle_status NOT NULL DEFAULT 'available',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
    driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_category VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    status driver_status NOT NULL DEFAULT 'on_duty',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(vehicle_id),
    driver_id UUID REFERENCES drivers(driver_id),
    cargo_weight_kg NUMERIC(10,2) NOT NULL,
    start_odometer NUMERIC(12,2),
    end_odometer NUMERIC(12,2),
    revenue NUMERIC(12,2),
    status trip_status NOT NULL DEFAULT 'draft',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
    maintenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id),
    description TEXT NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    service_date DATE NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fuel_logs (
    fuel_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id),
    trip_id UUID REFERENCES trips(trip_id),
    liters NUMERIC(10,2) NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    fuel_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_driver_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_trip_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_deleted ON vehicles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_drivers_is_deleted ON drivers(is_deleted);
CREATE INDEX IF NOT EXISTS idx_trips_is_deleted ON trips(is_deleted);
