export interface User {
  userId: string;
  name: string;
  description?: string;
}

export interface CreateUserRequest {
  name: string;
  description?: string;
}
