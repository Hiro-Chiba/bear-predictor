import Link from 'next/link';
import { MapPreview } from '@/components/map-preview';
import { PredictionPanel } from '@/components/prediction-panel';

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            秋田県向け 熊出没リスク可視化
          </span>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">熊出没予測サービス</h2>
          <p className="text-base text-slate-600">
            過去の出没履歴、気象データ、地形・植生情報を統合し、クマが出没しやすいエリアとタイミングを予測します。地図ヒートマップや日時指定のリスクスコアで、地域の安全な見守り活動を支援します。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/map"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              マップを表示
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              ドキュメントを見る
            </Link>
          </div>
        </div>
        <MapPreview />
      </section>
      <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <PredictionPanel />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">最新のハイライト</h3>
          <ul className="mt-4 space-y-4 text-sm text-slate-600">
            <li>
              <span className="font-semibold text-slate-900">直近1週間の出没件数:</span> API からリアルタイムに集計
            </li>
            <li>
              <span className="font-semibold text-slate-900">高リスクエリア:</span> ヒートマップで色分け表示
            </li>
            <li>
              <span className="font-semibold text-slate-900">気象トレンド:</span> 気温・降水量・積雪深を特徴量に反映
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
