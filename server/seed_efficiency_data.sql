-- ============================================================================
-- SQL Script to Seed 12 Months of Fuel Efficiency Data
-- ============================================================================
-- This script uses PL/pgSQL to dynamically find an active vehicle and driver,
-- then generates 12 months of historical Trips and Fuel Logs.
-- This will populate the "Fuel Efficiency Trend (km/L)" graph with realistic 
-- dummy data.
-- ============================================================================

DO $$
DECLARE
    v_vehicle_id UUID;
    v_driver_id UUID;
    v_trip_id UUID;
    r_month RECORD;
    
    -- Simulation variables
    v_start_odometer DECIMAL := 15000;
    v_end_odometer DECIMAL;
    v_distance DECIMAL;
    v_liters DECIMAL;
    v_cost DECIMAL;
BEGIN
    -- 1. Grab ANY active vehicle from the database
    SELECT vehicle_id INTO v_vehicle_id 
    FROM vehicles 
    WHERE is_deleted = FALSE 
    LIMIT 1;
    
    IF v_vehicle_id IS NULL THEN
        RAISE NOTICE 'No active vehicles found! Please create a vehicle first.';
        RETURN;
    END IF;

    -- 2. Grab ANY active driver from the database
    SELECT driver_id INTO v_driver_id 
    FROM drivers 
    WHERE is_deleted = FALSE 
    LIMIT 1;
    
    IF v_driver_id IS NULL THEN
        RAISE NOTICE 'No active drivers found! Please create a driver first.';
        RETURN;
    END IF;

    -- 3. Loop over the last 12 months and generate exactly 1 trip and 1 fuel log per month
    FOR r_month IN 
        SELECT generate_series(
            date_trunc('month', current_date - interval '11 months'),
            date_trunc('month', current_date),
            '1 month'::interval
        )::date AS m_start
    LOOP
        v_trip_id := gen_random_uuid();
        
        -- Generate random distance between 400km and 900km
        v_distance := floor(random() * 500 + 400); 
        v_end_odometer := v_start_odometer + v_distance;
        
        -- Randomize liters to simulate efficiency between 8 km/L and 12 km/L
        v_liters := v_distance / (random() * 4 + 8); 
        v_cost := v_liters * 105; -- Approx 105 INR per liter

        -- 3A. Insert a 'completed' Trip for that month
        INSERT INTO trips (
            trip_id, vehicle_id, driver_id, status, 
            cargo_weight_kg, start_odometer, end_odometer,
            revenue, created_at, completed_at, 
            origin_state, destination_state, is_deleted
        ) VALUES (
            v_trip_id, v_vehicle_id, v_driver_id, 'completed',
            1000, v_start_odometer, v_end_odometer,
            v_distance * 45, -- Fake revenue based on distance
            r_month.m_start, 
            r_month.m_start + interval '5 days', -- Must be completed in the target month
            'MH', 'DL', FALSE
        );

        -- 3B. Insert an associated Fuel Log for that trip
        INSERT INTO fuel_logs (
            fuel_log_id, vehicle_id, trip_id, driver_id,
            liters, cost, distance, misc_expense, 
            status, fuel_date, created_at
        ) VALUES (
            gen_random_uuid(), v_vehicle_id, v_trip_id, v_driver_id,
            v_liters, v_cost, v_distance, 0,
            'Completed', 
            r_month.m_start + interval '4 days', 
            r_month.m_start + interval '4 days'
        );
        
        -- Advance the starting odometer for the next month's trip
        v_start_odometer := v_end_odometer + floor(random() * 200 + 50);
        
    END LOOP;

    RAISE NOTICE 'SUCCESS: Generated 12 months of historical dummy trips and fuel logs for Vehicle ID: %', v_vehicle_id;
END $$;
