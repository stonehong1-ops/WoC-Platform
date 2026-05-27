const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Initialize Firebase Admin
const serviceAccount = require('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
  });
}
const db = admin.firestore();
const bucket = admin.storage().bucket();

async function runPipeline() {
  console.log("Starting Antigravity Asset Ingestion Pipeline...");
  
  const userHome = process.env.USERPROFILE || 'C:\\Users\\stone';
  const actualTempDir = path.join(userHome, '.gemini', 'antigravity', 'brain', '7b1c323c-14d1-4562-ac36-6bb777b5c286', '.tempmediaStorage');
  
  if (!fs.existsSync(actualTempDir)) {
    console.error("Temp media directory not found:", actualTempDir);
    return;
  }
  
  const files = fs.readdirSync(actualTempDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
  if (files.length === 0) {
    console.error("No images found in temp storage.");
    return;
  }
  
  files.sort((a, b) => {
    return fs.statSync(path.join(actualTempDir, b)).mtime.getTime() - fs.statSync(path.join(actualTempDir, a)).mtime.getTime();
  });
  
  const latestImage = path.join(actualTempDir, files[0]);
  console.log("Found contact sheet:", latestImage);

  const manifestPath = path.join(__dirname, 'temp_manifest.json');
  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!Array.isArray(manifest)) manifest = [manifest];
  }

  const metadata = await sharp(latestImage).metadata();
  console.log(`Image dimensions: ${metadata.width}x${metadata.height}`);
  
  const gridCols = 6;
  const gridRows = 4;
  
  const cellWidth = Math.floor(metadata.width / gridCols);
  const cellHeight = Math.floor(metadata.height / gridRows);
  const imageAreaHeight = Math.floor(cellHeight * 0.68); 
  
  console.log(`Cropping into ${gridCols}x${gridRows} grid. Cell: ${cellWidth}x${cellHeight}, Image: ${cellWidth}x${imageAreaHeight}`);

  let successCount = 0;
  let index = 0;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const itemMeta = manifest[index];
      if (!itemMeta) {
        index++;
        continue;
      }

      console.log(`Processing card ${index + 1}: ${itemMeta.slug}`);

      try {
        const extracted = await sharp(latestImage)
          .extract({
            left: col * cellWidth,
            top: row * cellHeight,
            width: cellWidth,
            height: imageAreaHeight
          })
          .toBuffer();

        const fileName = `Pics/${itemMeta.slug}.jpg`;
        const file = bucket.file(fileName);
        await file.save(extracted, {
          metadata: { contentType: 'image/jpeg' },
          public: true
        });
        
        const encodedPath = encodeURIComponent(fileName);
        const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

        const picData = {
          title: itemMeta.slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          slug: itemMeta.slug,
          imageUrl: downloadURL,
          mood: itemMeta.mood,
          activity: itemMeta.activity,
          season: "All",
          tags: [],
          orientation: 'landscape',
          brightness: itemMeta.brightness,
          contrastSafe: itemMeta.contrastSafe,
          featured: false,
          premium: false,
          sortOrder: index,
          typographySafeZone: {
            left: itemMeta.sz[0],
            top: itemMeta.sz[1],
            width: itemMeta.sz[2],
            height: itemMeta.sz[3]
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        const docRef = db.collection('scenes').doc(itemMeta.slug);
        await docRef.set(picData);
        successCount++;
        
      } catch (err) {
        console.error(`Error processing card ${index}:`, err);
      }

      index++;
    }
  }

  console.log(`\nPipeline Complete! Successfully ingested ${successCount} assets.`);
}

runPipeline().catch(console.error);
