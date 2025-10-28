'use client';

import type { FeatureCollection, Point } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import { fetchBearReports } from '@/lib/api/client';
import { clientEnv } from '@/lib/env';
import { useMapFilters } from '@/lib/map-filters-context';
import type { BearReport } from '@/types/bear';

const DEFAULT_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [122.93457, 24.249472],
  [153.986672, 46.254192],
];

type BearFeatureCollection = FeatureCollection<Point, {
  readonly id: number;
  readonly datetime: string;
  readonly species: string;
  readonly risk_level: string;
}>;

type MarkerDefinition = {
  readonly id: string;
  readonly background: string;
  readonly ring: string;
};

const MARKER_DEFINITIONS: readonly MarkerDefinition[] = [
  {
    id: 'bear-marker-high',
    background: '#dc2626',
    ring: '#fca5a5',
  },
  {
    id: 'bear-marker-medium',
    background: '#f59e0b',
    ring: '#fde68a',
  },
  {
    id: 'bear-marker-low',
    background: '#22c55e',
    ring: '#bbf7d0',
  },
];

const BEAR_HEAD_COLOR = '#3b1d0a';

function createBearMarkerSvg(background: string, ring: string): string {
  return `
    <svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fill-rule="evenodd">
        <circle cx="80" cy="80" r="76" fill="${ring}" />
        <circle cx="80" cy="80" r="62" fill="${background}" />
        <circle cx="52" cy="48" r="18" fill="${background}" />
        <circle cx="108" cy="48" r="18" fill="${background}" />
        <path fill="${BEAR_HEAD_COLOR}" d="M48 98c0-26 18.5-48 32-48s32 22 32 48v12c0 15.464-12.536 28-28 28H76c-15.464 0-28-12.536-28-28V98z" />
        <circle cx="64" cy="90" r="7" fill="#f8fafc" fill-opacity="0.85" />
        <circle cx="96" cy="90" r="7" fill="#f8fafc" fill-opacity="0.85" />
        <circle cx="64" cy="90" r="3.5" fill="#0f172a" />
        <circle cx="96" cy="90" r="3.5" fill="#0f172a" />
        <path fill="#0f172a" d="M80 104c8.5 0 15 5.5 15 12H65c0-6.5 6.5-12 15-12z" />
        <path fill="${BEAR_HEAD_COLOR}" fill-opacity="0.85" d="M60 114c5.5 8.5 12.5 12.5 20 12.5S94.5 122.5 100 114c-7 3.5-13 4.5-20 4.5s-13-1-20-4.5z" />
        <circle cx="80" cy="118" r="6" fill="#0f172a" fill-opacity="0.45" />
      </g>
    </svg>
  `.trim();
}

function createMarkerDataUrl(background: string, ring: string): string {
  const svg = createBearMarkerSvg(background, ring);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function loadMarkerImages(map: mapboxgl.Map): Promise<void> {
  await Promise.all(
    MARKER_DEFINITIONS.map(
      (definition) =>
        new Promise<void>((resolve, reject) => {
          const url = createMarkerDataUrl(definition.background, definition.ring);
          map.loadImage(url, (error, image) => {
            if (error) {
              reject(error);
              return;
            }
            if (!image) {
              reject(new Error('クママーカーの画像生成に失敗しました'));
              return;
            }
            if (map.hasImage(definition.id)) {
              map.removeImage(definition.id);
            }
            map.addImage(definition.id, image as HTMLImageElement | ImageBitmap, { pixelRatio: 2 });
            resolve();
          });
        }),
    ),
  );
}

function toGeoJson(reports: BearReport[]): BearFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: reports.map((report) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [report.longitude, report.latitude],
      },
      properties: {
        id: report.id,
        datetime: report.datetime,
        species: report.species,
        risk_level: report.risk_level,
      },
    })),
  } satisfies BearFeatureCollection;
}

export default function BearRiskMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const { season, hour } = useMapFilters();
  const [isTokenMissing] = useState(() => !clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || isTokenMissing) {
      return;
    }
    mapboxgl.accessToken = clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [139.6917, 35.6895],
      zoom: 4,
      attributionControl: true,
    });

    map.setMaxBounds(DEFAULT_BOUNDS);

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const handleLoad = () => {
      map.fitBounds(DEFAULT_BOUNDS, {
        padding: 48,
        duration: 0,
      });
      map.addSource('bearReports', {
        type: 'geojson',
        data: toGeoJson([]),
      });

      map.addLayer({
        id: 'bearHeatmap',
        type: 'heatmap',
        source: 'bearReports',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            [
              'match',
              ['get', 'risk_level'],
              '高',
              3,
              '中',
              2,
              '低',
              1,
              1,
            ],
            1,
            0.2,
            3,
            1,
          ],
          'heatmap-intensity': 0.8,
          'heatmap-radius': 40,
          'heatmap-opacity': 0.7,
        },
      });

      const setupMarkers = async () => {
        try {
          await loadMarkerImages(map);
        } catch (error) {
          console.error('[BearRiskMap] マーカー画像の読み込みに失敗しました', error);
        }
        if (!map.getLayer('bearMarkers')) {
          map.addLayer({
            id: 'bearMarkers',
            type: 'symbol',
            source: 'bearReports',
            layout: {
              'icon-image': [
                'match',
                ['get', 'risk_level'],
                '高',
                'bear-marker-high',
                '中',
                'bear-marker-medium',
                'bear-marker-low',
              ],
              'icon-size': 0.4,
              'icon-allow-overlap': true,
            },
          });
        }
      };

      void setupMarkers();

      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer';
      };
      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = '';
      };

      map.on('mouseenter', 'bearMarkers', handleMouseEnter);
      map.on('mouseleave', 'bearMarkers', handleMouseLeave);

      map.on('click', 'bearMarkers', (event) => {
        const feature = event.features?.[0];
        if (!feature) {
          return;
        }
        const coordinates = feature.geometry.type === 'Point' ? feature.geometry.coordinates : undefined;
        const properties = feature.properties as BearFeatureCollection['features'][number]['properties'];
        if (!coordinates) {
          return;
        }
        const { datetime, species, risk_level } = properties;
        const popupContent = `<div class="text-sm text-slate-700"><p class="font-semibold">${species}</p><p>${new Date(
          datetime,
        ).toLocaleString('ja-JP')}</p><p>リスク: ${risk_level}</p></div>`;
        if (!popupRef.current) {
          popupRef.current = new mapboxgl.Popup({ closeButton: true, closeOnClick: true });
        }
        popupRef.current
          .setLngLat(coordinates as mapboxgl.LngLatLike)
          .setHTML(popupContent)
          .addTo(map);
      });

      map.once('remove', () => {
        map.off('mouseenter', 'bearMarkers', handleMouseEnter);
        map.off('mouseleave', 'bearMarkers', handleMouseLeave);
      });
    };

    map.on('load', handleLoad);
    mapRef.current = map;

    return () => {
      map.off('load', handleLoad);
      map.remove();
      mapRef.current = null;
    };
  }, [isTokenMissing]);

  useEffect(() => {
    if (isTokenMissing) {
      return;
    }
    let isMounted = true;
    const loadData = async () => {
      try {
        const { reports } = await fetchBearReports({
          season: season === 'all' ? undefined : season,
          hour: hour ?? undefined,
        });
        if (!isMounted) {
          return;
        }
        const map = mapRef.current;
        if (map) {
          const source = map.getSource('bearReports') as mapboxgl.GeoJSONSource | undefined;
          if (source) {
            source.setData(toGeoJson(reports));
          }
        }
      } catch (error) {
        console.error('[BearRiskMap] データ取得に失敗しました', error);
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [season, hour, isTokenMissing]);

  if (isTokenMissing) {
    return (
      <div className="flex h-[480px] w-full items-center justify-center rounded-2xl border border-dashed border-brand-300 bg-brand-50 text-sm text-brand-700">
        Mapbox トークンが設定されていません。<code>NEXT_PUBLIC_MAPBOX_TOKEN</code> を環境変数に設定してください。
      </div>
    );
  }

  return <div ref={containerRef} className="h-[520px] w-full rounded-2xl border border-slate-200" />;
}
