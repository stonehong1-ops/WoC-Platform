import { NextResponse } from 'next/server';
import { AiHandoffApiError, getLatestReport, verifyAiHandoffSecret } from '@/lib/server/aiHandoffAdmin';

export async function GET(request: Request) {
  try {
    verifyAiHandoffSecret(request);

    const report = await getLatestReport();
    return NextResponse.json({ report });
  } catch (err: any) {
    if (err instanceof AiHandoffApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[ai-handoff/latest-report] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
