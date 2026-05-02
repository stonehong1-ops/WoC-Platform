import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim(),
      }),
    });
  } catch (error: any) {
    console.error('Firebase Admin 초기화 오류:', error.stack);
  }
}

export async function GET(request: Request) {
  try {
    const db = admin.firestore();
    
    // Fetch all venues
    const venuesSnapshot = await db.collection('venues').get();
    const venues = new Map();
    venuesSnapshot.forEach(doc => {
      const data = doc.data();
      venues.set(doc.id, {
        nameKo: data.nameKo,
        imageUrl: data.imageUrl,
      });
    });

    // Fetch all groups
    const groupsSnapshot = await db.collection('groups').get();
    const updates: any[] = [];
    
    // Process groups in batches of 500
    const batch = db.batch();
    let updateCount = 0;

    groupsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.venueId && venues.has(data.venueId)) {
        const venue = venues.get(data.venueId);
        
        // Update group with venue's imageUrl (to coverImage) and nameKo (to nativeName)
        const updateData: any = {};
        let needsUpdate = false;
        
        if (venue.imageUrl && data.coverImage !== venue.imageUrl) {
          updateData.coverImage = venue.imageUrl;
          needsUpdate = true;
        }
        if (venue.nameKo && data.nativeName !== venue.nameKo) {
          updateData.nativeName = venue.nameKo;
          needsUpdate = true;
        }

        if (needsUpdate) {
          batch.update(doc.ref, updateData);
          updates.push({ groupId: doc.id, ...updateData });
          updateCount++;
        }
      }
    });

    if (updateCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `${updateCount} groups updated successfully`,
      updates
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
