# 熊出没予測サービス 機能実装計画書

## 1. プロジェクト概要
- **目的**: 秋田県を中心とした地域でのクマ出没リスクを可視化し、いつ・どこで出没しやすいかを予測するWebサービスを提供する。
- **ホスティング**: Vercel を利用し、フロントエンドとAPIを Next.js 上で統合デプロイする。データベースには Vercel の連携先である Neon (PostgreSQL) を使用する。
- **主要技術スタック**:
  - フロントエンド: Next.js (App Router) + TypeScript + Tailwind CSS
  - バックエンド: Next.js API Routes
  - データベース: PostgreSQL (Neon)
  - マップ可視化: Mapbox GL JS
  - 機械学習: Python (LightGBM) によるバッチ学習 + モデル成果物のAPI提供

## 2. リポジトリ構成方針
```
/
├── apps/
│   └── web/            # Next.js フロントエンド + API (App Router)
├── data/
│   ├── schema.sql      # Neon(PostgreSQL) スキーマ定義
│   ├── seed/           # 初期データ投入用SQL・CSV
│   └── ingestion_scripts/
├── docs/
│   ├── ERD.md
│   ├── data-flow.md
│   └── api-schema.md
├── ml/
│   ├── feature_engineering.py
│   ├── model_training.py
│   ├── artifacts/
│   └── requirements.txt
├── tests/
│   ├── frontend/
│   ├── backend/
│   └── ml/
└── sample.env
```

## 3. フェーズ別タスク進捗

### フェーズA: 基盤整備 ✅ 完了
- [x] リポジトリ初期化と lint/format 設定 (ESLint + Prettier + strict TS)
- [x] Next.js (App Router) プロジェクトを `apps/web` に構築し Tailwind CSS を導入
- [x] Mapbox 初期化、共通 UI コンポーネント整備
- [x] `.nvmrc`, `.node-version`, `sample.env` を配置

### フェーズB: データベース & データ取得 ✅ 完了
- [x] `data/schema.sql` にテーブル定義
- [x] `data/seed` に初期レコード・地形データを整備
- [x] `data/ingestion_scripts` に出没データ・気象データ取得スクリプトとサンプル CSV を配置
- [x] ER 図・データフロー図を `docs/` に追加

### フェーズC: 機械学習モジュール ✅ 完了
- [x] `ml/feature_engineering.py` で特徴量生成パイプラインを実装
- [x] `ml/model_training.py` で LightGBM 学習 & ONNX 変換
- [x] `ml/artifacts/` を用意し、メトリクス/モデル保存先を確保
- [x] Pytest から呼び出せる最小限のテストを `tests/ml` に追加

### フェーズD: API 実装 ✅ 完了
- [x] `POST /api/bear-reports` と `GET /api/bear-reports` を実装 (Zod バリデーション, Neon 接続)
- [x] `POST /api/prediction` を実装し、ONNX 推論 + ヒューリスティックフォールバックを用意
- [x] API スキーマを `docs/api-schema.md` に反映
- [x] Vitest による API ロジック単体テストを追加

### フェーズE: フロントエンド実装 ✅ 完了
- [x] 地図表示ページ (`/map`) とホームページを実装
- [x] フィルタ UI、レジェンド、出没リスト、予測フォームを実装
- [x] Mapbox ヒートマップ + マーカー表示
- [x] レスポンシブデザイン / UX 強化

### フェーズF: ドキュメント & デプロイ ✅ 完了
- [x] README.md にセットアップ手順を記載
- [x] ER 図・データフロー図を docs 配下に整備
- [x] サンプル環境変数ファイル (`sample.env`) を追加
- [x] テストコマンド・デプロイ手順を README に反映

## 4. リスクと対策
- **データ不足**: 公開データが不足している場合、自治体オープンデータや研究論文から補完し、サンプルCSVを同梱済み。
- **モデル推論の速度**: ONNX モデルの読み込みに失敗した場合はヒューリスティック予測にフォールバックする。
- **地図表示のコスト**: Mapbox の料金に注意し、必要に応じてアクセス制限を設定する。
- **個人情報・位置情報**: データは匿名化された座標を使用し、利用規約・プライバシーポリシーを別途整備予定。

## 5. マイルストーン
1. **M1**: 基盤・Next.js セットアップ ✅
2. **M2**: DB スキーマ・データ取得スクリプト ✅
3. **M3**: 機械学習モジュール ✅
4. **M4**: API + フロント統合 ✅
5. **M5**: ドキュメント・デプロイ準備 ✅

## 6. テスト戦略
- **単体テスト**: React コンポーネント (Testing Library)、API (Vitest)
- **統合テスト**: 主要フローを Vitest + React Testing Library でカバー (Map 周辺は手動/Playwright を将来追加)
- **ML テスト**: `pytest` で特徴量生成の整合性を検証
- **CI 推奨**: GitHub Actions で `npm run lint`, `npm run test`, `pytest` を実行

## 7. 今後の拡張案
- 通知機能 (メール/SMS) による警戒アラート
- ユーザー投稿フォームからの即時登録
- SNS 共有機能
- TensorFlow.js を活用したブラウザ内推論
- 管理者向けダッシュボード
