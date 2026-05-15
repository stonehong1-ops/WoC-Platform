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

const batch2Images = [
  { id: 11, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_011_cafe_1778734538415.png", mood: "Vibrant", activity: "Social", title: "Sunlit Cafe Social", b: 70, cs: false },
  { id: 12, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_012_plaza_1778734556092.png", mood: "Vibrant", activity: "Social", title: "Outdoor Plaza Milonga", b: 65, cs: false },
  { id: 13, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_013_studio_1778734580666.png", mood: "Vibrant", activity: "Social", title: "Bright Modern Studio", b: 75, cs: false },
  { id: 14, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_014_sunset_1778734595766.png", mood: "Vibrant", activity: "Social", title: "Golden Hour Tango", b: 60, cs: false },
  { id: 15, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_015_laboca_1778734612574.png", mood: "Vibrant", activity: "Social", title: "Colorful La Boca Performance", b: 80, cs: false },
  { id: 16, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_016_dinner_1778734640052.png", mood: "Vibrant", activity: "Social", title: "Lively Dinner Tango", b: 50, cs: true },
  { id: 17, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_017_morning_1778734655629.png", mood: "Vibrant", activity: "Social", title: "Morning Practice Hallway", b: 65, cs: false },
  { id: 18, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_018_garden_1778734675973.png", mood: "Vibrant", activity: "Social", title: "Garden Party Tango", b: 70, cs: false },
  { id: 19, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_019_rooftop_1778734695732.png", mood: "Vibrant", activity: "Social", title: "Rooftop Social Dusk", b: 45, cs: true },
  { id: 20, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\vibrant_social_020_festival_1778734713615.png", mood: "Vibrant", activity: "Social", title: "Festival Energy Crowd", b: 70, cs: false },
  { id: 21, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_021_studio_1778734737552.png", mood: "Calm", activity: "Practice", title: "Minimalist Studio Solitude", b: 40, cs: true },
  { id: 22, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_022_rainy_1778734753879.png", mood: "Calm", activity: "Social", title: "Rainy Window Tango", b: 35, cs: true },
  { id: 23, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_023_misty_1778734768605.png", mood: "Calm", activity: "Practice", title: "Misty Morning Plaza", b: 30, cs: true },
  { id: 24, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_024_zen_1778734792631.png", mood: "Calm", activity: "Practice", title: "Zen Practice Space", b: 45, cs: true },
  { id: 25, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_025_moonlight_1778734807759.png", mood: "Calm", activity: "Social", title: "Moonlight Reflection", b: 25, cs: true },
  { id: 26, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_026_gallery_1778734828995.png", mood: "Calm", activity: "Social", title: "Minimalist Art Gallery", b: 50, cs: true },
  { id: 27, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_027_library_1778734844089.png", mood: "Calm", activity: "Learn", title: "Quiet Library Tango", b: 40, cs: true },
  { id: 28, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_028_seaside_1778734863412.png", mood: "Calm", activity: "Practice", title: "Foggy Seaside Pier", b: 35, cs: true },
  { id: 29, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_029_loft_1778734878582.png", mood: "Calm", activity: "Practice", title: "Modern Loft Practice", b: 50, cs: true },
  { id: 30, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\calm_minimalist_030_snowy_1778734899371.png", mood: "Calm", activity: "Social", title: "Snowy Evening Studio", b: 45, cs: true },
  { id: 31, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_031_stage_1778734922589.png", mood: "Energetic", activity: "Perform", title: "Theater Stage Passion", b: 60, cs: true },
  { id: 32, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_032_neon_1778734940327.png", mood: "Energetic", activity: "Party", title: "Smoky Neon Club", b: 50, cs: true },
  { id: 33, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_033_street_1778734957063.png", mood: "Energetic", activity: "Perform", title: "Street Band Energy", b: 70, cs: false },
  { id: 34, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_034_competition_1778734971115.png", mood: "Energetic", activity: "Perform", title: "High-Stakes Competition", b: 65, cs: false },
  { id: 35, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_035_flashmob_1778735000062.png", mood: "Energetic", activity: "Social", title: "Train Station Flash Mob", b: 60, cs: false },
  { id: 36, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_036_finale_1778735022348.png", mood: "Energetic", activity: "Perform", title: "Dramatic Finale Gold", b: 75, cs: false },
  { id: 37, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_037_underground_1778735037219.png", mood: "Energetic", activity: "Party", title: "Underground Red Club", b: 35, cs: true },
  { id: 38, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_038_dynamic_1778735052492.png", mood: "Energetic", activity: "Perform", title: "Dynamic Tango Motion", b: 55, cs: true },
  { id: 39, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_039_ensemble_1778735072531.png", mood: "Energetic", activity: "Perform", title: "Grand Ensemble Stage", b: 65, cs: false },
  { id: 40, path: "C:\\Users\\stone\\.gemini\\antigravity\\brain\\8cc107c2-b654-4a94-b9db-8cabcc12ba30\\energetic_performance_040_fusion_1778735094140.png", mood: "Energetic", activity: "Perform", title: "Futuristic Fusion Art", b: 70, cs: false }
];

async function seedBatch2() {
  console.log(`Starting SEEDING for BATCH 2 (30 images)...`);
  
  let successCount = 0;

  for (const item of batch2Images) {
    const slug = `scene-${String(item.id).padStart(3, '0')}`;
    console.log(`Processing [${item.id}/40]: ${slug} (${item.title})`);

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

  console.log(`\n\nSUCCESS: ${successCount}/30 Batch 2 assets imported successfully.`);
  process.exit(0);
}

seedBatch2().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
