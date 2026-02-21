export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  driverId?: string;
  liters: number;
  cost: number;
  distance: number;
  miscExpense: number;
  status: string;
  fuelDate: string;
  createdAt: string;
  vehicleName?: string;
  driverName?: string;
}

export interface FuelLogPagedResponse {
  pagedResult: {
    items: FuelLog[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  };
  totalFuelCost: number;
  totalMiscExpense: number;
  tripsCount: number;
}

export interface CreateFuelLogRequest {
  vehicleId: string;
  tripId?: string;
  driverId?: string;
  liters: number;
  cost: number;
  distance: number;
  miscExpense: number;
  status?: string;
  fuelDate: string;
}

export interface UpdateFuelLogRequest {
  vehicleId: string;
  tripId?: string;
  driverId?: string;
  liters: number;
  cost: number;
  distance: number;
  miscExpense: number;
  status?: string;
  fuelDate: string;
}
