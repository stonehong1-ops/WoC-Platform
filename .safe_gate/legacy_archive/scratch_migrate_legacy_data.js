const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const saPath = path.join(__dirname, 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
const serviceAccount = require(saPath);

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function run() {
    console.log('=== STARTING HAPJEONG STAY IMAGES MIGRATION ===');
    
    const localDir = 'C:\\Users\\stone\\FreestyleTango\\public\\images';
    
    // Original hapjeong images array mapping to local filenames
    const imageFiles = [
      '20260317_143309.jpg',
      '20260320_105323.jpg',
      '20260319_130824.jpg',
      '20260318_095315.jpg',
      '20260311_140211.jpg',
      '20260320_105309.jpg',
      '20260319_123504.jpg',
      '20260319_123516.jpg',
      '20260319_124230.jpg',
      '20260319_123529(1).jpg',
      '20260320_140636.jpg',
      '20260317_141751.jpg',
      '20260310_181707.jpg',
      '20260313_155116.jpg',
      '20260313_155135.jpg',
      '20260320_132712.jpg',
      '20260316_190008.jpg',
      '20260310_184549.jpg',
      '20260310_184607.jpg'
    ];

    const uploadedUrls = [];

    for (let i = 0; i < imageFiles.length; i++) {
        const fileName = imageFiles[i];
        const localPath = path.join(localDir, fileName);
        if (!fs.existsSync(localPath)) {
            console.error(`File not found: ${localPath}`);
            continue;
        }

        const destination = `stays/tango-stay-hapjeong/${Date.now()}_${i}.jpg`;
        console.log(`Uploading ${fileName} to ${destination}...`);

        const [file] = await bucket.upload(localPath, {
            destination,
            metadata: {
                contentType: 'image/jpeg'
            }
        });

        // Make the file publicly readable
        await file.makePublic();

        // Construct the public storage URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        console.log(`Uploaded! URL: ${publicUrl}`);
        uploadedUrls.push(publicUrl);
    }

    console.log(`\nSuccessfully uploaded ${uploadedUrls.length} images.`);
    
    console.log('Updating stays/tango-stay-hapjeong in Firestore...');
    const docRef = db.collection('stays').doc('tango-stay-hapjeong');
    await docRef.update({
        images: uploadedUrls
    });
    
    console.log('Firestore updated successfully!');
}

run().then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
