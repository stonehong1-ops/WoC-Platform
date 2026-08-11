import crypto from 'crypto';
import admin from './firebaseAdmin';
import { AIHandoffAssignee, AIHandoffScope } from '@/types/aiHandoff';

const COLLECTION = 'aiHandoffMessages';
const RATE_LIMIT_COLLECTION = 'aiHandoffRateLimits';

const VALID_ASSIGNEES: AIHandoffAssignee[] = ['CLAUDE_MAIN', 'CLAUDE_SUB'];

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 8000;
const MAX_SCOPE_ITEMS = 50;
const MAX_LIST_LIMIT = 200;
const DEFAULT_LIST_LIMIT = 50;

export class AiHandoffApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Authorization: Bearer <AI_HANDOFF_API_SECRET> 검증. timing-safe 비교.
 * secret은 서버 env var에만 존재 — Firestore/클라이언트 번들/로그에 절대 노출하지 않는다.
 */
export function verifyAiHandoffSecret(request: Request): void {
  const secret = process.env.AI_HANDOFF_API_SECRET;
  if (!secret) {
    throw new AiHandoffApiError(500, 'Server misconfigured');
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AiHandoffApiError(401, 'Unauthorized');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);

  const isValid =
    tokenBuf.length === secretBuf.length &&
    crypto.timingSafeEqual(tokenBuf, secretBuf);

  if (!isValid) {
    throw new AiHandoffApiError(401, 'Unauthorized');
  }
}

/**
 * Firestore 기반 rate limit — serverless(Vercel)에서 인스턴스 간에도 실제로 유효하게 동작한다
 * (in-memory Map은 콜드스타트/멀티 인스턴스 환경에서 무의미하므로 사용하지 않음).
 * 완벽한 분산락은 아니며, 트랜잭션 기반의 best-effort 카운터다.
 */
export async function checkRateLimit(bucket: string, limit: number, windowMs: number): Promise<void> {
  const db = admin.firestore();
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(bucket);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() as { windowStart: number; count: number }) : null;

    if (!data || now - data.windowStart > windowMs) {
      tx.set(ref, { windowStart: now, count: 1 });
      return;
    }

    if (data.count >= limit) {
      throw new AiHandoffApiError(429, `Rate limit exceeded (${limit} / ${Math.round(windowMs / 1000)}s)`);
    }

    tx.update(ref, { count: admin.firestore.FieldValue.increment(1) });
  });
}

function newTaskId(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const rand = Math.random().toString(36).slice(2, 6);
  return `WOC-${stamp}-${rand}`;
}

export interface GetMessagesInput {
  limit?: number;
  after?: string;
}

export async function getMessages({ limit, after }: GetMessagesInput) {
  const cappedLimit = Math.min(Math.max(limit || DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);
  const db = admin.firestore();

  let q = db.collection(COLLECTION).orderBy('createdAt', 'asc') as FirebaseFirestore.Query;

  if (after) {
    const afterDate = new Date(after);
    if (!isNaN(afterDate.getTime())) {
      q = q.where('createdAt', '>', afterDate as any);
    }
  }

  const snap = await q.limit(cappedLimit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getLatestReport() {
  const db = admin.firestore();
  const snap = await db
    .collection(COLLECTION)
    .where('type', '==', 'AI_REPORT')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export interface CreateTaskInput {
  assignee: unknown;
  title?: unknown;
  content?: unknown;
  scope?: { files?: unknown; directories?: unknown };
  clientRequestId?: unknown;
}

/**
 * TASK 생성 — from/status/claimedBy/createdAt은 항상 서버가 강제하며 입력값은 전부 무시한다.
 * clientRequestId가 이미 존재하면 새로 만들지 않고 기존 TASK를 그대로 반환한다(idempotent).
 */
export async function createTask(input: CreateTaskInput) {
  const assignee = input.assignee;
  if (typeof assignee !== 'string' || !VALID_ASSIGNEES.includes(assignee as AIHandoffAssignee)) {
    throw new AiHandoffApiError(400, `assignee must be one of: ${VALID_ASSIGNEES.join(', ')}`);
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const content = typeof input.content === 'string' ? input.content.trim() : '';

  if (!title && !content) {
    throw new AiHandoffApiError(400, 'title or content is required');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new AiHandoffApiError(400, `title exceeds ${MAX_TITLE_LENGTH} characters`);
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new AiHandoffApiError(400, `content exceeds ${MAX_CONTENT_LENGTH} characters`);
  }

  const scopeFiles = Array.isArray(input.scope?.files)
    ? (input.scope!.files as unknown[]).filter((f) => typeof f === 'string').slice(0, MAX_SCOPE_ITEMS)
    : [];
  const scopeDirs = Array.isArray(input.scope?.directories)
    ? (input.scope!.directories as unknown[]).filter((f) => typeof f === 'string').slice(0, MAX_SCOPE_ITEMS)
    : [];
  const scope: AIHandoffScope = { files: scopeFiles as string[], directories: scopeDirs as string[] };

  const clientRequestId = typeof input.clientRequestId === 'string' && input.clientRequestId.trim()
    ? input.clientRequestId.trim().slice(0, 200)
    : undefined;

  const db = admin.firestore();

  if (clientRequestId) {
    const existing = await db
      .collection(COLLECTION)
      .where('clientRequestId', '==', clientRequestId)
      .where('type', '==', 'AI_TASK')
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      return { id: doc.id, ...doc.data(), idempotentReplay: true };
    }
  }

  const taskId = newTaskId();
  const doc: Record<string, unknown> = {
    type: 'AI_TASK',
    taskId,
    from: 'GPT',
    assignee,
    status: 'READY',
    title,
    content,
    scope,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (clientRequestId) doc.clientRequestId = clientRequestId;

  const ref = await db.collection(COLLECTION).add(doc);
  return { id: ref.id, ...doc, idempotentReplay: false };
}
