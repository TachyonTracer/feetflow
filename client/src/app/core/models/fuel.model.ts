export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  fuelDate: string;
  createdAt: string;
}

export interface CreateFuelLogRequest {
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  fuelDate: string;
}
