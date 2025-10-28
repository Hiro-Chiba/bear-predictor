import { Pool } from '@neondatabase/serverless';
import { serverEnv } from '@/lib/env';

let pool: Pool | null = null;

export interface QueryResult<T> {
  rows: T[];
}

export function getPool() {
  if (!pool) {
    if (!serverEnv.DATABASE_URL) {
      throw new Error('DATABASE_URL が設定されていません');
    }
    pool = new Pool({ connectionString: serverEnv.DATABASE_URL });
  }
  return pool;
}

export async function query<T>(text: string, params: readonly unknown[] = []) {
  const client = getPool();
  const result = await client.query<T>(text, params);
  return result as unknown as QueryResult<T>;
}
