
import { db } from './src/lib/firebase/clientApp';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

async function createSystemUser() {
  const systemUser = {
    uid: 'woc_system_guide',
    displayName: 'WoC AI Guide',
    email: 'guide@woc.today',
    photoURL: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
    role: 'system',
    status: 'active',
    bio: 'Your guide to the World of Community. I am here to help you navigate and enjoy the platform.',
    city: 'SEOUL',
    country: 'KOREA',
    zone: 'CENTRAL',
    interactionScore: 999, // High base score for testing
    createdAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'users', 'woc_system_guide'), systemUser);
    console.log('System user created successfully!');
  } catch (error) {
    console.error('Error creating system user:', error);
  }
}

createSystemUser();
