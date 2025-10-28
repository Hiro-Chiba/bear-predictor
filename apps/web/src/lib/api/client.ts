import type { BearReport, PredictionRequest, PredictionResponse } from '@/types/bear';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
    const error = new Error(errorBody.message ?? 'API error');
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function fetchBearReports(params?: { readonly season?: string; readonly hour?: number }) {
  const query = new URLSearchParams();
  if (params?.season) {
    query.set('season', params.season);
  }
  if (typeof params?.hour === 'number') {
    query.set('hour', params.hour.toString());
  }
  const url = query.size > 0 ? `/api/bear-reports?${query.toString()}` : '/api/bear-reports';
  const response = await fetch(url, { cache: 'no-store' });
  return handleResponse<{ readonly reports: BearReport[] }>(response);
}

export async function createBearReport(report: PredictionRequest & { readonly species: string }) {
  const response = await fetch('/api/bear-reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(report),
  });
  return handleResponse<{ readonly message: string; readonly id: number }>(response);
}

export async function requestPrediction(payload: PredictionRequest) {
  const response = await fetch('/api/prediction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<PredictionResponse>(response);
}
