'use client';

import { useEffect, useState } from 'react';
import { fetchBearReports } from '@/lib/api/client';
import { useMapFilters } from '@/lib/map-filters-context';
import type { BearReport } from '@/types/bear';

export function ReportList() {
  const { season, hour } = useMapFilters();
  const [reports, setReports] = useState<BearReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const response = await fetchBearReports({ season: season === 'all' ? undefined : season, hour: hour ?? undefined });
        setReports(response.reports);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '出没データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    void loadReports();
  }, [season, hour]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">出没レポート一覧</h3>
        <span className="text-xs text-slate-500">{reports.length}件表示</span>
      </div>
      {isLoading ? <p className="mt-4 text-sm text-slate-500">読み込み中...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {!isLoading && !error ? (
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          {reports.map((report) => (
            <li key={report.id} className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{new Date(report.datetime).toLocaleString('ja-JP')}</span>
                <span className="font-semibold text-brand-700">{report.risk_level}リスク</span>
              </div>
              <p>
                <span className="font-semibold text-slate-900">{report.species}</span>
                <span className="ml-2">緯度: {report.latitude.toFixed(4)}</span>
                <span className="ml-2">経度: {report.longitude.toFixed(4)}</span>
              </p>
            </li>
          ))}
          {reports.length === 0 ? <li className="text-xs text-slate-400">該当するデータがありません。</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
