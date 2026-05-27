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

const manifest = [
  { slug: "midnight-tango-001", mood: "Elegant", activity: "Social", b: 28, cs: true, sz: [8,8,38,22] },
  { slug: "midnight-tango-002", mood: "Romantic", activity: "Social", b: 24, cs: true, sz: [8,8,38,22] },
  { slug: "candlelight-tango-001", mood: "Romantic", activity: "Social", b: 28, cs: true, sz: [8,8,38,22] },
  { slug: "milonga-night-001", mood: "Vibrant", activity: "Party", b: 35, cs: true, sz: [8,8,38,22] },
  { slug: "rooftop-tango-001", mood: "Elegant", activity: "Social", b: 30, cs: true, sz: [8,8,38,22] },
  { slug: "coffee-morning-001", mood: "Warm", activity: "Relax", b: 65, cs: false, sz: [10,10,40,24] },
  { slug: "coffee-window-001", mood: "Moody", activity: "Relax", b: 45, cs: true, sz: [10,10,40,24] },
  { slug: "coffee-meetup-001", mood: "Warm", activity: "Social", b: 55, cs: false, sz: [10,10,40,24] },
  { slug: "coffee-book-001", mood: "Chill", activity: "Relax", b: 50, cs: true, sz: [10,10,40,24] },
  { slug: "street-rainy-night-001", mood: "Moody", activity: "Explore", b: 30, cs: true, sz: [8,8,38,22] },
  { slug: "street-sunset-001", mood: "Vibrant", activity: "Explore", b: 60, cs: false, sz: [8,8,38,22] },
  { slug: "park-walk-001", mood: "Calm", activity: "Relax", b: 70, cs: false, sz: [10,10,40,24] },
  { slug: "run-city-morning-001", mood: "Energetic", activity: "Exercise", b: 75, cs: false, sz: [8,8,38,22] },
  { slug: "run-bridge-sunrise-001", mood: "Energetic", activity: "Exercise", b: 80, cs: false, sz: [8,8,38,22] },
  { slug: "run-trail-forest-001", mood: "Calm", activity: "Exercise", b: 65, cs: false, sz: [10,10,40,24] },
  { slug: "run-group-001", mood: "Vibrant", activity: "Exercise", b: 70, cs: false, sz: [8,8,38,22] },
  { slug: "yoga-studio-morning-001", mood: "Calm", activity: "Relax", b: 65, cs: false, sz: [10,10,40,24] },
  { slug: "yoga-home-001", mood: "Calm", activity: "Relax", b: 60, cs: false, sz: [10,10,40,24] },
  { slug: "yoga-outdoor-001", mood: "Calm", activity: "Relax", b: 75, cs: false, sz: [10,10,40,24] },
  { slug: "study-desk-night-001", mood: "Moody", activity: "Learn", b: 30, cs: true, sz: [10,10,40,24] },
  { slug: "study-library-001", mood: "Chill", activity: "Learn", b: 45, cs: true, sz: [10,10,40,24] },
  { slug: "creative-desk-001", mood: "Vibrant", activity: "Learn", b: 55, cs: false, sz: [10,10,40,24] },
  { slug: "laptop-cafe-001", mood: "Warm", activity: "Learn", b: 50, cs: false, sz: [10,10,40,24] },
  { slug: "journal-morning-001", mood: "Chill", activity: "Relax", b: 65, cs: false, sz: [10,10,40,24] }
];

async function runAutoSplitImporter(sourceImage) {
  console.log(`Starting AUTO SPLIT IMPORTER with image: ${sourceImage}`);
  
  if (!fs.existsSync(sourceImage)) {
    console.error("Source image not found:", sourceImage);
    return;
  }

  const metadata = await sharp(sourceImage).metadata();
  console.log(`Original resolution: ${metadata.width}x${metadata.height}`);
  
  const gridCols = 6;
  const gridRows = 4;
  
  const cellWidth = metadata.width / gridCols;
  const cellHeight = metadata.height / gridRows;
  
  // Adjusted ratio based on visual analysis of the contact sheet
  // The image part is roughly the top 70-75% of the cell
  const imagePartRatio = 0.68; 
  const imageCropWidth = Math.floor(cellWidth);
  const imageCropHeight = Math.floor(cellHeight * imagePartRatio);

  console.log(`Splitting into ${gridCols}x${gridRows} grid...`);
  console.log(`Cell Size: ${cellWidth.toFixed(1)}x${cellHeight.toFixed(1)}`);
  console.log(`Image Crop Size: ${imageCropWidth}x${imageCropHeight}`);

  let successCount = 0;

  for (let i = 0; i < manifest.length; i++) {
    const item = manifest[i];
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;

    console.log(`[${i+1}/24] Processing: ${item.slug}`);

    try {
      // Precise extraction
      const extracted = await sharp(sourceImage)
        .extract({
          left: Math.floor(col * cellWidth),
          top: Math.floor(row * cellHeight),
          width: imageCropWidth,
          height: imageCropHeight
        })
        .webp({ quality: 90 })
        .toBuffer();

      // Upload to Storage
      const storagePath = `scenes/${item.slug}.webp`;
      const file = bucket.file(storagePath);
      await file.save(extracted, {
        metadata: { contentType: 'image/webp' },
        public: true
      });

      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      // Prepare Firestore Data
      const picData = {
        title: item.slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        slug: item.slug,
        imageUrl: downloadURL,
        thumbnailUrl: downloadURL,
        mood: item.mood,
        activity: item.activity,
        season: "All",
        tags: [item.mood, item.activity],
        orientation: 'landscape',
        brightness: item.b,
        contrastSafe: item.cs,
        typographySafeZone: {
          left: item.sz[0],
          top: item.sz[1],
          width: item.sz[2],
          height: item.sz[3]
        },
        featured: false,
        premium: false,
        sortOrder: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Upsert to Firestore
      await db.collection('scenes').doc(item.slug).set(picData);
      
      successCount++;
      process.stdout.write('.');
    } catch (err) {
      console.error(`\nError processing ${item.slug}:`, err.message);
    }
  }

  console.log(`\n\nSUCCESS: ${successCount}/24 assets imported successfully.`);
  process.exit(0);
}

// Get the latest image from brain directory if not provided
const brainDir = "C:\\Users\\stone\\.gemini\\antigravity\\brain";
function getLatestImage(dir) {
    let latestFile = null;
    let latestTime = 0;

    function walk(d) {
        const files = fs.readdirSync(d);
        for (const file of files) {
            const fullPath = path.join(d, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walk(fullPath);
            } else if (file.endsWith('.png') || file.endsWith('.jpg')) {
                if (stat.mtimeMs > latestTime) {
                    latestTime = stat.mtimeMs;
                    latestFile = fullPath;
                }
            }
        }
    }
    walk(dir);
    return latestFile;
}

const targetImage = process.argv[2] || getLatestImage(brainDir);
if (targetImage) {
    runAutoSplitImporter(targetImage).catch(err => {
        console.error("Pipeline failed:", err);
        process.exit(1);
    });
} else {
    console.error("No image found to process.");
    process.exit(1);
}
