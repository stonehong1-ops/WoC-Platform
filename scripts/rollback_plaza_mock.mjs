import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const CONFIRMED = process.argv.includes('--confirm');

async function rollback() {
  console.log("🚀 Starting Plaza Mock Data Rollback Process...\n");
  if (!CONFIRMED) {
    console.log('[DRY RUN] No documents will be deleted. Re-run with --confirm to actually delete.\n');
  }

  // Query all posts from feeds collection where userId starts with 'user_plaza_'
  const snapshot = await db.collection('feeds')
    .where('userId', '>=', 'user_plaza_')
    .where('userId', '<=', 'user_plaza_\uf8ff')
    .get();
    
  console.log(`🔍 Found ${snapshot.size} mock posts to delete.`);
  
  let deletedPostsCount = 0;
  let deletedCommentsCount = 0;
  
  for (const doc of snapshot.docs) {
    const postId = doc.id;
    console.log(`🧹 Processing Post ID: ${postId} (Author: ${doc.data().userName})`);
    
    // 1. Delete all comments under this post
    const commentsSnapshot = await db.collection(`feeds/${postId}/comments`).get();
    if (commentsSnapshot.size > 0) {
      if (CONFIRMED) {
        const batch = db.batch();
        commentsSnapshot.docs.forEach(cDoc => {
          batch.delete(cDoc.ref);
          deletedCommentsCount++;
        });
        await batch.commit();
        console.log(`   - Deleted ${commentsSnapshot.size} sub-comments.`);
      } else {
        deletedCommentsCount += commentsSnapshot.size;
        console.log(`   - [DRY RUN] Would delete ${commentsSnapshot.size} sub-comments.`);
      }
    }

    // 2. Delete the post itself
    if (CONFIRMED) {
      await doc.ref.delete();
    } else {
      console.log(`   - [DRY RUN] Would delete post ${postId}.`);
    }
    deletedPostsCount++;
  }

  console.log(CONFIRMED ? `\n✅ Rollback completed successfully!` : `\n✅ Dry run complete. No data was changed.`);
  console.log(`- ${CONFIRMED ? 'Deleted' : 'Matched'} Posts: ${deletedPostsCount}`);
  console.log(`- ${CONFIRMED ? 'Deleted' : 'Matched'} Comments/Replies: ${deletedCommentsCount}`);
  if (!CONFIRMED && deletedPostsCount > 0) {
    console.log('Run again with --confirm to actually delete these documents.');
  }
}

rollback().catch(err => {
  console.error("❌ Error during rollback:", err);
});
