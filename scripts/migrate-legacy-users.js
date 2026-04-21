/**
 * migrate-legacy-users.js
 * Migrates users from freestyle-tango-seoul to woc-platform-seoul-1234.
 * Uses a local JSON file containing the legacy user data.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin for the target project
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'woc-platform-seoul-1234'
});

const db = admin.firestore();

// Path to the fetched legacy user data
const DATA_PATH = path.join('C:', 'Users', 'stone', '.gemini', 'antigravity', 'brain', '198c5f21-be48-41c4-850c-c04866c93693', '.system_generated', 'steps', '2795', 'output.txt');

async function migrate() {
  console.log('Starting migration...');
  
  if (!fs.existsSync(DATA_PATH)) {
    console.error('Data file not found at:', DATA_PATH);
    return;
  }

  const rawData = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(rawData);
  const users = data.documents || [];

  console.log(`Found ${users.length} users to migrate.`);

  const batch = db.batch();
  let count = 0;

  for (const user of users) {
    const fields = user.fields;
    const legacyPhone = fields.phone?.stringValue;
    
    if (!legacyPhone) continue;

    // Transform phone to international format: 010... -> +8210...
    const formattedPhone = legacyPhone.startsWith('0') 
      ? '+82' + legacyPhone.substring(1) 
      : legacyPhone;

    // 1. Prepare User Profile Data
    const profileRef = db.collection('users').doc(formattedPhone);
    const profileData = {
      nickname: fields.nickname?.stringValue || '',
      photoURL: fields.photoURL?.stringValue || '',
      phoneNumber: formattedPhone,
      legacyPhone: legacyPhone,
      role: fields.role?.stringValue || '',
      device: fields.device?.stringValue || '',
      isRegistered: false, // Pre-migrated
      createdAt: fields.createdAt?.timestampValue ? new Date(fields.createdAt.timestampValue) : admin.firestore.FieldValue.serverTimestamp(),
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      countryCode: 'KR'
    };

    // 2. Prepare Group Membership Data
    const membershipRef = db.collection('groups').doc('freestyle-tango').collection('members').doc(formattedPhone);
    const membershipData = {
      userId: formattedPhone, // Temporary ID (Phone)
      nickname: profileData.nickname,
      photoURL: profileData.photoURL,
      role: profileData.role,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    };

    batch.set(profileRef, profileData);
    batch.set(membershipRef, membershipData);
    
    count++;

    // Commit in batches of 400 (limit is 500)
    if (count % 200 === 0) {
      await batch.commit();
      console.log(`Committed ${count} users...`);
    }
  }

  if (count % 200 !== 0) {
    await batch.commit();
  }

  // 3. Update Group Metadata
  await db.collection('groups').doc('freestyle-tango').update({
    memberCount: count,
    members: admin.firestore.FieldValue.delete() // Remove legacy array field
  });

  console.log(`Migration complete! Total migrated: ${count}`);
}

migrate().catch(console.error);
