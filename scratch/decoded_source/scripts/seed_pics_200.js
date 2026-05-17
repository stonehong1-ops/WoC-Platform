const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Initialize Firebase Admin
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}
const db = admin.firestore();
const bucket = admin.storage().bucket();

const BRAIN_DIR = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30';

const MOODS = ['Romantic', 'Vibrant', 'Chill', 'Energetic', 'Moody', 'Elegant', 'Warm', 'Calm'];
const ACTIVITIES = ['Social', 'Dining', 'Explore', 'Relax', 'Party', 'Learn', 'Exercise'];
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

// Get all PNG files in brain directory
const allFiles = fs.readdirSync(BRAIN_DIR).filter(f => f.endsWith('.png'));

async function seed200() {
  console.log(`Starting SEEDING for 200 items...`);
  
  // 1. Delete all existing scenes
  const snapshot = await db.collection('scenes').get();
  const deleteBatch = db.batch();
  snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();
  console.log(`Deleted ${snapshot.size} existing scenes.`);

  let successCount = 0;

  for (let i = 1; i <= 200; i++) {
    const fileIndex = (i - 1) % allFiles.length;
    const fileName = allFiles[fileIndex];
    const filePath = path.join(BRAIN_DIR, fileName);
    
    const slug = `scene-${String(i).padStart(3, '0')}`;
    
    // Determine metadata from filename or cycle
    let mood = MOODS[i % MOODS.length];
    let activity = ACTIVITIES[i % ACTIVITIES.length];
    let season = SEASONS[i % SEASONS.length];
    let title = `Tango Scene ${String(i).padStart(3, '0')}`;

    if (fileName.includes('vibrant')) mood = 'Vibrant';
    if (fileName.includes('calm')) mood = 'Calm';
    if (fileName.includes('energetic')) mood = 'Energetic';
    if (fileName.includes('romantic')) mood = 'Romantic';
    if (fileName.includes('elegant')) mood = 'Elegant';
    if (fileName.includes('moody')) mood = 'Moody';

    if (fileName.includes('social')) activity = 'Social';
    if (fileName.includes('party')) activity = 'Party';
    if (fileName.includes('learn')) activity = 'Learn';
    if (fileName.includes('relax')) activity = 'Relax';

    if (fileName.includes('spring')) season = 'Spring';
    if (fileName.includes('summer')) season = 'Summer';
    if (fileName.includes('autumn')) season = 'Autumn';
    if (fileName.includes('winter') || fileName.includes('snowy')) season = 'Winter';

    try {
      // For the first 70 (unique files), we upload to Storage. 
      // For 71-200, we reuse the same Storage URLs to save space/time.
      let downloadURL;
      const storagePath = `scenes/asset-${String(fileIndex + 1).padStart(3, '0')}.webp`;
      const file = bucket.file(storagePath);

      const exists = await file.exists();
      if (!exists[0]) {
        console.log(`Uploading new asset: ${storagePath}`);
        const buffer = await sharp(filePath).webp({ quality: 85 }).toBuffer();
        await file.save(buffer, {
          metadata: { contentType: 'image/webp' },
          public: true
        });
      }
      
      downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      const picData = {
        id: slug,
        title: title,
        slug: slug,
        imageUrl: downloadURL,
        thumbnailUrl: downloadURL,
        mood: mood,
        activity: activity,
        season: season,
        tags: [mood, activity, season, "Tango", "WoC"],
        orientation: 'landscape',
        featured: i <= 10, // First 10 are featured
        premium: true,
        sortOrder: i,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await db.collection('scenes').doc(slug).set(picData);
      successCount++;
      if (i % 20 === 0) console.log(`Processed ${i}/200...`);
    } catch (err) {
      console.error(`Error processing ${slug}:`, err.message);
    }
  }

  console.log(`\nSUCCESS: ${successCount}/200 assets seeded successfully.`);
  process.exit(0);
}

seed200().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
