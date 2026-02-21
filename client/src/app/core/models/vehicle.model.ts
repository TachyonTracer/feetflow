export type VehicleStatus =
  | 'Available'
  | 'Active'
  | 'OnTrip'
  | 'InShop'
  | 'InMaintenance'
  | 'Retired';

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  vehicleType: string;
  maxCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  xmin: number;

  activeTripOriginState?: string;
  activeTripDestinationState?: string;

  totalFuelCost?: number;
  totalMaintenanceCost?: number;
  totalMiscExpense?: number;
  totalOperationalCost?: number;
}

export interface CreateVehicleRequest {
  name: string;
  licensePlate: string;
  vehicleType: string;
  maxCapacityKg: number;
  acquisitionCost: number;
  odometerKm?: number;
}

export interface UpdateVehicleRequest {
  name: string;
  licensePlate: string;
  vehicleType: string;
  maxCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  xmin: number;
}
