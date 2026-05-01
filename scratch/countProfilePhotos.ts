import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({ 
    credential: admin.credential.applicationDefault(),
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();

async function countProfilePhotos() {
  const usersSnap = await db.collection('users').get();
  let photoCount = 0;
  
  usersSnap.forEach(doc => {
    const data = doc.data();
    // Usually it is photoURL, photoUrl, or profileImage
    if (data.photoURL || data.photoUrl || data.profileImage || data.profileImageUrl) {
      photoCount++;
    }
  });

  console.log(`[프로필 사진 등록자수] Profile Photo Uploaders: ${photoCount} / ${usersSnap.size}`);
}

countProfilePhotos().catch(console.error);
