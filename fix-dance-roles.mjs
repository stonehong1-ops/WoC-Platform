import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('Starting bulk update for Dance Roles...');
  
  // 1. Update users collection
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  let userCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let newRole = null;
    
    if (data.gender === 'male') {
      newRole = 'leader';
    } else if (data.gender === 'female' || data.gender === 'others') {
      newRole = 'follower';
    } else if (data.gender) {
      newRole = 'follower';
    }
    
    // Also handle cases where gender is not set but we want to reset? The user said "based on male, female, others". If it's missing, maybe do nothing.
    
    if (newRole && data.role !== newRole) {
      await doc.ref.update({ role: newRole });
      userCount++;
      // console.log(`Updated user ${doc.id} to role: ${newRole}`);
    }
  }
  
  console.log(`Updated ${userCount} users.`);

  // 2. Update all members in all groups
  const groupsRef = db.collection('groups');
  const groupsSnapshot = await groupsRef.get();
  
  let memberCount = 0;
  for (const groupDoc of groupsSnapshot.docs) {
    const membersRef = groupDoc.ref.collection('members');
    const membersSnapshot = await membersRef.get();
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      
      const userDoc = await usersRef.doc(memberDoc.id).get();
      if (!userDoc.exists) continue;
      
      const userData = userDoc.data();
      let newRole = null;
      
      if (userData.gender === 'male') {
        newRole = 'leader';
      } else if (userData.gender === 'female' || userData.gender === 'others') {
        newRole = 'follower';
      } else if (userData.gender) {
        newRole = 'follower';
      }
      
      if (newRole && memberData.role !== newRole) {
        await memberDoc.ref.update({ role: newRole });
        memberCount++;
      }
    }
  }
  
  console.log(`Updated ${memberCount} members in groups.`);
  console.log('Done.');
}

run().catch(console.error);
