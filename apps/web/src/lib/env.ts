import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1, 'Mapbox トークンを設定してください'),
});

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url('PostgreSQL の接続URLを指定してください'),
  MODEL_ONNX_PATH: z.string().default('ml/artifacts/bear-risk.onnx'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function getValidatedEnv<T extends z.ZodTypeAny>(schema: T, env: Record<string, string | undefined>) {
  const result = schema.safeParse(env);
  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[env]', result.error.flatten().fieldErrors);
    } else {
      throw new Error(`環境変数の検証に失敗しました: ${result.error.message}`);
    }
  }
  return (result.success ? result.data : {}) as z.infer<T>;
}

export const clientEnv = getValidatedEnv(clientEnvSchema, {
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
});

export const serverEnv = getValidatedEnv(serverEnvSchema, {
  DATABASE_URL: process.env.DATABASE_URL,
  MODEL_ONNX_PATH: process.env.MODEL_ONNX_PATH,
});
