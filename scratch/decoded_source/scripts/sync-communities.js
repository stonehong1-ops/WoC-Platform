const admin = require('firebase-admin');

// Initialize with application default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();

const USER_ID = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';
const SYSTEM_ID = 'system1';

async function sync() {
  console.log('Fetching venues and communities...');
  const venuesSnapshot = await db.collection('venues').get();
  const communitiesSnapshot = await db.collection('communities').get();
  
  const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const communities = communitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${venues.length} venues and ${communities.length} communities.`);

  for (const venue of venues) {
    // Find community linked to this venueId
    let community = communities.find(c => c.venueId === venue.id);
    
    // If not found by venueId, try finding by name (slugified comparison)
    if (!community) {
      const venueSlug = venue.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
      community = communities.find(c => c.id === venueSlug || (c.name && c.name.toLowerCase() === venue.name.toLowerCase()));
    }
    
    // Ownership rule
    const isFreestyle = venue.name.includes('Freestyle') || venue.nameKo === '프리스타일';
    const ownerId = isFreestyle ? USER_ID : SYSTEM_ID;

    if (community) {
      // Update existing
      await db.collection('communities').doc(community.id).update({
        venueId: venue.id,
        ownerId: ownerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[UPDATE] Community: ${community.id} | Venue: ${venue.name} | Owner: ${ownerId}`);
    } else {
      // Create new
      let docId = venue.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
      if (!docId) docId = venue.id;
      
      // Check if docId already exists (to avoid collision)
      const existingDoc = await db.collection('communities').doc(docId).get();
      if (existingDoc.exists) {
        docId = `${docId}-${venue.id.substring(0, 4)}`;
      }

      const typeKo = venue.category === 'Studio' ? '스튜디오' : venue.category === 'Club' ? '클럽' : venue.category === 'Shop' ? '숍' : venue.category === 'Stay' ? '스테이' : '공간';
      
      await db.collection('communities').doc(docId).set({
        name: venue.name,
        description: `${venue.address} ${venue.detailAddress || ''}에 위치한 탱고 ${typeKo}입니다.`,
        coverImage: 'https://images.unsplash.com/photo-1545041041-893f3c306263?q=80&w=2000&auto=format&fit=crop',
        memberCount: 0,
        venueId: venue.id,
        ownerId: ownerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[CREATE] Community: ${docId} | Venue: ${venue.name} | Owner: ${ownerId}`);
    }
  }
  
  // Special handling for the main 'freestyle-tango' community if it exists separately
  const mainFreestyle = await db.collection('communities').doc('freestyle-tango').get();
  if (mainFreestyle.exists) {
    await db.collection('communities').doc('freestyle-tango').update({
      ownerId: USER_ID,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`[SPECIAL] Ensured 'freestyle-tango' owner is ${USER_ID}`);
  }
  
  console.log('Sync finished successfully.');
}

sync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
