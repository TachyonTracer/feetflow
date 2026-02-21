export interface FuelLog {
  fuel_id: string;
  vehicle_id: string;
  trip_id?: string;
  liters: number;
  cost: number;
  fuelDate: string;
  createdAt: string;

  vehicleName?: string;
  driverName?: string;
}

export interface CreateFuelLogRequest {
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  fuelDate: string;
}
