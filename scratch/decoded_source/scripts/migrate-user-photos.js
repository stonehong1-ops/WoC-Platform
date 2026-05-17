const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'woc-platform-seoul-1234',
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const ANONYMOUS_AVATAR_PATH = '/anonymous-user.png';
const NEW_BUCKET = 'woc-platform-seoul-1234.firebasestorage.app';

async function migrateUserPhotos() {
  console.log('Starting user photo migration...');

  const usersSnapshot = await db.collection('users').get();
  console.log(`Found ${usersSnapshot.size} total users.`);

  let migratedCount = 0;
  let anonymousCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const phoneNumber = userData.phoneNumber || doc.id;
    const photoURL = userData.photoURL;

    // 1. Handling empty photoURL -> Anonymous
    if (!photoURL || photoURL.trim() === '' || photoURL === '/anonymous-user.png') {
      if (photoURL !== ANONYMOUS_AVATAR_PATH) {
        console.log(`[Anonymous] Updating user ${phoneNumber}...`);
        await updatePhotoURL(doc.id, ANONYMOUS_AVATAR_PATH);
        anonymousCount++;
      } else {
        skippedCount++;
      }
      continue;
    }

    // 2. Handling legacy storage URLs
    if (photoURL.includes('firebasestorage.googleapis.com') && !photoURL.includes(NEW_BUCKET)) {
      console.log(`[Migration] Migrating photo for ${phoneNumber}: ${photoURL}`);
      try {
        const newURL = await copyPhotoToNewBucket(photoURL, phoneNumber);
        if (newURL) {
          await updatePhotoURL(doc.id, newURL);
          migratedCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error(`Error migrating photo for ${phoneNumber}:`, err.message);
        errorCount++;
      }
      continue;
    }

    skippedCount++;
  }

  console.log('\n--- Migration Results ---');
  console.log(`Migrated legacy photos: ${migratedCount}`);
  console.log(`Set anonymous avatars: ${anonymousCount}`);
  console.log(`Skipped (already OK/other): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('-------------------------\n');
}

async function copyPhotoToNewBucket(oldURL, phoneNumber) {
  try {
    const response = await fetch(oldURL);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine extension (default to jpg if unknown)
    let ext = 'jpg';
    if (oldURL.includes('.png')) ext = 'png';
    else if (oldURL.includes('.webp')) ext = 'webp';
    
    const destinationPath = `profiles/${phoneNumber}/profile.${ext}`;
    const file = bucket.file(destinationPath);
    
    await file.save(buffer, {
      metadata: {
        contentType: response.headers.get('content-type') || `image/${ext}`,
      }
    });

    await file.makePublic();
    return `https://storage.googleapis.com/${NEW_BUCKET}/${destinationPath}`;
  } catch (error) {
    console.error(`Failed to copy photo for ${phoneNumber}:`, error);
    return null;
  }
}

async function updatePhotoURL(phoneNumber, newURL) {
  const batch = db.batch();

  // 1. Update users collection
  const userRef = db.collection('users').doc(phoneNumber);
  batch.update(userRef, { photoURL: newURL, photoUpdatedAlt: admin.firestore.FieldValue.serverTimestamp() });

  // 2. Update members in freestyle-tango group
  const memberRef = db.collection('groups').doc('freestyle-tango').collection('members').doc(phoneNumber);
  const memberDoc = await memberRef.get();
  if (memberDoc.exists) {
    batch.update(memberRef, { photoURL: newURL });
  }

  await batch.commit();
}

migrateUserPhotos().catch(console.error);
