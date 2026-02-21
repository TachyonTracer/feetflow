export interface DashboardMetrics {
  totalVehicles: number;
  activeTrips: number;
  availableVehicles: number;
  onDutyDrivers: number;
  maintenanceAlerts: number;
  pendingCargo: number;
}

export interface VehicleRoi {
  totalRevenue: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  acquisitionCost: number;
  roi: number;
}

export type FuelEfficiency = number | null;

export interface FleetFinancialSummary {
  totalFuelCost: number;
  fleetRoi: number;
  utilizationRate: number;
  monthlyData: MonthlyFinancialData[];
}

export interface MonthlyFinancialData {
  month: string;
  revenue: number;
  fuelCost: number;
  maintenance: number;
  netProfit: number;
}

export interface FuelEfficiencyTrendItem {
  month: string;
  kmL: number;
}

export interface TopCostliestVehicleItem {
  vehicleName: string;
  licensePlate: string;
  totalCost: number;
}
