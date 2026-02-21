export interface DashboardMetrics {
  activeVehicles: number;
  vehiclesInMaintenance: number;
  pendingTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalRevenue: number;

  // Optional delta percentages if API returns them
  activeVehiclesDelta?: string;
  pendingTripsDelta?: string;
}

export interface VehicleRoi {
  vehicle_id: string;
  totalRevenue: number;
  totalMaintenanceCost: number;
  acquisitionCost: number;
  roiPercentage: number;
}

export interface FuelEfficiency {
  vehicle_id: string;
  totalKm: number;
  // Based on the fields, assuming there is more depending on exact implementation
}
