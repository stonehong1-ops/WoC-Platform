const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Simple .env.local parser
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim().replace(/"/g, '');
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedGallery = async () => {
  const posts = [
    {
      authorId: 'system',
      authorName: 'WoC Admin',
      authorPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      media: [
        'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800',
        'https://images.unsplash.com/photo-1504609813442-a8924e83f73e?w=800'
      ],
      caption: 'Busan Tango Marathon was amazing! 💃🕺 #BusanTango #Marathon',
      venueId: 'busan-marathon-venue',
      venueName: 'Busan, South Korea',
      eventId: 'busan-tango-marathon',
      eventName: 'Busan Tango Marathon',
      likesCount: 24,
      commentsCount: 5,
      likedBy: [],
    },
    {
      authorId: 'system',
      authorName: 'Tango Lover',
      authorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      media: [
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'
      ],
      caption: 'Suncheon Youth Training Center | Big Milonga "Estrellas" ✨ #Suncheon #Tango',
      venueId: 'suncheon-youth-center',
      venueName: 'Suncheon Youth Training Center',
      eventId: 'estrellas-milonga',
      eventName: 'Big Milonga "Estrellas"',
      likesCount: 15,
      commentsCount: 2,
      likedBy: [],
    }
  ];

  try {
    for (const post of posts) {
      await addDoc(collection(db, 'galleries'), {
        ...post,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`Added post: ${post.caption}`);
    }
    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seedGallery();
