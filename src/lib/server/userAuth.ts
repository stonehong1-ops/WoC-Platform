import admin from './firebaseAdmin';

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Authorization: Bearer <idToken> 헤더를 검증하고 로그인한 사용자의 uid를 반환한다.
 * 관리자 여부는 확인하지 않는다 (일반 로그인 사용자용 API 보호용).
 * 실패 시 AuthError를 throw하며, 라우트에서는 이를 잡아 상태코드와 메시지를 그대로 응답하면 된다.
 */
export async function requireUser(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError(401, 'Unauthorized: Missing token');
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken.uid;
}
