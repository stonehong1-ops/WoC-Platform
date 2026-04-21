const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs, query, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBFLzc4F7F_E9XidGRwB4EsAr5LN-Hu7i0",
  authDomain: "woc-platform-seoul-1234.firebaseapp.com",
  projectId: "woc-platform-seoul-1234",
  storageBucket: "woc-platform-seoul-1234.firebasestorage.app",
  messagingSenderId: "1021887439599",
  appId: "1:1021887439599:web:7c5741009dd928b8fd311a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFetch() {
  const spaceId = 'ab-tango';
  console.log(`Fetching community: ${spaceId}`);
  
  try {
    const docRef = doc(db, 'communities', spaceId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      console.log('Community not found');
      return;
    }
    
    console.log('Community data:', snapshot.data());
    
    console.log('Fetching posts...');
    const postsRef = collection(db, 'communities', spaceId, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const postsSnap = await getDocs(q);
    console.log(`Found ${postsSnap.size} posts`);
    
  } catch (error) {
    console.error('FETCH ERROR:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

testFetch();
