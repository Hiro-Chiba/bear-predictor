import { describe, expect, it } from 'vitest';
import { predictBearRisk } from '@/lib/model/predict';

describe('predictBearRisk', () => {
  it('季節と時間帯によって確率が変化する', async () => {
    const autumnMorning = await predictBearRisk({
      datetime: '2024-10-12T06:00:00Z',
      latitude: 39.9,
      longitude: 140.4,
    });
    const winterDaytime = await predictBearRisk({
      datetime: '2024-01-15T12:00:00Z',
      latitude: 39.4,
      longitude: 140.1,
    });

    expect(autumnMorning.probability).toBeGreaterThan(winterDaytime.probability);
    expect(['低', '中', '高']).toContain(autumnMorning.risk_level);
  });
});
