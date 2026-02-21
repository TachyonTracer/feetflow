export type LoginRole = 'manager' | 'dispatcher' | 'analyst' | 'safety_officer';

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

export interface LoginCredentials {
  email: string;
  password: string;
  role: LoginRole;
  rememberMe: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: LoginRole;
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
  role: LoginRole;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: LoginRole;
}
