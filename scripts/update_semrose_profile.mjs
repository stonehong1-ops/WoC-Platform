import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const localFilePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\f86a4e29-2fb5-4502-b264-3e2723a368e8\\media__1780395106087.jpg';
const destination = 'profiles/Cw722oqjy3XeEL03DLb8e5vFpPI3/profile_semrose.jpg';

async function updateSemroseProfile() {
  try {
    console.log('1. Starting upload of Semrose profile photo to Firebase Storage...');
    
    // File upload
    const [file] = await bucket.upload(localFilePath, {
      destination: destination,
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    // Make public
    await file.makePublic();
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
    console.log('Upload completed successfully! Public URL:', publicUrl);

    // 2. Update users/Cw722oqjy3XeEL03DLb8e5vFpPI3 document in Firestore
    console.log('2. Updating users/Cw722oqjy3XeEL03DLb8e5vFpPI3 photoURL...');
    await db.collection('users').doc('Cw722oqjy3XeEL03DLb8e5vFpPI3').update({
      photoURL: publicUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Firestore user photoURL updated successfully!');

    // 3. Update instructors array in Friday classes under groups/tango-brujo/classes
    console.log('3. Updating Friday classes instructors to include Semrose (Amy)...');
    
    const classesSnap = await db.collection('groups').doc('tango-brujo').collection('classes').get();
    
    const leadInstructor = {
      name: "Okiz Baek",
      role: "Lead Instructor",
      userId: "rNlMcPgoapaReMXt4P0ux35WklJ2",
      avatar: "https://firebasestorage.googleapis.com/v0/b/woc-platform-seoul-1234.firebasestorage.app/o/profiles%2FrNlMcPgoapaReMXt4P0ux35WklJ2%2F1780357566204_profile?alt=media&token=dfa8e9ae-098b-47e8-be57-f206602df431"
    };

    const newSemroseInstructor = {
      name: "Amy",
      role: "Instructor",
      userId: "Cw722oqjy3XeEL03DLb8e5vFpPI3",
      avatar: publicUrl
    };

    let updateCount = 0;

    for (const doc of classesSnap.docs) {
      const data = doc.data();
      if (data.title && data.title.startsWith('금)브루호')) {
        console.log(`- Updating Class: "${data.title}" (ID: ${doc.id})`);
        
        // Update both instructors list and class coverImage if needed, but keeping existing design concept
        await doc.ref.update({
          instructors: [leadInstructor, newSemroseInstructor],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updateCount++;
      }
    }

    console.log(`Successfully updated ${updateCount} Friday classes with Semrose instructor.`);
    console.log('Semrose profile update and Friday classes mapping completed.');

  } catch (error) {
    console.error('Error during Semrose profile update process:', error);
  } finally {
    process.exit(0);
  }
}

updateSemroseProfile();
