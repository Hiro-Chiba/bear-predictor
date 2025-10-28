# Bear Predictor

熊出没予測サービスは、秋田県を中心とした地域でのクマ出没リスクを可視化・予測するためのフルスタックアプリケーションです。Next.js (App Router) をベースに、Mapbox による地図表示、Neon PostgreSQL へのデータ保存、LightGBM モデルによるリスク推論ワークフローを統合しています。

## 主な機能

- 過去の出没地点を Mapbox GL JS でプロット
- 季節・時間帯フィルタ付きヒートマップ表示
- 指定日時・地点の出没リスク予測 API (`POST /api/prediction`)
- 出没レポート登録 API (`POST /api/bear-reports`)
- Python 製スクリプトによるデータ取得・特徴量生成・モデル学習
- Vitest/React Testing Library によるフロント/バックテスト、Pytest による ML テスト

## アプリの使い方

1. `npm run dev` でローカルサーバーを起動し、ブラウザで `http://localhost:3000` を開きます。
2. ホーム画面では主要機能の概要と地図プレビューを確認できます。ヘッダーの「地図を見る」ボタンまたはナビゲーションから `/map` ページへ移動します。
3. 地図画面を開くと、日本列島全体を俯瞰できる縮尺で表示され、全国に登録された出没レポートがクマ型のマーカーで描画されます。赤は高リスク、黄は中リスク、緑は低リスクを示し、ヒートマップレイヤーがリスク密度を可視化します。秋田県など特定地域を詳細に確認したい場合はマウスホイールやタッチ操作でズームしてください。
4. 画面左側のフィルタから「季節」「時間帯」を選択すると、地図上のヒートマップとマーカーが条件に応じて更新されます。
5. 「リスク予測」フォームに日時・座標・付随情報を入力し送信すると、`/api/prediction` が呼び出され、確率値とリスクレベルが表示されます。
6. フォーム下部の出没レポート一覧では、最新順に登録データを確認できます。必要に応じて `/api/bear-reports` に POST してデータを追加してください。

## セットアップ

### 1. リポジトリの準備

```bash
npm install
npm run dev
```

> Node.js 18.18.0 を `.nvmrc` と `.node-version` に指定しています。`nvm use` などで合わせてください。

### 2. 環境変数

`sample.env` を参考に `.env.local` を作成し、以下を設定します。

- `DATABASE_URL`: Neon PostgreSQL の接続文字列
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox のアクセストークン
- `MODEL_ONNX_PATH`: デプロイ時に同梱する ONNX モデルのパス (任意)

### 3. データベース

```bash
psql "$DATABASE_URL" -f data/schema.sql
psql "$DATABASE_URL" -f data/seed/bear_reports.sql
```

### 4. 開発サーバー

```bash
npm run dev
```

`http://localhost:3000` にアクセスするとアプリが表示されます。

### 5. テスト

```bash
npm run test         # Vitest によるフロント・API ロジックテスト
pytest tests/ml      # Pytest による ML パイプラインテスト
```

> ML テストを実行する前に `pip install -r ml/requirements.txt` を実行してください。

## デプロイ

### Vercel へのデプロイ手順

1. Vercel ダッシュボードで **New Project** を選択し、このリポジトリをインポートします。フレームワークプリセットは Next.js (App Router) が自動選択されます。
2. ビルド設定で以下を確認・変更します。
   - **Install Command**: `npm install`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. **Environment Variables** に以下を登録します。
   - `DATABASE_URL`: Neon PostgreSQL の接続文字列。Vercel の [Neon 公式インテグレーション](https://vercel.com/integrations/neon) を利用する場合は、連携後に自動で注入される値を利用できます。
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox アクセストークン。
   - `MODEL_ONNX_PATH` (任意): デプロイ時にバンドルした ONNX モデルの相対パス。
4. Neon 側で本番用データベースを作成したら、Vercel の **Integrations → Neon** から対象プロジェクトに接続し、環境 (Production / Preview / Development) ごとの接続文字列を発行します。接続後に `vercel env pull` を実行するとローカルにも同じ変数を反映できます。
5. 初回デプロイ後に Vercel の **Deployments** 画面から「Open Deployment」を開き、`/api/health` (任意で作成した場合) や `/api/prediction` を叩いて動作を確認します。DB 初期化が必要な場合はローカルから `psql "$DATABASE_URL" -f data/schema.sql` を実行してください。
6. ONNX モデルを利用する場合は、リポジトリ内の `ml/artifacts/bear-risk.onnx` をコミットした上で `MODEL_ONNX_PATH` を設定し、デプロイ後に API から読み込めることを確認します。

> Vercel CLI を利用する場合は `npm install -g vercel` を実行し、`vercel link` → `vercel deploy --prebuilt` の順に実行します。CLI でのデプロイでも上記環境変数設定が必要です。

## データワークフロー

1. `data/ingestion_scripts` 配下の Python スクリプトで出没・気象データを取得。
2. `ml/feature_engineering.py` が特徴量を作成し、`ml/model_training.py` で LightGBM モデルを学習。
3. モデル成果物 (ONNX, feature importance) を `ml/artifacts/` に保存。
4. Next.js API (`/api/prediction`) で ONNX Runtime またはヒューリスティックによる推論を実行。

### 最新の熊出没データを取り込む

`data/ingestion_scripts/fetch_bear_reports.py` は秋田・岩手・山形各県のオープンデータカタログ (CKAN API) を横断検索し、最新の GeoJSON/CSV リソースから日時・緯度経度・種別・危険度情報を抽出します。フィールドに危険度が含まれない場合は季節に応じたヒューリスティックでリスクレベルを付与します。以下の手順でデータを更新してください。

```bash
pip install -r ml/requirements.txt
python data/ingestion_scripts/fetch_bear_reports.py
python data/ingestion_scripts/fetch_weather.py
```

> 各自治体の API はアクセス制限がかかる場合があります。社内ネットワークやプロキシ経由で到達できることを確認してください。取得した CSV は機械学習とデータベース初期データ投入の双方で利用されます。

## ディレクトリ構成

```
/
├── apps/
│   └── web/                # Next.js アプリケーション
├── data/                   # DB スキーマ・初期データ・ETL スクリプト
├── docs/                   # ER 図・データフロー・API スキーマ
├── ml/                     # 特徴量生成・モデル学習スクリプト
├── tests/                  # 各層のテストコード
└── plans.md                # 実装計画 (更新履歴付き)
```

## ライセンス

社内利用を想定しているため、ライセンスは設定していません。必要に応じて追加してください。
