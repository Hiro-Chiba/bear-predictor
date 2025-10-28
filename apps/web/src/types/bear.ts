export interface BearReport {
  readonly id: number;
  readonly datetime: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly species: string;
  readonly risk_level: '低' | '中' | '高';
  readonly created_at: string;
}

export interface PredictionRequest {
  readonly datetime: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface PredictionResponse {
  readonly probability: number;
  readonly risk_level: '低' | '中' | '高';
  readonly contributingFactors: string[];
}

export interface ApiError {
  readonly message: string;
  readonly code: string;
}
