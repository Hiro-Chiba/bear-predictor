import { access } from 'fs/promises';
import { basename } from 'path';
import type { InferenceSession, Tensor } from 'onnxruntime-node';
import { fetchRecentStats } from '@/lib/db/statistics';
import { serverEnv } from '@/lib/env';

let sessionPromise: Promise<InferenceSession | null> | null = null;

async function loadSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        await access(serverEnv.MODEL_ONNX_PATH);
        const ort = await import('onnxruntime-node');
        return await ort.InferenceSession.create(serverEnv.MODEL_ONNX_PATH);
      } catch (error) {
        console.warn('[predict] ONNX モデルを読み込めませんでした', error);
        return null;
      }
    })();
  }
  return sessionPromise;
}

interface PredictionInput {
  readonly datetime: string;
  readonly latitude: number;
  readonly longitude: number;
}

interface PredictionResult {
  readonly probability: number;
  readonly risk_level: '低' | '中' | '高';
  readonly contributingFactors: string[];
}

function riskLevel(probability: number): PredictionResult['risk_level'] {
  if (probability >= 0.66) {
    return '高';
  }
  if (probability >= 0.33) {
    return '中';
  }
  return '低';
}

function clampProbability(value: number) {
  return Math.min(0.99, Math.max(0.01, value));
}

function buildFallbackPrediction(input: PredictionInput, stats: Awaited<ReturnType<typeof fetchRecentStats>>) {
  const { latitude, longitude, datetime } = input;
  const date = new Date(datetime);
  const month = date.getUTCMonth() + 1;
  const hour = date.getUTCHours();
  let probability = 0.12;
  const contributingFactors: string[] = [];

  if ([9, 10, 11].includes(month)) {
    probability += 0.28;
    contributingFactors.push('秋季は餌資源を求めて活動が活発化');
  } else if ([4, 5].includes(month)) {
    probability += 0.18;
    contributingFactors.push('春季の活動再開期');
  }

  if (hour >= 4 && hour <= 8) {
    probability += 0.12;
    contributingFactors.push('早朝の活動ピーク時間帯');
  }
  if (hour >= 17 && hour <= 21) {
    probability += 0.1;
    contributingFactors.push('夕暮れ時の回遊が多い時間帯');
  }

  if (stats.totalReports > 50) {
    probability += 0.18;
    contributingFactors.push(`直近${stats.totalReports}件の出没履歴`);
  } else if (stats.totalReports > 20) {
    probability += 0.12;
    contributingFactors.push('直近の出没が増加');
  }

  if (stats.highRiskReports > 5) {
    probability += 0.08;
    contributingFactors.push('高リスクレポートが集中');
  }

  if (latitude > 39.7 && longitude > 140.2) {
    probability += 0.08;
    contributingFactors.push('北東部の山間地域に近接');
  }

  const finalProbability = clampProbability(probability);
  if (contributingFactors.length === 0) {
    contributingFactors.push('活動履歴が少なく、基礎リスクのみ適用');
  }
  return {
    probability: finalProbability,
    risk_level: riskLevel(finalProbability),
    contributingFactors,
  } satisfies PredictionResult;
}

export async function predictBearRisk(input: PredictionInput): Promise<PredictionResult> {
  const stats = await fetchRecentStats(30).catch(() => ({
    totalReports: 0,
    highRiskReports: 0,
    averageLatitude: null,
    averageLongitude: null,
  }));

  const session = await loadSession();
  if (!session) {
    return buildFallbackPrediction(input, stats);
  }

  try {
    const date = new Date(input.datetime);
    const featureVector = Float32Array.from([
      input.latitude,
      input.longitude,
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCHours(),
      stats.totalReports,
      stats.highRiskReports,
      stats.averageLatitude ?? input.latitude,
      stats.averageLongitude ?? input.longitude,
    ]);

    const ort = await import('onnxruntime-node');
    const tensor = new ort.Tensor('float32', featureVector, [1, featureVector.length]) as Tensor;
    const result = await session.run({ input: tensor });
    const output = result.probabilities ?? Object.values(result)[0];
    const array = Array.isArray(output)
      ? (output as number[])
      : (output.data as Float32Array | number[] | undefined);
    const probability = clampProbability(Array.from(array ?? [0.2])[0]);
    const base = buildFallbackPrediction(input, stats);
    return {
      probability,
      risk_level: riskLevel(probability),
      contributingFactors: [`ONNX モデル (${basename(serverEnv.MODEL_ONNX_PATH)}) の推論結果`].concat(
        base.contributingFactors,
      ),
    } satisfies PredictionResult;
  } catch (error) {
    console.error('[predict] ONNX 推論に失敗したためフォールバックを使用します', error);
    return buildFallbackPrediction(input, stats);
  }
}
