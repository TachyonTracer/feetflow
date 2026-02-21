export interface ApiResponse<T = any> {
  status: number;
  errorMessage: string | null;
  result: T;
  timestamp: string;
}
