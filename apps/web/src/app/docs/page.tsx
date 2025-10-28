import { SectionHeading } from '@/components/section-heading';

const docItems = [
  {
    title: 'セットアップ手順',
    description:
      'README.md に記載された手順に従い、環境変数を設定して `npm install`・`npm run dev` を実行してください。Neon PostgreSQL の接続情報と Mapbox トークンが必要です。',
  },
  {
    title: 'API 仕様',
    description:
      '`/api/bear-reports` と `/api/prediction` の JSON スキーマ、利用方法、レスポンス例を掲載しています。',
  },
  {
    title: 'データフロー',
    description:
      'データ取得スクリプトで収集したデータが機械学習モデルと可視化にどのように利用されるかを図解しています。',
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <SectionHeading
        title="ドキュメント"
        description="Bear Predictor の利用方法、API 仕様、データフローについての技術文書です。"
      />
      <div className="grid gap-6 md:grid-cols-2">
        {docItems.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-sm text-brand-700">
        <p>
          詳細な ER 図・データフロー図・API の JSON スキーマはリポジトリ内の <code>docs/</code> ディレクトリをご参照ください。
        </p>
      </div>
    </div>
  );
}
