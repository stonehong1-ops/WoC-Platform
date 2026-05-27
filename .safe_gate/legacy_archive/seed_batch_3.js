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

const batch3Images = [
  { id: 41, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_041_candlelight_1778735224506.png", mood: "Romantic", activity: "Social", title: "Candlelight Embrace", b: 30, cs: true },
  { id: 42, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_042_shoes_1778735248124.png", mood: "Romantic", activity: "Social", title: "Close-up Shoes Motion", b: 35, cs: true },
  { id: 43, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_043_hands_1778735262192.png", mood: "Romantic", activity: "Social", title: "Joined Hands Embrace", b: 40, cs: true },
  { id: 44, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_044_whisper_1778735277777.png", mood: "Romantic", activity: "Social", title: "Soft Whispers Tango", b: 35, cs: true },
  { id: 45, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_045_outdoor_candles_1778735292624.png", mood: "Romantic", activity: "Social", title: "Outdoor Candlelight Night", b: 25, cs: true },
  { id: 46, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_046_attic_1778735319592.png", mood: "Romantic", activity: "Practice", title: "Dimly Lit Attic Practice", b: 30, cs: true },
  { id: 47, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_047_portrait_1778735341513.png", mood: "Romantic", activity: "Social", title: "Emotional Tango Portrait", b: 40, cs: true },
  { id: 48, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_048_moonlight_1778735359286.png", mood: "Romantic", activity: "Social", title: "Moonlight Lavender Field", b: 35, cs: true },
  { id: 49, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_049_balcony_1778735373190.png", mood: "Romantic", activity: "Social", title: "Private Balcony Tango", b: 30, cs: true },
  { id: 50, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\romantic_intimate_050_shadows_1778735387299.png", mood: "Romantic", activity: "Social", title: "Artistic Shadow Dance", b: 20, cs: true },
  { id: 51, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_051_opera_1778735409670.png", mood: "Elegant", activity: "Perform", title: "Grand Opera House", b: 60, cs: true },
  { id: 52, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_052_library_1778735425887.png", mood: "Elegant", activity: "Social", title: "Historic Library Tango", b: 50, cs: true },
  { id: 53, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_053_colonnade_1778735440250.png", mood: "Elegant", activity: "Perform", title: "Neoclassical Colonnade", b: 65, cs: false },
  { id: 54, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_054_palace_1778735458289.png", mood: "Elegant", activity: "Social", title: "Abandoned Palace Ballroom", b: 40, cs: true },
  { id: 55, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_055_station_1778735473945.png", mood: "Elegant", activity: "Social", title: "Historic Train Station", b: 55, cs: true },
  { id: 56, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_056_brutalist_1778735495887.png", mood: "Modern", activity: "Perform", title: "Brutalist Concrete Tango", b: 50, cs: true },
  { id: 57, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_057_bridge_1778735514716.png", mood: "Elegant", activity: "Perform", title: "Historic Stone Bridge", b: 45, cs: true },
  { id: 58, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_058_university_1778735528842.png", mood: "Elegant", activity: "Social", title: "Historic University Hall", b: 50, cs: true },
  { id: 59, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_059_cathedral_1778735542161.png", mood: "Elegant", activity: "Social", title: "Cathedral Vaulted Hall", b: 45, cs: true },
  { id: 60, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\architectural_historic_060_foyer_1778735556215.png", mood: "Elegant", activity: "Perform", title: "Historic Theater Foyer", b: 60, cs: true },
  { id: 61, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_061_autumn_1778735578981.png", mood: "Vibrant", activity: "Social", title: "Autumn Forest Leaves", b: 70, cs: false },
  { id: 62, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_062_snowy_lake_1778735600503.png", mood: "Calm", activity: "Social", title: "Snowy Frozen Lake", b: 75, cs: false },
  { id: 63, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_063_rainy_street_1778735616967.png", mood: "Moody", activity: "Social", title: "Rainy Cobblestone Street", b: 35, cs: true },
  { id: 64, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_064_sunflowers_1778735630229.png", mood: "Vibrant", activity: "Social", title: "Sunflower Summer Sunset", b: 70, cs: false },
  { id: 65, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_065_cherry_blossom_1778735646644.png", mood: "Romantic", activity: "Social", title: "Spring Cherry Blossom", b: 75, cs: false },
  { id: 66, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_066_beach_1778735669888.png", mood: "Calm", activity: "Social", title: "Dawn Beach Serenity", b: 65, cs: false },
  { id: 67, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_067_misty_park_1778735688378.png", mood: "Moody", activity: "Social", title: "Misty Autumn Park", b: 35, cs: true },
  { id: 68, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_068_fireplace_1778735705658.png", mood: "Warm", activity: "Social", title: "Winter Lodge Fireplace", b: 45, cs: true },
  { id: 69, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_069_jungle_1778735724592.png", mood: "Vibrant", activity: "Social", title: "Tropical Jungle Clearing", b: 60, cs: false },
  { id: 70, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\seasonal_nature_070_desert_1778735744915.png", mood: "Vibrant", activity: "Social", title: "Desert Sunset Dunes", b: 70, cs: false }
];

async function seedBatch3() {
  console.log(`Starting SEEDING for BATCH 3 (30 images)...`);
  
  let successCount = 0;

  for (const item of batch3Images) {
    const slug = `scene-${String(item.id).padStart(3, '0')}`;
    console.log(`Processing [${item.id}/70]: ${slug} (${item.title})`);

    try {
      if (!fs.existsSync(item.path)) {
        console.warn(`File not found: ${item.path}`);
        continue;
      }

      // Convert to WebP and get buffer
      const buffer = await sharp(item.path)
        .webp({ quality: 85 })
        .toBuffer();

      // Upload to Storage
      const storagePath = `scenes/${slug}.webp`;
      const file = bucket.file(storagePath);
      await file.save(buffer, {
        metadata: { contentType: 'image/webp' },
        public: true
      });

      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      // Prepare Firestore Data
      const picData = {
        title: item.title,
        slug: slug,
        imageUrl: downloadURL,
        thumbnailUrl: downloadURL,
        mood: item.mood,
        activity: item.activity,
        season: "All",
        tags: [item.mood, item.activity, "Premium"],
        orientation: 'landscape',
        brightness: item.b,
        contrastSafe: item.cs,
        typographySafeZone: {
          left: 10,
          top: 10,
          width: 80,
          height: 80
        },
        featured: false,
        premium: true,
        sortOrder: item.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Upsert to Firestore
      await db.collection('scenes').doc(slug).set(picData);
      
      successCount++;
      process.stdout.write('✅ ');
    } catch (err) {
      console.error(`\nError processing ${slug}:`, err.message);
    }
  }

  console.log(`\n\nSUCCESS: ${successCount}/30 Batch 3 assets imported successfully.`);
  process.exit(0);
}

seedBatch3().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
