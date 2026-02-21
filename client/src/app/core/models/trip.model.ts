export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled' | 'OnTrip' | 'Delivered' | 'Pending';

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus;
  cargoWeightKg: number;
  startOdometer?: number;
  endOdometer?: number;
  revenue?: number;
  completedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  xmin: number;

  vehicleName?: string;
  driverName?: string;
}

export interface CreateTripRequest {
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
}

export interface CompleteTripRequest {
  endOdometer: number;
  revenue: number;
}
