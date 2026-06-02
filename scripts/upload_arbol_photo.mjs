import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin with local credentials
admin.initializeApp({
  projectId: 'woc-platform-seoul-1234',
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const bucket = admin.storage().bucket();
const localFilePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\a78a98ca-50f4-466a-8312-3c29891fa034\\media__1780309320436.jpg';
const destination = 'profiles/XEurgRUpdKM2DOn5Lb1QNOTN9v52.jpg';

async function uploadFile() {
  try {
    console.log('Starting upload of Arbol profile photo...');
    const [file] = await bucket.upload(localFilePath, {
      destination: destination,
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // Make file public to allow retrieval via standard media URLs
    await file.makePublic();
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
    
    console.log('Upload completed! Public URL:', publicUrl);
    
    // Update user profile document in Firestore
    const db = admin.firestore();
    await db.collection('users').doc('XEurgRUpdKM2DOn5Lb1QNOTN9v52').update({
      photoURL: publicUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Firestore user photoURL updated successfully!');
  } catch (error) {
    console.error('Error during photo upload process:', error);
  }
}

uploadFile();
