import { NextResponse } from 'next/server';
import { AiHandoffApiError, checkRateLimit, createTask, verifyAiHandoffSecret } from '@/lib/server/aiHandoffAdmin';

const MAX_BODY_BYTES = 20_000;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10분

export async function POST(request: Request) {
  try {
    verifyAiHandoffSecret(request);

    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let body: any;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    await checkRateLimit('task-create', RATE_LIMIT, RATE_WINDOW_MS);

    const task = await createTask({
      assignee: body.assignee,
      title: body.title,
      content: body.content,
      scope: body.scope,
      clientRequestId: body.clientRequestId,
    });

    return NextResponse.json({ task }, { status: task.idempotentReplay ? 200 : 201 });
  } catch (err: any) {
    if (err instanceof AiHandoffApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[ai-handoff/task] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
