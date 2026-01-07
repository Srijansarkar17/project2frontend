export interface ProcessingResult {
  success: boolean;
  message: string;
  stats: {
    total_records: number;
    filename: string;
    columns: string[];
    preview: Record<string, any>[];
  };
  download_url: string;
  error?: string; // Make error optional
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  backend: string;
  version: string;
}