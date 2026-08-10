import admin from 'firebase-admin';
import fs from 'fs';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId.trim(),
          clientEmail: clientEmail.trim(),
          privateKey: privateKey.replace(/\\n/g, '\n').trim(),
        }),
      });
    } catch (error: any) {
      console.error('Firebase Admin 초기화 오류:', error.stack);
    }
  } else {
    const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } catch (error: any) {
        console.error('Firebase Admin 초기화 오류 (로컬 JSON):', error.stack);
      }
    } else {
      console.warn('Firebase Admin 환경 변수 및 로컬 JSON 파일이 누락되어 초기화를 건너뜁니다.');
    }
  }
}

export default admin;
