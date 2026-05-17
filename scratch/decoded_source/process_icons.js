const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processIcons() {
  const input = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\10060b96-8e24-41d6-ad36-c8652fde12e7\\media__1778203648043.jpg';
  
  const publicIconsDir = path.join(__dirname, 'public', 'icons');
  const appDir = path.join(__dirname, 'src', 'app');

  if (!fs.existsSync(publicIconsDir)){
      fs.mkdirSync(publicIconsDir, { recursive: true });
  }

  try {
    // Generate icons for public/icons (used by manifest)
    await sharp(input)
      .resize(192, 192)
      .toFile(path.join(publicIconsDir, 'icon-192x192.png'));
    
    await sharp(input)
      .resize(512, 512)
      .toFile(path.join(publicIconsDir, 'icon-512x512.png'));

    // Generate Apple icon for src/app
    await sharp(input)
      .resize(180, 180)
      .toFile(path.join(appDir, 'apple-icon.png'));

    // Generate basic app icon for src/app
    await sharp(input)
      .resize(512, 512)
      .toFile(path.join(appDir, 'icon.png'));

    // Generate favicon.ico (We can just make a 32x32 png and name it favicon.ico or just let Next.js use icon.png)
    // Actually, sharp doesn't write .ico format. But if we put icon.png in app dir, Next.js handles it.
    // However, older browsers look for favicon.ico. Next.js can generate it if we use icon.tsx, or we can use an external tool.
    // Let's just create public/favicon.ico by renaming a png if we really need to, but simply removing favicon.ico if it exists and letting Next.js use icon.png is better.
    
    console.log('Icons generated successfully.');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

processIcons();
