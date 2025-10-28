# API スキーマ

## POST /api/bear-reports

```json
{
  "type": "object",
  "required": ["datetime", "latitude", "longitude", "species"],
  "properties": {
    "datetime": {
      "type": "string",
      "format": "date-time"
    },
    "latitude": {
      "type": "number",
      "minimum": 35,
      "maximum": 45
    },
    "longitude": {
      "type": "number",
      "minimum": 135,
      "maximum": 145
    },
    "species": {
      "type": "string",
      "maxLength": 120
    }
  }
}
```

### レスポンス 201

```json
{
  "message": "レポートを登録しました",
  "id": 123
}
```

## POST /api/prediction

```json
{
  "type": "object",
  "required": ["datetime", "latitude", "longitude"],
  "properties": {
    "datetime": {
      "type": "string",
      "format": "date-time"
    },
    "latitude": {
      "type": "number",
      "minimum": 35,
      "maximum": 45
    },
    "longitude": {
      "type": "number",
      "minimum": 135,
      "maximum": 145
    }
  }
}
```

### レスポンス 200

```json
{
  "probability": 0.73,
  "risk_level": "高",
  "contributingFactors": ["ONNX モデル (bear-risk.onnx) の推論結果", "秋季は餌資源を求めて活動が活発化"]
}
```
