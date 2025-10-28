import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findBearReports, insertBearReport } from '@/lib/db/bear-reports';

const requestSchema = z.object({
  datetime: z.string().datetime(),
  latitude: z.number().min(35).max(45),
  longitude: z.number().min(135).max(145),
  species: z.string().min(1).max(120),
});

const querySchema = z.object({
  season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  hour: z
    .string()
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value >= 0 && value <= 23)
    .optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'クエリパラメータが不正です', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const reports = await findBearReports({ season: parsed.data.season, hour: parsed.data.hour });
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('[bear-reports][GET] データ取得に失敗しました', error);
    return NextResponse.json({ message: '出没データの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'リクエストボディが不正です', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await insertBearReport(parsed.data);
    return NextResponse.json({ message: 'レポートを登録しました', id: result.id }, { status: 201 });
  } catch (error) {
    console.error('[bear-reports][POST] 登録に失敗しました', error);
    return NextResponse.json({ message: 'レポートの登録に失敗しました' }, { status: 500 });
  }
}
