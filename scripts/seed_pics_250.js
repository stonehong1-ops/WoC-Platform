// Pics 250개 프리미엄 스타일 이미지 고화질 시딩 실행 스크립트
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}
const db = admin.firestore();

// 5가지 프리미엄 스타일별 Unsplash ID 풀
const DYNAMIC_MALE_DANCERS = [
  'photo-1508700115892-45ecd05ae2ad',
  'photo-1547153760-18fc86324498',
  'photo-1516035069371-29a1b244cc32',
  'photo-1535525153412-5a42439a210d',
  'photo-1519789147514-468b6406c184',
  'photo-1504609773096-104ff2c73ba4',
  'photo-1514320291840-2e0a9bf2a9ae',
  'photo-1518609878373-06d740f60d8b',
  'photo-1551632436-cbf8dd35adfa',
  'photo-1508700915892-45ecd05ae2ad'
];

const ELEGANT_FEMALE_DANCERS = [
  'photo-1518834107812-67b0b7c58434',
  'photo-1506157786151-b8491531f063',
  'photo-1546015720-b8b30df5aa27',
  'photo-1533105079780-92b9be482077',
  'photo-1519225495810-7517c296517a',
  'photo-1511285560929-80b456fea0bc',
  'photo-1537368910025-700350fe46c7',
  'photo-1494790108377-be9c29b29330',
  'photo-1518834107812-67b0b7c58434',
  'photo-1506157786151-b8491531f063'
];

const COZY_FILM_COUCH = [
  'photo-1517841905240-472988babdf9',
  'photo-1534528741775-53994a69daeb',
  'photo-1522075469751-3a6694fb2f61',
  'photo-1544005313-94ddf0286df2',
  'photo-1506794778202-cad84cf45f1d',
  'photo-1531746020798-e6953c6e8e04',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1524504388940-b1c1722653e1',
  'photo-1488426862026-3ee34a7d66df',
  'photo-1519085360753-af0119f7cbe7'
];

const ARTISTIC_PAINTED = [
  'photo-1579783900882-c0d3dad7b119',
  'photo-1579783928621-7a13d66a62d1',
  'photo-1597848212624-a19eb35e2651',
  'photo-1618005182384-a83a8bd57fbe',
  'photo-1536924940846-227afb31e2a5',
  'photo-1580489944761-15a19d654956',
  'photo-1508214751196-bcfd4ca60f91',
  'photo-1438761681033-6461ffad8d80',
  'photo-1541643600914-78b084683601',
  'photo-1554151228-14d9def656e4'
];

const YOGA_STRETCHING = [
  'photo-1544367567-0f2fcb009e0b',
  'photo-1506126613408-eca07ce68773',
  'photo-1510894347713-fc3ed6fdf539',
  'photo-1599447421416-3414500d18a5',
  'photo-1575052814086-f385e2e2ad1b',
  'photo-1517838277536-f5f99be501cd',
  'photo-1518611012118-696072aa579a',
  'photo-1518310383802-640c2de311b2',
  'photo-1527156979176-1219802cf221',
  'photo-1512438248247-f0f2a5a8b7f0'
];

// 스타일별 매핑 명세
const STYLES = [
  {
    name: 'Dynamic Male Dancer',
    mood: 'Energetic',
    activity: 'Exercise',
    season: 'Spring',
    timeOfDay: 'Afternoon',
    titlePrefix: 'Dynamic Movement',
    pool: DYNAMIC_MALE_DANCERS,
    tags: ['Energetic', 'Exercise', 'Spring', 'Afternoon', 'Dance', 'Male Dancer', 'Dynamic', 'WoC']
  },
  {
    name: 'Elegant Female Dancer',
    mood: 'Elegant',
    activity: 'Relax',
    season: 'Autumn',
    timeOfDay: 'Night',
    titlePrefix: 'Graceful Flow',
    pool: ELEGANT_FEMALE_DANCERS,
    tags: ['Elegant', 'Relax', 'Autumn', 'Night', 'Ballet', 'Female Dancer', 'Graceful', 'WoC']
  },
  {
    name: 'Cozy Film Couch Portrait',
    mood: 'Chill',
    activity: 'Relax',
    season: 'Winter',
    timeOfDay: 'Night',
    titlePrefix: 'Cozy Afternoon',
    pool: COZY_FILM_COUCH,
    tags: ['Chill', 'Relax', 'Winter', 'Night', 'Portrait', 'Cozy', 'Film', 'Couch', 'WoC']
  },
  {
    name: 'Artistic Painted Portrait',
    mood: 'Vibrant',
    activity: 'Explore',
    season: 'Summer',
    timeOfDay: 'Evening',
    titlePrefix: 'Artistic Canvas',
    pool: ARTISTIC_PAINTED,
    tags: ['Vibrant', 'Explore', 'Summer', 'Evening', 'Art', 'Painted', 'Creative', 'Portrait', 'WoC']
  },
  {
    name: 'Studio Yoga/Stretching',
    mood: 'Calm',
    activity: 'Exercise',
    season: 'Spring',
    timeOfDay: 'Morning',
    titlePrefix: 'Mindful Balance',
    pool: YOGA_STRETCHING,
    tags: ['Calm', 'Exercise', 'Spring', 'Morning', 'Yoga', 'Stretching', 'Wellness', 'Studio', 'WoC']
  }
];

async function seed250() {
  console.log('Starting migration for 250 premium scenes...');

  // 1. Get the current maximum sortOrder from scenes collection
  const scenesSnapshot = await db.collection('scenes').orderBy('sortOrder', 'desc').limit(1).get();
  let maxSortOrder = 0;
  if (!scenesSnapshot.empty) {
    maxSortOrder = scenesSnapshot.docs[0].data().sortOrder || 0;
  }
  console.log(`Current maximum sortOrder in Firestore: ${maxSortOrder}`);

  let addedCount = 0;
  let batch = db.batch();
  let operationCount = 0;

  // 2. Generate 50 items for each of the 5 premium styles
  for (let styleIndex = 0; styleIndex < STYLES.length; styleIndex++) {
    const style = STYLES[styleIndex];
    console.log(`Generating 50 items for style: ${style.name}...`);

    for (let i = 1; i <= 50; i++) {
      const globalIndex = styleIndex * 50 + i;
      const slug = `premium-scene-${style.mood.toLowerCase()}-${String(i).padStart(3, '0')}`;
      
      const unsplashId = style.pool[(i - 1) % style.pool.length];
      const imageUrl = `https://images.unsplash.com/${unsplashId}?w=800&auto=format&fit=crop&q=80&sig=${globalIndex}`;
      const thumbnailUrl = `https://images.unsplash.com/${unsplashId}?w=400&auto=format&fit=crop&q=80&sig=${globalIndex}`;

      const picData = {
        id: slug,
        title: `${style.titlePrefix} ${String(i).padStart(3, '0')}`,
        slug: slug,
        imageUrl: imageUrl,
        thumbnailUrl: thumbnailUrl,
        mood: style.mood,
        activity: style.activity,
        season: style.season,
        timeOfDay: style.timeOfDay,
        tags: style.tags,
        orientation: 'portrait',
        brightness: 55 + (i % 15), // 55 to 70 range
        contrastSafe: true,
        typographySafeZone: {
          top: 10,
          left: 10,
          width: 80,
          height: 80
        },
        featured: i <= 2, // First 2 items of each style are featured
        premium: true,
        sortOrder: maxSortOrder + globalIndex,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = db.collection('scenes').doc(slug);
      batch.set(docRef, picData);
      operationCount++;
      addedCount++;

      // Commit batch if it reaches the Firestore limit of 500 operations
      if (operationCount >= 400) {
        console.log(`Committing batch of ${operationCount} operations...`);
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }
  }

  // Commit any remaining operations in the batch
  if (operationCount > 0) {
    console.log(`Committing final batch of ${operationCount} operations...`);
    await batch.commit();
  }

  console.log(`\nSUCCESS: Added ${addedCount} premium scenes to Firestore 'scenes' collection successfully.`);
  process.exit(0);
}

seed250().catch(err => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
