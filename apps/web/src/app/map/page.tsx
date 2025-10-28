import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { MapFilters } from '@/components/map-filters';
import { MapLegend } from '@/components/map-legend';
import { ReportList } from '@/components/report-list';
import { SectionHeading } from '@/components/section-heading';
import { MapFiltersProvider } from '@/lib/map-filters-context';

const BearRiskMap = dynamic(() => import('@/components/bear-risk-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-2xl border border-dashed border-brand-300 bg-white text-sm text-brand-700">
      マップを読み込み中...
    </div>
  ),
});

export default function MapPage() {
  return (
    <MapFiltersProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeading
            title="熊出没リスクマップ"
            description="季節・時間帯フィルタを用いて熊出没リスクを地図上で確認できます。各マーカーをクリックすると詳細情報を表示します。"
          />
          <MapLegend />
        </div>
        <MapFilters />
        <Suspense fallback={<p>マップデータを読み込み中...</p>}>
          <BearRiskMap />
        </Suspense>
        <ReportList />
      </div>
    </MapFiltersProvider>
  );
}
