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

const ADMIN_UIDS = ['7iaZAmaYY9dNNEShmJmROI8XrtH2'];

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const adminUid = decodedToken.uid;

    // Admin authorization check
    const db = admin.firestore();
    const adminDoc = await db.collection('users').doc(adminUid).get();
    const adminData = adminDoc.data();
    const isSystemAdmin = ADMIN_UIDS.includes(adminUid) || 
                          adminData?.systemRole === 'admin' || 
                          adminData?.isAdmin === true ||
                          decodedToken.email === 'stonehong1@gmail.com';

    if (!isSystemAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { targetUid, action, reason, reportId } = body; // action: 'suspend' | 'activate'

    if (!targetUid || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Step 1: Update Firestore user accountStatus (Idempotent)
    const newStatus = action === 'suspend' ? 'suspended' : 'active';
    await db.collection('users').doc(targetUid).update({
      accountStatus: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Step 2: Handle Firebase Auth (Idempotent & Safe against failures)
    try {
      if (action === 'suspend') {
        await admin.auth().updateUser(targetUid, { disabled: true });
        await admin.auth().revokeRefreshTokens(targetUid);
      } else {
        await admin.auth().updateUser(targetUid, { disabled: false });
      }
    } catch (authErr: any) {
      console.warn('Auth operation warnings (might already be suspended/activated):', authErr.message);
    }

    // Step 3: Record Audit Log (Idempotent)
    await db.collection('adminAuditLogs').add({
      adminUid,
      targetUid,
      action,
      reason: reason || 'Admin moderation action',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Step 4: Update report status if reportId is passed
    if (reportId) {
      await db.collection('reports').doc(reportId).update({
        status: action === 'suspend' ? 'actioned' : 'dismissed',
        actionedAt: admin.firestore.FieldValue.serverTimestamp(),
        actionedBy: adminUid
      });
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (error: any) {
    console.error('Moderation API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
