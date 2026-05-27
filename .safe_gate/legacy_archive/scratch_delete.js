// 이 스크립트는 Firebase Admin SDK를 사용하여 5건의 실 데이터를 보호하고, 나머지 16건의 가라 예약 및 관련 채팅 카드를 일괄 영구 삭제하는 관리 스크립트입니다.
const admin = require('firebase-admin');
const path = require('path');

// 서비스 계정 키 파일 경로 지정
const serviceAccountPath = path.join(__dirname, 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();

// 100% 안전하게 보호할 진짜 실 데이터 5건의 Booking ID
const protectedBookingIds = [
  '40SlXRQjs9MPyPOrGEnj', // Jeonikyong (CL-2026-DENM9F, ₩180,000)
  'GqyVnZqeNMNd3wdnZRl7', // Rose (CL-2026-IPRUFR, ₩180,000)
  'M9n4gxZ0FzX4bsdowrGQ', // Ajji (CL-2026-EZ9R4I, ₩180,000)
  '83iTYsRaDY8p8VGbHM38', // Silloan (CL-2026-HQUSRY, ₩180,000)
  'Gt9Euzpl1q3ZHDWnKC10'  // Chaos (CL-2026-4M54AJ, ₩180,000)
];

async function main() {
  console.log("=== STARTING COMPREHENSIVE MOCK DATA DELETION ===");
  console.log(`Protected Real Data Count: ${protectedBookingIds.length}`);

  // 1. Fetch all bookings
  const bookingsSnap = await db.collection('bookings').get();
  console.log(`Total bookings in collection before deletion: ${bookingsSnap.size}`);

  const deleteQueue = [];
  const protectedQueue = [];

  bookingsSnap.forEach(doc => {
    const id = doc.id;
    const data = doc.data();
    if (protectedBookingIds.includes(id)) {
      protectedQueue.push({ id, ...data });
    } else {
      deleteQueue.push({ id, ...data });
    }
  });

  console.log(`\nFound ${deleteQueue.length} mock bookings to delete.`);
  console.log(`Found ${protectedQueue.length} real bookings to protect.`);

  // 2-중 검증: 보호 대상이 실제로 다 있는지 확인
  if (protectedQueue.length !== protectedBookingIds.length) {
    console.warn(`WARNING: Only found ${protectedQueue.length} out of ${protectedBookingIds.length} protected bookings!`);
  }

  // 2. Start deleting mock bookings and associated chat messages
  let bookingsDeleted = 0;
  let chatMessagesDeleted = 0;

  // 전체 chat_messages 컬렉션을 메모리에 패치하여 매칭 성능 향상
  console.log("\nFetching chat messages for analysis...");
  const chatSnap = await db.collection('chat_messages').get();
  console.log(`Total chat messages in collection: ${chatSnap.size}`);

  for (const mockBooking of deleteQueue) {
    const bookingId = mockBooking.id;
    const orderNumber = mockBooking.orderNumber || mockBooking.id || 'N/A';
    const buyerNickname = mockBooking.buyerNickname || 'N/A';
    const itemName = mockBooking.itemName || 'N/A';

    console.log(`\n- Deleting Booking: ID=${bookingId}, Order=${orderNumber}, Buyer=${buyerNickname}, Item=${itemName}`);
    
    // A. Delete booking document
    await db.collection('bookings').doc(bookingId).delete();
    bookingsDeleted++;
    console.log(`  -> Deleted booking document.`);

    // B. Find and delete associated chat cards
    for (const chatDoc of chatSnap.docs) {
      const chatData = chatDoc.data();
      const metadata = chatData.metadata || {};
      const bookingIdInMeta = metadata.bookingId || '';

      if (bookingIdInMeta === bookingId) {
        console.log(`  -> Found associated chat message: DocID=${chatDoc.id}, Text="${chatData.text || ''}"`);
        await db.collection('chat_messages').doc(chatDoc.id).delete();
        chatMessagesDeleted++;
        console.log(`    -> Deleted chat message document.`);
      }
    }
  }

  console.log("\n========================================");
  console.log("=== DELETION WORK SUMMARY ===");
  console.log(`- Total Bookings Deleted: ${bookingsDeleted}`);
  console.log(`- Total Chat Messages Deleted: ${chatMessagesDeleted}`);
  console.log("========================================");

  // 3. Final Verification
  const finalBookingsSnap = await db.collection('bookings').get();
  console.log(`\nTotal bookings in collection after deletion: ${finalBookingsSnap.size}`);
  
  console.log("\n=== REMAINDER LIVE BOOKINGS (MUST BE EXACTLY 5 REAL DATA) ===");
  finalBookingsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- Live ID: ${doc.id}, Order: ${data.orderNumber}, Buyer: ${data.buyerNickname || 'N/A'}, Item: ${data.itemName}, Status: ${data.status}`);
  });

  if (finalBookingsSnap.size === 5) {
    console.log("\n[VERIFICATION SUCCESS] Exactly 5 real bookings remain in the database!");
  } else {
    console.error(`\n[VERIFICATION ERROR] Expected 5 bookings but found ${finalBookingsSnap.size}!`);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Critical error in comprehensive deletion:", e);
  process.exit(1);
});
