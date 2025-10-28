import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: '熊出没予測サービス | Bear Predictor',
  description:
    '秋田県を中心としたクマ出没リスクを可視化・予測するウェブアプリケーションです。地図、ヒートマップ、予測フォームを提供します。',
  openGraph: {
    type: 'website',
    title: '熊出没予測サービス',
    description:
      '秋田県のクマ出没リスクをヒートマップ・予測フォームで確認できる熊出没予測サービス。',
    url: 'https://bear-predictor.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={notoSans.className}>
      <body className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
                  Bear Predictor
                </p>
                <h1 className="text-lg font-bold text-slate-900">熊出没予測ダッシュボード</h1>
              </div>
              <nav className="flex gap-4 text-sm text-slate-600">
                <a href="/" className="hover:text-brand-600">
                  ホーム
                </a>
                <a href="/map" className="hover:text-brand-600">
                  マップ
                </a>
                <a href="/docs" className="hover:text-brand-600">
                  ドキュメント
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white/80 py-6 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Bear Predictor Team
          </footer>
        </div>
      </body>
    </html>
  );
}
