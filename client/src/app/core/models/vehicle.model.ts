export type VehicleStatus = 'Active' | 'InMaintenance' | 'Retired';

export interface Vehicle {
  vehicle_id: string;
  name: string;
  licensePlate: string;
  vehicleType: string;
  maxCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  createdAt: string;
  updatedAt?: string;
  xmin: number;
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
