const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcImage = 'public/icons/icon-512x512.png';
const resDir = 'android/app/src/main/res';

// 아이콘 로고 비율: 60% (스톤님 지시사항)
const LOGO_RATIO = 0.60;

// Mipmap configurations for Adaptive Foreground (transparent bg)
const foregroundConfigs = [
  { dir: 'mipmap-mdpi', size: 108 },
  { dir: 'mipmap-hdpi', size: 162 },
  { dir: 'mipmap-xhdpi', size: 216 },
  { dir: 'mipmap-xxhdpi', size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 }
];

// Mipmap configurations for Legacy & Round Icons (white bg)
const legacyConfigs = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

async function generateIcons() {
  try {
    console.log(`✂️ Clipping raw logo text (removing borders) ... [Ratio: ${LOGO_RATIO * 100}%]`);
    
    // Extract actual logo text area (width: 413, height: 148) from 512x512 original
    const logoBuffer = await sharp(srcImage)
      .extract({ left: 59, top: 188, width: 413, height: 148 })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = logoBuffer;

    // Process clipped image to make white background transparent and extract clean text
    const processedPixels = Buffer.alloc(info.width * info.height * 4);
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        let idx = (y * info.width + x) * 4;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];
        let a = data[idx+3];

        let avg = (r + g + b) / 3;
        
        if (r > 195 && g > 195 && b > 195) {
          // Make white background transparent
          processedPixels[idx] = 0;
          processedPixels[idx+1] = 0;
          processedPixels[idx+2] = 0;
          processedPixels[idx+3] = 0;
        } else {
          // Retain black letters, calculating smooth anti-aliased transparency
          processedPixels[idx] = 0;
          processedPixels[idx+1] = 0;
          processedPixels[idx+2] = 0;
          
          // Smooth transparency mapping based on brightness
          let trans = Math.round(255 - avg);
          processedPixels[idx+3] = Math.max(0, Math.min(255, trans));
        }
      }
    }

    // Temporary transparent PNG buffer of clean logo
    const cleanLogoBuffer = await sharp(processedPixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    }).png().toBuffer();

    console.log(`✨ Regenerating Adaptive Icon Foregrounds (${LOGO_RATIO * 100}% logo size, transparent bg) ...`);
    for (const config of foregroundConfigs) {
      const targetWidth = Math.round(config.size * LOGO_RATIO);
      const targetHeight = Math.round((targetWidth / info.width) * info.height);

      const resizedLogo = await sharp(cleanLogoBuffer)
        .resize(targetWidth, targetHeight)
        .toBuffer();

      const destPath = path.join(resDir, config.dir, 'ic_launcher_foreground.png');
      
      // Composite resized logo onto transparent canvas
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
      
      console.log(`[Generated] ${destPath} (${config.size}x${config.size})`);
    }

    console.log(`✨ Regenerating Legacy Launch & Round Icons (${LOGO_RATIO * 100}% logo size, solid white bg) ...`);
    for (const config of legacyConfigs) {
      const targetWidth = Math.round(config.size * LOGO_RATIO);
      const targetHeight = Math.round((targetWidth / info.width) * info.height);

      const resizedLogo = await sharp(cleanLogoBuffer)
        .resize(targetWidth, targetHeight)
        .toBuffer();

      // Legacy Icon (white bg)
      const destPath = path.join(resDir, config.dir, 'ic_launcher.png');
      await sharp({
        create: {
          width: config.size,
          height: config.size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toFile(destPath);

      // Round Icon (white bg)
      const destRoundPath = path.join(resDir, config.dir, 'ic_launcher_round.png');
      await sharp({
        create: {
          width: config.size,
          height: config.size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toFile(destRoundPath);
      
      console.log(`[Generated] ${destPath} & ${destRoundPath} (${config.size}x${config.size})`);
    }

    console.log("🎉 All Android launchers regenerated successfully!");
  } catch (error) {
    console.error("❌ Error generating launcher icons:", error);
  }
}

generateIcons();
