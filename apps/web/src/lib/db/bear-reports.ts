import type { BearReport } from '@/types/bear';
import { query } from './client';

interface BearReportRow {
  readonly id: number;
  readonly datetime: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly species: string;
  readonly risk_level: '低' | '中' | '高';
  readonly created_at: string;
}

function toBearReport(row: BearReportRow): BearReport {
  return {
    id: row.id,
    datetime: row.datetime,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    species: row.species,
    risk_level: row.risk_level,
    created_at: row.created_at,
  } satisfies BearReport;
}

export async function insertBearReport(report: {
  readonly datetime: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly species: string;
}) {
  const text = `
    INSERT INTO bear_reports (datetime, latitude, longitude, species, risk_level)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `;
  const risk = classifyRisk({ latitude: report.latitude, longitude: report.longitude });
  const result = await query<{ id: number }>(text, [
    report.datetime,
    report.latitude,
    report.longitude,
    report.species,
    risk,
  ]);
  return result.rows[0];
}

export async function findBearReports(params: { readonly season?: string; readonly hour?: number }) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.season) {
    const monthCondition = seasonToMonths(params.season);
    if (monthCondition) {
      conditions.push(`EXTRACT(MONTH FROM datetime) = ANY($${values.length + 1})`);
      values.push(monthCondition);
    }
  }
  if (typeof params.hour === 'number') {
    conditions.push('EXTRACT(HOUR FROM datetime) = $' + (values.length + 1));
    values.push(params.hour);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const text = `
    SELECT id, datetime, latitude, longitude, species, risk_level, created_at
    FROM bear_reports
    ${whereClause}
    ORDER BY datetime DESC
    LIMIT 200;
  `;
  const result = await query<BearReportRow>(text, values);
  return result.rows.map(toBearReport);
}

function classifyRisk(coords: { readonly latitude: number; readonly longitude: number }): '低' | '中' | '高' {
  if (coords.latitude > 40 || coords.longitude > 140.5) {
    return '高';
  }
  if (coords.latitude > 39.5) {
    return '中';
  }
  return '低';
}

function seasonToMonths(season: string): number[] | null {
  switch (season) {
    case 'spring':
      return [3, 4, 5];
    case 'summer':
      return [6, 7, 8];
    case 'autumn':
      return [9, 10, 11];
    case 'winter':
      return [12, 1, 2];
    default:
      return null;
  }
}
