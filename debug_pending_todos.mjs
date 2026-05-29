import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.error('Service Account file not found!');
  process.exit(1);
}

const db = admin.firestore();

const userId = 'E4w5SqJ0nBTHfOkvj5yey6GpYbt2';

async function checkActualBookingStatus() {
  console.log('=== Checking Actual Booking Documents status for Stone Hong ===');
  
  const roomsSnap = await db.collection('chat_rooms')
    .where('participants', 'array-contains', userId)
    .get();
    
  const businessRooms = roomsSnap.docs.filter(doc => doc.data().type === 'business');
  
  for (const rDoc of businessRooms) {
    const rId = rDoc.id;
    const msgsSnap = await db.collection('chat_messages')
      .where('roomId', '==', rId)
      .get();
      
    for (const mDoc of msgsSnap.docs) {
      const mData = mDoc.data();
      if (mData.senderId === userId) continue;
      
      const meta = mData.metadata;
      if (!meta || !meta.bookingId) continue;
      
      if (meta.actionType === 'booking_approval' && 
          (meta.status === 'BANK_TRANSFERRED' || meta.status === 'SUBMITTED')) {
        
        const bookingRef = db.collection('bookings').doc(meta.bookingId);
        const bookingSnap = await bookingRef.get();
        
        if (bookingSnap.exists) {
          const bData = bookingSnap.data();
          console.log(`Msg ID: ${mDoc.id} in Room: ${rId}`);
          console.log(`  - Msg Meta Status: "${meta.status}"`);
          console.log(`  - Actual Booking ID: "${meta.bookingId}"`);
          console.log(`  - Actual Booking Status: "${bData.status}"`);
          console.log(`  - Buyer: "${bData.buyerName || bData.buyerId}"`);
        } else {
          console.log(`Msg ID: ${mDoc.id} in Room: ${rId} - Actual Booking Doc NOT found in 'bookings' for ID: ${meta.bookingId}`);
        }
      }
    }
  }

  process.exit(0);
}

checkActualBookingStatus().catch(err => {
  console.error(err);
  process.exit(1);
});
