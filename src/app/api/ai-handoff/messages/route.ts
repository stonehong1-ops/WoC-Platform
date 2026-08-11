import { NextResponse } from 'next/server';
import { AiHandoffApiError, getMessages, verifyAiHandoffSecret } from '@/lib/server/aiHandoffAdmin';

export async function GET(request: Request) {
  try {
    verifyAiHandoffSecret(request);

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const after = url.searchParams.get('after') || undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const messages = await getMessages({ limit, after });
    return NextResponse.json({ messages });
  } catch (err: any) {
    if (err instanceof AiHandoffApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[ai-handoff/messages] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
