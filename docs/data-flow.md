# データフロー図

```mermaid
flowchart LR
  A[自治体オープンデータ\n出没情報] -->|ETL| B[data/ingestion_scripts]
  C[気象API\n(気象庁)] -->|ETL| B
  D[地理データ\n(標高/植生)] -->|ETL| B
  B --> E[data/seed/*.sql]
  E --> F[(Neon PostgreSQL)]
  F --> G[Next.js API Routes\n/api/bear-reports]
  F --> H[ONNX モデル推論\n/api/prediction]
  H --> I[Next.js App Router\n地図/ヒートマップ]
  G --> I
  H --> J[ml/model_training.py\n再学習ワークフロー]
```
