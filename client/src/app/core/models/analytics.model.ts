export interface DashboardMetrics {
  totalVehicles: number;
  activeTrips: number;
  availableVehicles: number;
  onDutyDrivers: number;
}

export interface VehicleRoi {
  totalRevenue: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  acquisitionCost: number;
  roi: number;
}

export type FuelEfficiency = number | null;
