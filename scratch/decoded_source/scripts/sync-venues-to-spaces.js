
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (assuming local credentials or default)
// For local environment, we might need a service account key or use default if logged in via CLI
// Since I'm an agent, I'll assume the environment is set up.
// Actually, it's safer to use the service account if available, but I'll try to use the environment first.

const app = initializeApp({
  projectId: 'woc-platform-seoul-1234'
});
const db = getFirestore(app);

const USER_UID = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';
const SYSTEM_UID = 'system1';

async function syncVenuesToSpaces() {
  console.log('Starting sync process...');

  const venuesSnapshot = await db.collection('venues').get();
  const communitiesSnapshot = await db.collection('communities').get();

  const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const communities = communitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log(`Found ${venues.length} venues and ${communities.length} communities.`);

  for (const venue of venues) {
    const existingCommunity = communities.find(c => c.venueId === venue.id);
    
    const isFreestyleTango = venue.name === 'Freestyle' || venue.nameKo === '프리스타일' || venue.name === 'Freestyle Tango';
    const targetOwner = isFreestyleTango ? USER_UID : SYSTEM_UID;

    const generateId = (name) => {
        return name.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_]+/g, '-')
          .trim();
    };

    const communityData = {
      name: venue.name,
      description: `${venue.address} ${venue.detailAddress || ''}에 위치한 탱고 ${venue.category === 'Studio' ? '스튜디오' : venue.category === 'Shop' ? '샵' : '공간'}입니다.`,
      ownerId: targetOwner,
      venueId: venue.id,
      memberCount: 0,
      coverImage: 'https://images.unsplash.com/photo-1545041041-893f3c306263?q=80&w=2000&auto=format&fit=crop'
    };

    if (existingCommunity) {
      // Update owner if incorrect
      if (existingCommunity.ownerId !== targetOwner) {
        console.log(`Updating owner for community: ${existingCommunity.name} (${existingCommunity.id}) -> ${targetOwner}`);
        await db.collection('communities').doc(existingCommunity.id).update({ ownerId: targetOwner });
      }
    } else {
      // Create new community
      const id = generateId(venue.name);
      console.log(`Creating new community for venue: ${venue.name} (${venue.id}) with ID: ${id}`);
      
      // Check if ID already exists as a document ID
      let finalId = id;
      const docCheck = await db.collection('communities').doc(finalId).get();
      if (docCheck.exists) {
          finalId = `${id}-${venue.id.substring(0, 5)}`;
      }

      await db.collection('communities').doc(finalId).set(communityData);
    }
  }

  console.log('Sync process completed.');
}

syncVenuesToSpaces().catch(console.error);
