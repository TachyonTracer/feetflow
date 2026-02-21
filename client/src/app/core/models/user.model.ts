export interface User {
  id: string;
  name: string;
  description?: string;
}

export interface CreateUserRequest {
  name: string;
  description?: string;
}
