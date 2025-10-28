"""LightGBM による熊出没リスク予測モデルの学習スクリプト."""
from __future__ import annotations

import json
import pathlib

import lightgbm as lgb
import pandas as pd
from onnxmltools import convert_lightgbm
from onnxmltools.convert.common.data_types import FloatTensorType
from sklearn.metrics import average_precision_score, precision_score, roc_auc_score
from sklearn.model_selection import train_test_split

from ml.feature_engineering import FeatureSet, build_features

ARTIFACT_DIR = pathlib.Path(__file__).resolve().parent / "artifacts"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    feature_set: FeatureSet = build_features()
    X_train, X_test, y_train, y_test = train_test_split(
        feature_set.features,
        feature_set.target,
        test_size=0.2,
        random_state=42,
        stratify=feature_set.target,
    )

    train_dataset = lgb.Dataset(X_train, label=y_train)
    valid_dataset = lgb.Dataset(X_test, label=y_test)

    params = {
        "objective": "binary",
        "metric": ["auc", "average_precision"],
        "learning_rate": 0.05,
        "num_leaves": 64,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": -1,
    }

    model = lgb.train(
        params,
        train_set=train_dataset,
        num_boost_round=600,
        valid_sets=[train_dataset, valid_dataset],
        valid_names=["train", "valid"],
        callbacks=[lgb.early_stopping(stopping_rounds=50)],
    )

    y_pred_proba = model.predict(X_test, num_iteration=model.best_iteration)
    auc = roc_auc_score(y_test, y_pred_proba)
    ap = average_precision_score(y_test, y_pred_proba)
    precision_at_threshold = precision_score(y_test, y_pred_proba > 0.5)

    metrics = {
        "auc": float(auc),
        "average_precision": float(ap),
        "precision_at_0_5": float(precision_at_threshold),
    }
    (ARTIFACT_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2, ensure_ascii=False))

    model.booster_.save_model(str(ARTIFACT_DIR / "bear-risk.txt"))

    input_shape = feature_set.features.shape[1]
    onnx_model = convert_lightgbm(
      model.booster_,
      initial_types=[("input", FloatTensorType([None, input_shape]))],
    )
    with open(ARTIFACT_DIR / "bear-risk.onnx", "wb") as f:
        f.write(onnx_model.SerializeToString())

    feature_importance = model.feature_importance(importance_type="gain")
    importance_df = pd.DataFrame(
        {
          "feature": feature_set.features.columns,
          "importance_gain": feature_importance,
        }
    ).sort_values("importance_gain", ascending=False)
    importance_df.to_csv(ARTIFACT_DIR / "feature_importance.csv", index=False)

    print("学習完了: メトリクスを artifacts に保存しました")


if __name__ == "__main__":
    main()
