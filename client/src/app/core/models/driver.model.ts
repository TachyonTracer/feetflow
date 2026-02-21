export type DriverStatus = 'OnDuty' | 'OnTrip' | 'OffDuty' | 'Suspended';

export interface Driver {
  driver_id: string;
  fullName: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  status: DriverStatus;
  createdAt: string;
  updatedAt?: string;
  xmin: number;
}

export interface CreateDriverRequest {
  fullName: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
}

export interface UpdateDriverRequest {
  fullName: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  xmin: number;
}
