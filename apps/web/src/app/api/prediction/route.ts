import { NextResponse } from 'next/server';
import { z } from 'zod';
import { predictBearRisk } from '@/lib/model/predict';

const requestSchema = z.object({
  datetime: z.string().datetime(),
  latitude: z.number().min(35).max(45),
  longitude: z.number().min(135).max(145),
});

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
    const result = await predictBearRisk(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[prediction][POST] 推論に失敗しました', error);
    return NextResponse.json({ message: '予測に失敗しました' }, { status: 500 });
  }
}
