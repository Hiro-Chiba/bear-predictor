import { query } from './client';

export interface RecentStats {
  readonly totalReports: number;
  readonly highRiskReports: number;
  readonly averageLatitude: number | null;
  readonly averageLongitude: number | null;
}

export async function fetchRecentStats(days: number) {
  const text = `
    SELECT
      COUNT(*)::int AS total_reports,
      COUNT(*) FILTER (WHERE risk_level = '高')::int AS high_risk_reports,
      AVG(latitude) AS average_latitude,
      AVG(longitude) AS average_longitude
    FROM bear_reports
    WHERE datetime >= NOW() - ($1 || ' days')::interval;
  `;
  const result = await query<{
    total_reports: number;
    high_risk_reports: number;
    average_latitude: number | null;
    average_longitude: number | null;
  }>(text, [days]);
  const row = result.rows[0];
  return {
    totalReports: row?.total_reports ?? 0,
    highRiskReports: row?.high_risk_reports ?? 0,
    averageLatitude: row?.average_latitude ?? null,
    averageLongitude: row?.average_longitude ?? null,
  } satisfies RecentStats;
}
