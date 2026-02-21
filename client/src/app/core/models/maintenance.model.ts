export interface MaintenanceLog {
  maintenanceId: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  description: string;
  cost: number;
  serviceDate: string;
  isClosed: boolean;
  createdAt: string;
}

export interface CreateMaintenanceRequest {
  vehicleId: string;
  description: string;
  cost: number;
  serviceDate: string;
}
