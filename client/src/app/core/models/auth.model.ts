export type LoginRole = 'manager' | 'dispatcher' | 'analyst' | 'safety_officer';
export type ApiUserRole = 'Manager' | 'Dispatcher' | 'FinancialAnalyst' | 'SafetyOfficer';

export interface RoleOption {
  value: LoginRole;
  label: string;
  icon: string;
}

export const AVAILABLE_ROLES: RoleOption[] = [
  { value: 'manager', label: 'Manager', icon: 'manage_accounts' },
  { value: 'dispatcher', label: 'Dispatcher', icon: 'hub' },
  { value: 'analyst', label: 'Analyst', icon: 'analytics' },
  { value: 'safety_officer', label: 'Safety Officer', icon: 'health_and_safety' },
];

const UI_ROLE_TO_API_ROLE: Record<LoginRole, ApiUserRole> = {
  manager: 'Manager',
  dispatcher: 'Dispatcher',
  analyst: 'FinancialAnalyst',
  safety_officer: 'SafetyOfficer',
};

export function mapRoleToApiRole(role: LoginRole): ApiUserRole {
  return UI_ROLE_TO_API_ROLE[role] ?? 'Manager';
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: LoginRole;
  rememberMe: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: ApiUserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface Tenant {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface UserDetails {
  result: unknown[];
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: ApiUserRole;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: LoginRole;
}
