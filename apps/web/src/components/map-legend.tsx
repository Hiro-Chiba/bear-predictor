export function MapLegend() {
  return (
    <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm">
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-green-400" />低リスク
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-yellow-400" />中リスク
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500" />高リスク
      </span>
      <span className="ml-2 text-[11px] text-slate-400">ヒートマップの凡例</span>
    </div>
  );
}
