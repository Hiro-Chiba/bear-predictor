"""pytest 用のMLモジュールテスト."""
from __future__ import annotations

import pandas as pd
from ml.feature_engineering import build_features


def test_build_features() -> None:
    # 入力CSVが存在することを前提に最小限の動作を確認
    feature_set = build_features()
    assert isinstance(feature_set.features, pd.DataFrame)
    assert not feature_set.features.empty
    assert "recent_bear_reports" in feature_set.features.columns
