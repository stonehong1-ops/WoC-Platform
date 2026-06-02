import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyBFLzc4F7F_E9XidGRwB4EsAr5LN-Hu7i0",
  authDomain: "woc-platform-seoul-1234.firebaseapp.com",
  projectId: "woc-platform-seoul-1234",
  storageBucket: "woc-platform-seoul-1234.firebasestorage.app",
  messagingSenderId: "1021887439599",
  appId: "1:1021887439599:web:7c5741009dd928b8fd311a"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);
const db = getFirestore(app);

const localFilePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\a78a98ca-50f4-466a-8312-3c29891fa034\\media__1780309320436.jpg';
const destination = 'profiles/XEurgRUpdKM2DOn5Lb1QNOTN9v52.jpg';

async function uploadFile() {
  try {
    console.log('Signing in anonymously to Firebase...');
    await signInAnonymously(auth);
    console.log('Signed in successfully!');

    console.log('Reading local photo file...');
    const fileBuffer = fs.readFileSync(localFilePath);
    
    console.log('Uploading photo to Firebase Storage...');
    const storageRef = ref(storage, destination);
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: 'image/jpeg'
    });
    
    console.log('Upload success! Fetching download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);

    console.log('Updating Firestore users/XEurgRUpdKM2DOn5Lb1QNOTN9v52 document...');
    const userDocRef = doc(db, 'users', 'XEurgRUpdKM2DOn5Lb1QNOTN9v52');
    await updateDoc(userDocRef, {
      photoURL: downloadURL,
      updatedAt: serverTimestamp()
    });
    
    console.log('Firestore user photoURL updated successfully!');
  } catch (error) {
    console.error('Error during photo upload process:', error);
  }
}

uploadFile();
