import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seed() {
  try {
    console.log('Fetching groups...');
    const groupsQuery = db.collection('groups');
    const groupDocs = await groupsQuery.get();
    
    console.log(`Found ${groupDocs.size} groups. Updating rental settings and seeding spaces...`);
    
    let seededCount = 0;

    for (const groupDoc of groupDocs.docs) {
      const groupData = groupDoc.data();
      const groupId = groupDoc.id;
      
      console.log(`Processing group: ${groupId} - ${groupData.name}`);
      
      // Update group settings to enable rental
      await db.collection('groups').doc(groupId).update({
        'activeServices.rental': true,
        'rentalSettings': {
          isEnabled: true,
          basePrice: 15,
          description: groupData.description || 'A pleasant and spacious rental space.',
          rules: 'Cleaning up before leaving is mandatory. Please be careful not to damage equipment.',
          facilities: ['Full-length Mirror', 'Wi-Fi', 'AC/Heater'],
          operatingHours: {
            open: '00:00',
            close: '24:00',
            is24Hours: true
          }
        }
      });

      // Clear existing spaces for this group to avoid duplicates if we re-run
      const existingSpaces = await db.collection('rental_spaces').where('groupId', '==', groupId).get();
      for (const spaceDoc of existingSpaces.docs) {
        await db.collection('rental_spaces').doc(spaceDoc.id).delete();
      }

      // Create a rental space for the group
      const rentalData = {
        groupId: groupId,
        title: (groupData.name || 'Studio') + ' Rental',
        description: groupData.description || 'A comfortable multi-purpose space.',
        location: 'Seoul', 
        address: 'Gangnam-gu, Seoul',
        category: (groupData.tags || []).includes('Studio') ? 'Dance Studio' : 'Party Room',
        pricePerHour: 15,
        minHours: 1,
        facilities: ['Wi-Fi', 'AC/Heater', 'Bluetooth Speaker'],
        rules: 'Indoor shoes required. No food or drinks allowed.',
        hostId: groupData.ownerId || 'system_admin',
        images: [groupData.coverImage || 'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=600'],
        regularClasses: [],
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('rental_spaces').add(rentalData);
      seededCount++;
    }
    
    console.log(`Seeding complete! Updated ${seededCount} groups and created spaces.`);
  } catch (err) {
    console.error('Error during seeding:', err);
  }
}

seed();
