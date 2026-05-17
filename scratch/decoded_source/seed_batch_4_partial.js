const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Initialize Firebase Admin (Using the correct project ID)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'woc-platform-seoul-1234',
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const BATCH_NAME = 'batch4_partial';
const SOURCE_DIR = path.join(__dirname, 'temp_scenes', 'batch4');
const START_INDEX = 71;
const END_INDEX = 101;

async function processAndUpload() {
  console.log(`Starting migration for ${BATCH_NAME} (scenes ${START_INDEX}-${END_INDEX})...`);

  for (let i = START_INDEX; i <= END_INDEX; i++) {
    const sceneId = `scene-${String(i).padStart(3, '0')}`;
    const sourcePath = path.join(SOURCE_DIR, `${sceneId}.png`);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`File not found: ${sourcePath}. Skipping.`);
      continue;
    }

    try {
      console.log(`Processing ${sceneId}...`);

      // 1. Convert to WebP (Main image)
      const webpBuffer = await sharp(sourcePath)
        .webp({ quality: 90 })
        .toBuffer();

      // 2. Create Thumbnail
      const thumbBuffer = await sharp(sourcePath)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      // 3. Upload to Storage
      const destination = `scenes/${sceneId}.webp`;
      const thumbDestination = `scenes/thumbnails/${sceneId}.webp`;

      await bucket.file(destination).save(webpBuffer, { contentType: 'image/webp' });
      await bucket.file(thumbDestination).save(thumbBuffer, { contentType: 'image/webp' });

      const [url] = await bucket.file(destination).getSignedUrl({ action: 'read', expires: '03-01-2500' });
      const [thumbUrl] = await bucket.file(thumbDestination).getSignedUrl({ action: 'read', expires: '03-01-2500' });

      // 4. Determine Metadata based on index
      let mood = 'Calm';
      let activity = 'Relaxing';
      let season = 'All';

      if (i >= 71 && i <= 80) { mood = 'Serene'; season = 'Winter'; } // Nature/Winterish
      if (i >= 81 && i <= 90) { mood = 'Energetic'; activity = 'Exploring'; } // City/Urban
      if (i >= 91 && i <= 101) { mood = 'Romantic'; season = 'Spring'; } // Nature/Seasons

      // 5. Update Firestore
      const docRef = db.collection('scenes').doc(sceneId);
      await docRef.set({
        id: sceneId,
        slug: sceneId,
        title: `${sceneId.toUpperCase()} - Premium Asset`,
        imageUrl: url,
        thumbnailUrl: thumbUrl,
        mood: mood,
        activity: activity,
        season: season,
        orientation: 'landscape',
        premium: true,
        featured: false,
        sortOrder: i,
        typographySafeZone: { top: 10, left: 10, width: 80, height: 80 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Successfully imported ${sceneId}`);
    } catch (error) {
      console.error(`Error processing ${sceneId}:`, error);
    }
  }

  console.log('Partial seeding completed.');
}

processAndUpload().catch(console.error);
