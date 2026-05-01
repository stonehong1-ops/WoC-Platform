import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({ 
    credential: admin.credential.applicationDefault(),
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();

async function countStats() {
  console.log('=== Platform General Statistics ===\n');

  // 1. Total Platform Users
  const usersSnap = await db.collection('users').get();
  console.log(`[전체 가입자수] Total Registered Users: ${usersSnap.size}`);

  // 2. Total Class Applicants (Unique users across all class registrations)
  const classRegsSnap = await db.collection('class_registrations').get();
  const applicantIds = new Set();
  classRegsSnap.forEach(doc => {
    const data = doc.data();
    if (data.userId) applicantIds.add(data.userId);
  });
  console.log(`[전체 수업신청자수] Total Unique Class Applicants: ${applicantIds.size} (Total registrations: ${classRegsSnap.size})`);

  // 3. Freestyle Group Members
  const FREESTYLE_GROUP_ID = 'rglqeyjDHzzhbUwuim5O';
  const freestyleMembersSnap = await db.collection('groups').doc(FREESTYLE_GROUP_ID).collection('members').get();
  console.log(`[Freestyle 그룹 가입자수] Freestyle Group Members: ${freestyleMembersSnap.size}`);

  // 4. Photo Uploaders (Unique users who uploaded images in ANY group post)
  const groupsSnap = await db.collection('groups').get();
  const photoUploaderIds = new Set();
  let totalPostsWithImages = 0;

  for (const groupDoc of groupsSnap.docs) {
    const postsSnap = await groupDoc.ref.collection('posts').get();
    postsSnap.forEach(postDoc => {
      const postData = postDoc.data();
      if (postData.image || (postData.images && postData.images.length > 0)) {
        if (postData.authorId) {
          photoUploaderIds.add(postData.authorId);
        }
        totalPostsWithImages++;
      }
    });
  }
  
  console.log(`[사진 등록자수] Total Unique Photo Uploaders: ${photoUploaderIds.size} (Total photo posts: ${totalPostsWithImages})`);

  console.log('\n===================================\n');
}

countStats().catch(console.error);
