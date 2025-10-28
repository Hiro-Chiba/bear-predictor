"""熊出没予測モデルのための特徴量生成スクリプト."""
from __future__ import annotations

import pathlib
from dataclasses import dataclass

import numpy as np
import pandas as pd
from pyproj import Geod

DATA_DIR = pathlib.Path(__file__).resolve().parents[1] / "data"

geod = Geod(ellps="WGS84")


@dataclass
class FeatureSet:
    features: pd.DataFrame
    target: pd.Series


def load_sources() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    bear_reports = pd.read_csv(DATA_DIR / "ingestion_scripts" / "bear_reports.csv", parse_dates=["datetime"])
    weather = pd.read_csv(DATA_DIR / "ingestion_scripts" / "weather_observations.csv", parse_dates=["observed_at"])
    terrain = pd.read_csv(DATA_DIR / "seed" / "terrain_features.csv")
    return bear_reports, weather, terrain


def calculate_distance(row: pd.Series, mean_lat: float, mean_lon: float) -> float:
    _, _, distance = geod.inv(row["longitude"], row["latitude"], mean_lon, mean_lat)
    return float(distance / 1000)  # km


def build_features() -> FeatureSet:
    bear_reports, weather, terrain = load_sources()

    weather_hourly = weather.set_index("observed_at").resample("1H").mean().interpolate()

    merged = bear_reports.reset_index(drop=True).copy()
    merged["report_id"] = merged.index
    merged["hour"] = merged["datetime"].dt.hour
    merged["month"] = merged["datetime"].dt.month
    merged["season"] = pd.cut(
        merged["month"],
        bins=[0, 2, 5, 8, 11, 12],
        labels=["winter", "spring", "summer", "autumn", "winter"],
        include_lowest=True,
        ordered=False,
    )

    merged = merged.merge(
        weather_hourly,
        left_on=merged["datetime"].dt.floor("1H"),
        right_index=True,
        how="left",
    )

    nearest_terrain = (
        terrain.assign(key=1)
        .merge(merged[["report_id", "latitude", "longitude"]].assign(key=1), on="key")
        .drop(columns=["key"])
    )
    nearest_terrain["distance_km"] = np.sqrt(
        (nearest_terrain["latitude_x"] - nearest_terrain["latitude_y"]) ** 2
        + (nearest_terrain["longitude_x"] - nearest_terrain["longitude_y"]) ** 2
    )
    nearest_idx = nearest_terrain.groupby("report_id")["distance_km"].idxmin()
    terrain_features = nearest_terrain.loc[nearest_idx, [
        "report_id",
        "elevation",
        "slope_angle",
        "distance_to_settlement",
        "fruit_availability",
    ]].set_index("report_id")

    features = merged.join(terrain_features, on="report_id")

    mean_latitude = merged["latitude"].mean()
    mean_longitude = merged["longitude"].mean()

    features["distance_to_centroid_km"] = features.apply(
        calculate_distance,
        axis=1,
        mean_lat=mean_latitude,
        mean_lon=mean_longitude,
    )

    features["recent_bear_reports"] = (
        merged.sort_values("datetime")
        .set_index("datetime")
        .assign(count=1)
        .rolling("7D")["count"]
        .sum()
        .fillna(0)
        .values
    )

    target = (merged["risk_level"] == "高").astype(int)

    selected = features[
        [
            "latitude",
            "longitude",
            "hour",
            "month",
            "temperature",
            "precipitation",
            "snow_depth",
            "elevation",
            "slope_angle",
            "distance_to_settlement",
            "fruit_availability",
            "distance_to_centroid_km",
            "recent_bear_reports",
        ]
    ].fillna(method="ffill").fillna(0)

    return FeatureSet(features=selected, target=target)


if __name__ == "__main__":
    feature_set = build_features()
    output_dir = pathlib.Path(__file__).resolve().parent / "artifacts"
    output_dir.mkdir(parents=True, exist_ok=True)
    feature_set.features.to_parquet(output_dir / "features.parquet")
    feature_set.target.to_csv(output_dir / "target.csv", index=False)
    print("特徴量を生成しました")
