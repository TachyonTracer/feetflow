export type MaintenanceStatus = 'Open' | 'Closed';

export interface MaintenanceLog {
  maintenance_id: string;
  vehicle_id: string;
  description: string;
  cost: number;
  serviceDate: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt?: string;

  // Potential navigation property
  vehicleName?: string;
}

export interface CreateMaintenanceRequest {
  vehicle_id: string;
  description: string;
  cost: number;
  serviceDate: string;
}
