"""日本各地の最新熊出没情報を公式オープンデータから取得して CSV として保存する."""
from __future__ import annotations

import csv
import pathlib
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Mapping, Sequence

import requests

OUTPUT_PATH = pathlib.Path(__file__).resolve().parent / "bear_reports.csv"

CATALOGS: Sequence["CatalogConfig"]


@dataclass(frozen=True)
class CatalogConfig:
    """CKAN カタログの検索条件."""

    base_url: str
    queries: Sequence[str]
    preferred_formats: Sequence[str]


CATALOGS = (
    CatalogConfig(
        base_url="https://opendata.pref.akita.lg.jp/api/3/action",
        queries=("ツキノワグマ 出没", "クマ 出没"),
        preferred_formats=("geojson", "csv"),
    ),
    CatalogConfig(
        base_url="https://opendata.pref.iwate.jp/api/3/action",
        queries=("クマ 出没",),
        preferred_formats=("geojson", "csv"),
    ),
    CatalogConfig(
        base_url="https://opendata.pref.yamagata.jp/api/3/action",
        queries=("熊 出没",),
        preferred_formats=("geojson", "csv"),
    ),
)


def _package_search_url(base_url: str) -> str:
    return f"{base_url.rstrip('/')}/package_search"


def discover_resource(catalog: CatalogConfig) -> tuple[str, str] | None:
    """検索クエリから最新のリソース URL とフォーマットを取得する."""

    for query in catalog.queries:
        response = requests.get(
            _package_search_url(catalog.base_url),
            params={"q": query, "rows": 5, "sort": "metadata_created desc"},
            timeout=30,
        )
        response.raise_for_status()
        result = response.json().get("result", {})
        for dataset in result.get("results", []):
            for resource in dataset.get("resources", []):
                fmt = resource.get("format", "").lower()
                if fmt in (fmt.lower() for fmt in catalog.preferred_formats):
                    url = resource.get("url")
                    if url:
                        return url, fmt
    return None


def fetch_geojson(url: str) -> Iterable[Mapping[str, object]]:
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    data = response.json()
    features = data.get("features", [])
    for feature in features:
        properties = feature.get("properties", {})
        geometry = feature.get("geometry", {})
        coordinates = geometry.get("coordinates", [None, None])
        yield {
            "datetime": _parse_datetime(properties),
            "latitude": coordinates[1],
            "longitude": coordinates[0],
            "species": properties.get("species")
            or properties.get("種別")
            or properties.get("分類")
            or "ツキノワグマ",
            "risk_level": _resolve_risk(properties),
        }


def fetch_csv(url: str) -> Iterable[Mapping[str, object]]:
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    decoded = response.content.decode("utf-8-sig").splitlines()
    reader = csv.DictReader(decoded)
    for row in reader:
        yield {
            "datetime": _parse_datetime(row),
            "latitude": _extract_float(row, ("latitude", "緯度")),
            "longitude": _extract_float(row, ("longitude", "経度")),
            "species": row.get("species") or row.get("種別") or "ツキノワグマ",
            "risk_level": row.get("risk_level") or row.get("危険度"),
        }


def _extract_float(data: Mapping[str, object], keys: Sequence[str]) -> float | None:
    for key in keys:
        value = data.get(key)
        if value is None:
            continue
        try:
            return float(str(value).strip())
        except ValueError:
            continue
    return None


def _parse_datetime(data: Mapping[str, object]) -> str | None:
    candidates = (
        data.get("datetime"),
        data.get("日時"),
        data.get("date"),
        data.get("発生日時"),
        data.get("報告日時"),
    )
    for value in candidates:
        if not value:
            continue
        parsed = _try_parse_datetime(str(value))
        if parsed:
            return parsed.isoformat()
    return None


def _try_parse_datetime(value: str) -> datetime | None:
    patterns = (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y/%m/%d %H:%M",
        "%Y/%m/%d",
        "%Y-%m-%d",
    )
    for pattern in patterns:
        try:
            return datetime.strptime(value, pattern)
        except ValueError:
            continue
    return None


def _resolve_risk(properties: Mapping[str, object]) -> str | None:
    for key in ("risk_level", "危険度", "危険ランク"):
        value = properties.get(key)
        if value:
            return str(value)
    return None


def normalise_records() -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for catalog in CATALOGS:
        resource = discover_resource(catalog)
        if not resource:
            print(f"{catalog.base_url} から有効なリソースを取得できませんでした")
            continue
        url, fmt = resource
        print(f"{catalog.base_url} から {fmt.upper()} を取得: {url}")
        if fmt == "geojson":
            iterator = fetch_geojson(url)
        else:
            iterator = fetch_csv(url)
        for record in iterator:
            if not record.get("latitude") or not record.get("longitude"):
                continue
            if record.get("datetime") is None:
                continue
            if not record.get("risk_level"):
                record["risk_level"] = _classify_risk(record["datetime"])
            records.append(record)
    return records


def _classify_risk(timestamp: str) -> str:
    dt = _try_parse_datetime(timestamp)
    if not dt:
        return "中"
    month = dt.month
    if month in (5, 6, 7):
        return "高"
    if month in (8, 9, 10):
        return "中"
    return "低"


def save_records(records: Iterable[Mapping[str, object]]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=("datetime", "latitude", "longitude", "species", "risk_level"),
        )
        writer.writeheader()
        for record in records:
            writer.writerow(
                {
                    "datetime": record.get("datetime"),
                    "latitude": record.get("latitude"),
                    "longitude": record.get("longitude"),
                    "species": record.get("species", "ツキノワグマ"),
                    "risk_level": record.get("risk_level", "中"),
                }
            )


def main() -> None:
    records = normalise_records()
    if not records:
        raise RuntimeError("オープンデータから熊出没情報を取得できませんでした")
    save_records(records)
    print(f"保存しました: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
