export interface User {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  fullName: string;
  role: string;
}
