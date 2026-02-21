export type LoginRole = 'manager' | 'dispatcher' | 'analyst' | 'safety_officer';

export interface RoleOption {
  value: LoginRole;
  label: string;
  icon: string;
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
  username: string;
  email: string;
  password: string;
  role: LoginRole;
}

export interface SignupFormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: LoginRole;
}
