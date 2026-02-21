export type TripStatus = 'Pending' | 'OnTrip' | 'Delivered' | 'Cancelled';

export interface Trip {
  trip_id: string;
  vehicle_id: string;
  driver_id: string;
  status: TripStatus;
  cargoWeightKg: number;
  startOdometer?: number;
  endOdometer?: number;
  revenue?: number;
  dispatchedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;

  // Useful navigation properties that might be returned by the GET API if it includes them
  vehicleName?: string;
  driverName?: string;
}

export interface CreateTripRequest {
  vehicle_id: string;
  driver_id: string;
  cargoWeightKg: number;
}

export interface CompleteTripRequest {
  endOdometer: number;
  revenue: number;
}
