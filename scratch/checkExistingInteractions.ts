import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({ 
    credential: admin.credential.applicationDefault(),
    projectId: 'woc-platform-seoul-1234'
  });
}

const db = admin.firestore();
const GROUP_ID = 'rglqeyjDHzzhbUwuim5O';

async function check() {
  console.log('=== Checking Freestyle Group Interactions ===\n');

  // 1. Get members
  const membersSnap = await db.collection('groups').doc(GROUP_ID).collection('members').get();
  const memberIds = new Set(membersSnap.docs.map(d => d.id));
  console.log(`[Members] Found ${memberIds.size} users in members subcollection.`);

  // 2. Get class applicants
  const classRegsSnap = await db.collection('class_registrations').where('groupId', '==', GROUP_ID).get();
  const applicantIds = new Set(classRegsSnap.docs.map(d => d.data().userId).filter(Boolean));
  console.log(`[Applicants] Found ${applicantIds.size} unique users who applied for classes.`);

  // 3. Get photo uploaders (posts with image)
  const postsSnap = await db.collection('groups').doc(GROUP_ID).collection('posts').get();
  const photoUploaderIds = new Set(
    postsSnap.docs
      .filter(d => !!d.data().image)
      .map(d => d.data().authorId)
      .filter(Boolean)
  );
  console.log(`[Uploaders] Found ${photoUploaderIds.size} unique users who uploaded photos.`);

  // Combine all interactive users
  const interactiveUsers = new Set(Array.from(applicantIds).concat(Array.from(photoUploaderIds)));

  console.log('\n--- Checking Data Consistency for Interacted Users ---');
  let issues = 0;
  for (const uid of Array.from(interactiveUsers)) {
    let issueStr = `User ${uid}: `;
    let hasIssue = false;

    // Check if in members subcollection
    if (!memberIds.has(uid)) {
      issueStr += 'Missing in members subcollection. ';
      hasIssue = true;
    }

    // Check if in joinedGroups
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      issueStr += 'User document missing. ';
      hasIssue = true;
    } else {
      const userData = userDoc.data() || {};
      const joinedGroups = userData.joinedGroups || [];
      if (!joinedGroups.includes(GROUP_ID)) {
        issueStr += 'Missing in joinedGroups array. ';
        hasIssue = true;
      }
    }

    if (hasIssue) {
      console.log(issueStr);
      issues++;
    }
  }

  if (issues === 0) {
    console.log('All class applicants and photo uploaders are correctly synced as group members!');
  } else {
    console.log(`\nFound ${issues} users with consistency issues.`);
  }

  // 4. Quick check on memberCount vs memberIds length
  const groupDoc = await db.collection('groups').doc(GROUP_ID).get();
  const groupData = groupDoc.data() || {};
  const memberIdsArray = groupData.memberIds || [];
  console.log(`\n[Group Meta] memberCount: ${groupData.memberCount}, memberIds length: ${memberIdsArray.length}`);
}

check().catch(console.error);

