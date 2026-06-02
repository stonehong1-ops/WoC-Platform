import fs from 'fs';

const accessToken = "ya29.a0AQvPyIP81G75eZ_vTfKl1n97y99MAG8DPd5L-6-GprDhiynNtAKhOwMPmrDCamTnnfeEal0ZQJUzYPJYz8rAc5orhZ3uoIERbfUK4cSjPkebLEXn6GK5JEW3Qndmzkxegv_L2HvSV9ocp0qPKpUNnV8H8YKrd5KQUxvWPNuwIhgcdWe90XG2-_NjWqtMvwYCxLwXdEtQcdAom6QaCgYKAUwSARASFQHGX2MiVrJdsaLwYyV8SROBU42YKA0214";
const bucketName = "woc-platform-seoul-1234.firebasestorage.app";
const destination = "profiles/XEurgRUpdKM2DOn5Lb1QNOTN9v52.jpg";
const localFilePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\a78a98ca-50f4-466a-8312-3c29891fa034\\media__1780309320436.jpg';

async function main() {
  try {
    console.log('Reading local file...');
    const fileBuffer = fs.readFileSync(localFilePath);
    
    console.log('Uploading via Google Cloud Storage REST API...');
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(destination)}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/jpeg'
      },
      body: fileBuffer
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errText}`);
    }
    
    const data = await response.json();
    console.log('Upload success! Response:', data);
    
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(destination)}?alt=media`;
    console.log('Final Public Download URL:', publicUrl);
  } catch (err) {
    console.error('Error during upload:', err);
  }
}

main();
