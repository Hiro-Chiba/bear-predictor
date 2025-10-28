'use client';

import { useMemo } from 'react';
import { useMapFilters } from '@/lib/map-filters-context';

const seasonLabels: Record<'spring' | 'summer' | 'autumn' | 'winter' | 'all', string> = {
  spring: '春 (3-5月)',
  summer: '夏 (6-8月)',
  autumn: '秋 (9-11月)',
  winter: '冬 (12-2月)',
  all: '通年',
};

export function MapFilters() {
  const { season, hour, setSeason, setHour } = useMapFilters();

  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(seasonLabels) as Array<keyof typeof seasonLabels>).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSeason(key)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              season === key
                ? 'border-brand-500 bg-brand-100 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {seasonLabels[key]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <label className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">時間帯</span>
          <select
            value={hour ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setHour(value === '' ? null : Number(value));
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">全て</option>
            {hours.map((h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, '0')}時台
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
