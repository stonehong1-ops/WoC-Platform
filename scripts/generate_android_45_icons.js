const sharp = require('sharp');
const path = require('path');

const srcImage = 'public/icons/icon-512x512.png';
const resDir = 'android/app/src/main/res';

const SCALE_FACTOR = 0.45;

const foregroundConfigs = [
  { dir: 'mipmap-mdpi', size: 108 },
  { dir: 'mipmap-hdpi', size: 162 },
  { dir: 'mipmap-xhdpi', size: 216 },
  { dir: 'mipmap-xxhdpi', size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 }
];

async function generate() {
  console.log("Extracting logo from source...");
  
  const logoBuffer = await sharp(srcImage)
    .extract({ left: 59, top: 188, width: 413, height: 148 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = logoBuffer;

  const processedPixels = Buffer.alloc(info.width * info.height * 4);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      let idx = (y * info.width + x) * 4;
      let r = data[idx], g = data[idx+1], b = data[idx+2];
      let avg = (r + g + b) / 3;
      
      if (r > 195 && g > 195 && b > 195) {
        processedPixels[idx] = 0;
        processedPixels[idx+1] = 0;
        processedPixels[idx+2] = 0;
        processedPixels[idx+3] = 0;
      } else {
        processedPixels[idx] = 0;
        processedPixels[idx+1] = 0;
        processedPixels[idx+2] = 0;
        processedPixels[idx+3] = Math.max(0, Math.min(255, Math.round(255 - avg)));
      }
    }
  }

  const cleanLogoBuffer = await sharp(processedPixels, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();

  for (const config of foregroundConfigs) {
    const targetWidth = Math.round(config.size * SCALE_FACTOR);
    const targetHeight = Math.round((targetWidth / info.width) * info.height);

    const resizedLogo = await sharp(cleanLogoBuffer)
      .resize(targetWidth, targetHeight)
      .toBuffer();

    const destPath = path.join(resDir, config.dir, 'ic_launcher_foreground.png');
    
    await sharp({
      create: {
        width: config.size,
        height: config.size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: resizedLogo, gravity: 'center' }])
    .png()
    .toFile(destPath);
    
    console.log(`[OK] ${config.dir} (${config.size}x${config.size}, logo width: ${targetWidth}px, ratio: ${(targetWidth/config.size*100).toFixed(1)}%)`);
  }

  console.log("Done. Verifying xxxhdpi...");
  const xxxhdpi = path.join(resDir, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png');
  const meta = await sharp(xxxhdpi).metadata();
  const trim = await sharp(xxxhdpi).trim().toBuffer({ resolveWithObject: true });
  console.log(`xxxhdpi canvas: ${meta.width}x${meta.height}, logo: ${trim.info.width}x${trim.info.height}, ratio: ${(trim.info.width/meta.width*100).toFixed(1)}%`);
}

generate().catch(console.error);
