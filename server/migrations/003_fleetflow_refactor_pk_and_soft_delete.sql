-- FleetFlow refactor: descriptive PK names, soft delete (users, trips), no hard deletes
-- Run after 002. For fresh installs use 002 (updated) which already has this structure.
-- Run manually: psql -h <host> -U <user> -d <database> -f migrations/003_fleetflow_refactor_pk_and_soft_delete.sql

-- 1) Drop foreign key constraints (PostgreSQL default names)
ALTER TABLE IF EXISTS trips DROP CONSTRAINT IF EXISTS trips_vehicle_id_fkey;
ALTER TABLE IF EXISTS trips DROP CONSTRAINT IF EXISTS trips_driver_id_fkey;
ALTER TABLE IF EXISTS maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_vehicle_id_fkey;
ALTER TABLE IF EXISTS fuel_logs DROP CONSTRAINT IF EXISTS fuel_logs_vehicle_id_fkey;
ALTER TABLE IF EXISTS fuel_logs DROP CONSTRAINT IF EXISTS fuel_logs_trip_id_fkey;

-- 2) Rename primary key columns (only if current schema uses "id")
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') THEN
        ALTER TABLE users RENAME COLUMN id TO user_id;
    END IF;
END$$;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'id') THEN
        ALTER TABLE vehicles RENAME COLUMN id TO vehicle_id;
    END IF;
END$$;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'id') THEN
        ALTER TABLE drivers RENAME COLUMN id TO driver_id;
    END IF;
END$$;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'id') THEN
        ALTER TABLE trips RENAME COLUMN id TO trip_id;
    END IF;
END$$;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_logs' AND column_name = 'id') THEN
        ALTER TABLE maintenance_logs RENAME COLUMN id TO maintenance_id;
    END IF;
END$$;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'id') THEN
        ALTER TABLE fuel_logs RENAME COLUMN id TO fuel_log_id;
    END IF;
END$$;

-- 3) Re-add foreign keys (reference new PK column names; idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_vehicle_id_fkey') THEN
        ALTER TABLE trips ADD CONSTRAINT trips_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id);
    END IF;
END$$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_driver_id_fkey') THEN
        ALTER TABLE trips ADD CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers(driver_id);
    END IF;
END$$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_logs_vehicle_id_fkey') THEN
        ALTER TABLE maintenance_logs ADD CONSTRAINT maintenance_logs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id);
    END IF;
END$$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fuel_logs_vehicle_id_fkey') THEN
        ALTER TABLE fuel_logs ADD CONSTRAINT fuel_logs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id);
    END IF;
END$$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fuel_logs_trip_id_fkey') THEN
        ALTER TABLE fuel_logs ADD CONSTRAINT fuel_logs_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES trips(trip_id);
    END IF;
END$$;

-- 4) Add soft delete columns where missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- 5) Indexes for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_deleted ON vehicles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_drivers_is_deleted ON drivers(is_deleted);
CREATE INDEX IF NOT EXISTS idx_trips_is_deleted ON trips(is_deleted);

-- No hard DELETE: all "deletes" are UPDATE ... SET is_deleted = TRUE (enforced in application/repositories).
