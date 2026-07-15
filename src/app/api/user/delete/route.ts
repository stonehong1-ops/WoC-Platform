import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
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
      console.error('Firebase Admin init error:', error.stack);
    }
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const db = admin.firestore();

    // 1. Delete people profiles where authorId === uid
    const peopleSnap = await db.collection('people').where('authorId', '==', uid).get();
    if (!peopleSnap.empty) {
      const batch = db.batch();
      peopleSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // 2. Delete posts where authorId === uid
    const postsSnap = await db.collection('posts').where('authorId', '==', uid).get();
    if (!postsSnap.empty) {
      const batch = db.batch();
      postsSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // 3. Delete blockedUsers subcollection documents
    const blockedUsersSnap = await db.collection('users').doc(uid).collection('blockedUsers').get();
    if (!blockedUsersSnap.empty) {
      const batch = db.batch();
      blockedUsersSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // 4. Delete the main user doc in users/{uid}
    await db.collection('users').doc(uid).delete();

    // 5. Delete Firebase Auth user
    try {
      await admin.auth().deleteUser(uid);
    } catch (authErr: any) {
      console.warn('Firebase Auth user deletion warning (might already be deleted):', authErr.message);
    }

    return NextResponse.json({ success: true, message: 'Account and associated data deleted successfully' });
  } catch (error: any) {
    console.error('Account Deletion API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
