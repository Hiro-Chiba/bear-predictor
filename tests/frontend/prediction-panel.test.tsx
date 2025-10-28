import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PredictionPanel } from '@/components/prediction-panel';
import * as api from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  requestPrediction: vi.fn().mockResolvedValue({
    probability: 0.45,
    risk_level: '中',
    contributingFactors: ['テスト要因'],
  }),
}));

describe('PredictionPanel', () => {
  it('フォーム送信で予測結果を表示する', async () => {
    render(<PredictionPanel />);

    const submitButton = screen.getByRole('button', { name: 'リスクを計算' });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/予測出没確率/)).toBeInTheDocument();
    expect(screen.getByText(/テスト要因/)).toBeInTheDocument();
  });
});
