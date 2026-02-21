export type DriverStatus = 'OnDuty' | 'OnTrip' | 'OffDuty' | 'Suspended';

export interface Driver {
  id: string;
  fullName: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  status: DriverStatus;
  isDeleted: boolean;
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
