import { SearchableSelectOption } from '../../shared/components/searchable-select/searchable-select.component';

export const COMMON_PAGE_SIZE_OPTIONS: SearchableSelectOption[] = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
];

export const DASHBOARD_PAGE_SIZE_OPTIONS: SearchableSelectOption[] = [
  { value: '5', label: '5 per page' },
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
];

export const MAINTENANCE_SORT_OPTIONS: SearchableSelectOption[] = [
  { value: '', label: 'Sort By...' },
  { value: 'date-desc', label: 'Date (Newest First)' },
  { value: 'date-asc', label: 'Date (Oldest First)' },
  { value: 'cost-desc', label: 'Cost (High to Low)' },
  { value: 'cost-asc', label: 'Cost (Low to High)' },
];

export const EXPENSE_SORT_OPTIONS: SearchableSelectOption[] = [
  { value: '', label: 'Sort By' },
  { value: 'date', label: 'Date' },
  { value: 'cost', label: 'Cost (High to Low)' },
  { value: 'liters', label: 'Liters (High to Low)' },
];

export const TRIP_SORT_OPTIONS: SearchableSelectOption[] = [
  { value: '', label: 'Sort By' },
  { value: 'status', label: 'Status' },
  { value: 'id', label: 'Trip ID' },
  { value: 'cargoWeightKg', label: 'Cargo Weight' },
  { value: 'revenue', label: 'Revenue' },
];

export const DRIVER_SORT_OPTIONS: SearchableSelectOption[] = [
  { value: '', label: 'Sort By' },
  { value: 'name', label: 'Name' },
  { value: 'licenseExpiry', label: 'License Expiry' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created Date' },
];

export const VEHICLE_SORT_OPTIONS: SearchableSelectOption[] = [
  { value: '', label: 'Sort By' },
  { value: 'capacity', label: 'Capacity (High to Low)' },
  { value: 'odometer', label: 'Odometer (High to Low)' },
  { value: 'acquisitionCost', label: 'Acquisition Cost (High to Low)' },
];

export const USER_SORT_OPTIONS: SearchableSelectOption[] = [
  { value: '', label: 'Sort By' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'joinedDate', label: 'Joined Date' },
];
