export interface ApiResponse {
  status: number;
  errorMessage: string | null;
  result: any;
  timestamp: string;
}
