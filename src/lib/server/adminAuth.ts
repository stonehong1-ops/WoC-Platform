import admin from './firebaseAdmin';

// api/admin/moderation/route.ts와 동일한 관리자 판별 기준
const ADMIN_UIDS = ['7iaZAmaYY9dNNEShmJmROI8XrtH2'];

export class AdminAuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Authorization: Bearer <idToken> 헤더를 검증하고 관리자 권한을 확인한다.
 * 실패 시 AdminAuthError를 throw하며, 라우트에서는 이를 잡아 상태코드와 메시지를 그대로 응답하면 된다.
 */
export async function requireAdmin(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AdminAuthError(401, 'Unauthorized: Missing token');
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  const uid = decodedToken.uid;

  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();
  const isSystemAdmin =
    ADMIN_UIDS.includes(uid) ||
    userData?.systemRole === 'admin' ||
    userData?.isAdmin === true ||
    decodedToken.email === 'stonehong1@gmail.com';

  if (!isSystemAdmin) {
    throw new AdminAuthError(403, 'Forbidden: Admin access required');
  }

  return uid;
}
