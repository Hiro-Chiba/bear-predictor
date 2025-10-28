"""気象庁のAPIから気象データを取得する簡易スクリプト."""
from __future__ import annotations

import csv
import os
import pathlib
from datetime import datetime, timedelta
from typing import Any

import requests

API_ENDPOINT = "https://www.jma.go.jp/bosai/amedas/data/map/{timestamp}.json"
OUTPUT_PATH = pathlib.Path(__file__).resolve().parent / "weather_observations.csv"


def build_timestamp() -> str:
    target = datetime.utcnow().replace(minute=0, second=0, microsecond=0) - timedelta(hours=1)
    return target.strftime("%Y%m%d%H0000")


def fetch_weather(timestamp: str) -> dict[str, Any]:
    url = API_ENDPOINT.format(timestamp=timestamp)
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.json()


def main() -> None:
    timestamp = build_timestamp()
    data = fetch_weather(timestamp)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=[
                "observed_at",
                "latitude",
                "longitude",
                "temperature",
                "precipitation",
                "snow_depth",
            ],
        )
        writer.writeheader()
        for station_code, record in data.items():
            coordinates = record.get("latlon", {})
            writer.writerow(
                {
                  "observed_at": timestamp,
                  "latitude": coordinates.get("lat"),
                  "longitude": coordinates.get("lon"),
                  "temperature": record.get("temp"),
                  "precipitation": record.get("precipitation10m"),
                  "snow_depth": record.get("snowDepth"),
                }
            )
    print(f"保存しました: {OUTPUT_PATH}")


if __name__ == "__main__":
    if not os.getenv("WEATHER_API_KEY"):
        print("WEATHER_API_KEY が設定されていません。必要に応じてAPIプロキシを利用してください。")
    main()
