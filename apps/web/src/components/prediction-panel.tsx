'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { requestPrediction } from '@/lib/api/client';
import type { PredictionRequest, PredictionResponse } from '@/types/bear';

interface PredictionFormValues extends PredictionRequest {}

const defaultValues: PredictionFormValues = {
  datetime: format(new Date(), "yyyy-MM-dd'T'HH:00"),
  latitude: 39.7199,
  longitude: 140.1024,
};

export function PredictionPanel() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<PredictionFormValues>({ defaultValues });

  const onSubmit = async (values: PredictionFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const date = new Date(values.datetime);
      if (Number.isNaN(date.getTime())) {
        setError('日時の形式が正しくありません');
        setIsLoading(false);
        return;
      }
      const payload: PredictionRequest = {
        datetime: date.toISOString(),
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
      };
      const prediction = await requestPrediction(payload);
      setResult(prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予測リクエストに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset(defaultValues);
    setResult(null);
    setError(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">日時・地点で予測</h3>
      <p className="mt-1 text-sm text-slate-600">
        指定した日時・緯度経度におけるクマ出没リスクを算出します。Map上で地点を選ぶことで入力値を取得できる連携も想定しています。
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            日時
            <input
              type="datetime-local"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...register('datetime', { required: true })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            緯度
            <input
              type="number"
              step="0.0001"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...register('latitude', { required: true, valueAsNumber: true })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            経度
            <input
              type="number"
              step="0.0001"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...register('longitude', { required: true, valueAsNumber: true })}
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            リセット
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {isLoading ? '計算中...' : 'リスクを計算'}
          </button>
        </div>
      </form>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {result ? (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
          <p className="text-lg font-semibold text-brand-900">
            リスクレベル: <span>{result.risk_level}</span>
          </p>
          <p className="mt-2 text-sm">予測出没確率: {(result.probability * 100).toFixed(1)}%</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {result.contributingFactors.map((factor) => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
