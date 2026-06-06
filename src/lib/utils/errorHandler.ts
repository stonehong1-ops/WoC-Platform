import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export interface ErrorLogEntry {
  id?: string;
  message: string;
  stack?: string;
  context: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp: Timestamp;
}

/**
 * 에러를 Firestore error_logs 컬렉션에 안전하게 기록하고 콘솔에 출력합니다.
 */
export async function reportError(error: unknown, context = 'unknown', userId?: string): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  let userAgent: string | undefined;
  let url: string | undefined;

  if (typeof window !== 'undefined') {
    userAgent = navigator.userAgent;
    url = window.location.href;
  }

  console.error(`[Error][${context}]: ${message}`, error);

  try {
    const logData: Omit<ErrorLogEntry, 'id'> = {
      message,
      stack,
      context,
      userId,
      userAgent,
      url,
      timestamp: Timestamp.now()
    };

    await addDoc(collection(db, 'error_logs'), logData);
  } catch (e) {
    console.error('Failed to log error to Firestore:', e);
  }
}

/**
 * 비동기 서비스 함수를 안전하게 감싸서 ServiceResult 형식을 리턴하고 에러를 Firestore에 로깅합니다.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context = 'unknown',
  userId?: string
): Promise<ServiceResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: any) {
    await reportError(error, context, userId);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred.',
      code: error.code
    };
  }
}
