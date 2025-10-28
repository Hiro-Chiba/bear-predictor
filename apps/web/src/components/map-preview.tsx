export function MapPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-brand-100 p-6 shadow-inner">
      <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/139.95,39.72,7.5,0/600x400?access_token=pk.test-token')] bg-cover bg-center opacity-40" />
      <div className="relative space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Map Preview</p>
          <h3 className="text-xl font-semibold text-slate-900">秋田県エリアの最新ヒートマップ</h3>
        </div>
        <p className="max-w-sm text-sm text-slate-600">
          本番環境では Mapbox のインタラクティブマップを用いて、最新の熊出没地点とヒートマップを重ね合わせて表示します。
        </p>
        <ul className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
          <li className="rounded-lg bg-white/80 p-3 shadow-sm">
            <p className="font-semibold text-slate-900">リスクレベル</p>
            <p>低/中/高を色分け表示</p>
          </li>
          <li className="rounded-lg bg-white/80 p-3 shadow-sm">
            <p className="font-semibold text-slate-900">データ更新</p>
            <p>毎日早朝に自動更新</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
