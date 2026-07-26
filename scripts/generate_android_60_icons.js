const sharp = require('sharp');
const path = require('path');

const srcImage = 'public/icons/icon-512x512.png';
const resDir = 'android/app/src/main/res';

const SCALE_FACTOR = 0.60;

const configs = [
  { dir: 'mipmap-mdpi', fgSize: 108, iconSize: 48 },
  { dir: 'mipmap-hdpi', fgSize: 162, iconSize: 72 },
  { dir: 'mipmap-xhdpi', fgSize: 216, iconSize: 96 },
  { dir: 'mipmap-xxhdpi', fgSize: 324, iconSize: 144 },
  { dir: 'mipmap-xxxhdpi', fgSize: 432, iconSize: 192 }
];

async function generateAll60Icons() {
  console.log("Extracting FULL untruncated logo from source...");
  
  // Extract untruncated logo bounds: left 30, top 188, width 453, height 148
  const logoBuffer = await sharp(srcImage)
    .extract({ left: 30, top: 188, width: 453, height: 148 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = logoBuffer;

  const processedPixels = Buffer.alloc(info.width * info.height * 4);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      let idx = (y * info.width + x) * 4;
      let r = data[idx], g = data[idx+1], b = data[idx+2];
      let avg = (r + g + b) / 3;
      
      if (r > 190 && g > 190 && b > 190) {
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

  for (const config of configs) {
    // 1. Generate ic_launcher_foreground.png (transparent background, 60% of canvas)
    const targetFgWidth = Math.round(config.fgSize * SCALE_FACTOR);
    const targetFgHeight = Math.round((targetFgWidth / info.width) * info.height);

    const resizedFgLogo = await sharp(cleanLogoBuffer)
      .resize(targetFgWidth, targetFgHeight)
      .toBuffer();

    const fgPath = path.join(resDir, config.dir, 'ic_launcher_foreground.png');
    await sharp({
      create: {
        width: config.fgSize,
        height: config.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: resizedFgLogo, gravity: 'center' }])
    .png()
    .toFile(fgPath);

    // 2. Generate ic_launcher.png (square white background, 60% of canvas)
    const targetIconWidth = Math.round(config.iconSize * SCALE_FACTOR);
    const targetIconHeight = Math.round((targetIconWidth / info.width) * info.height);

    const resizedIconLogo = await sharp(cleanLogoBuffer)
      .resize(targetIconWidth, targetIconHeight)
      .toBuffer();

    const iconPath = path.join(resDir, config.dir, 'ic_launcher.png');
    await sharp({
      create: {
        width: config.iconSize,
        height: config.iconSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 255 }
      }
    })
    .composite([{ input: resizedIconLogo, gravity: 'center' }])
    .png()
    .toFile(iconPath);

    // 3. Generate ic_launcher_round.png (circular white mask background, 60% of canvas)
    const roundSvgMask = Buffer.from(
      `<svg width="${config.iconSize}" height="${config.iconSize}">` +
      `<circle cx="${config.iconSize/2}" cy="${config.iconSize/2}" r="${config.iconSize/2}" fill="#ffffff"/>` +
      `</svg>`
    );

    const roundPath = path.join(resDir, config.dir, 'ic_launcher_round.png');
    await sharp({
      create: {
        width: config.iconSize,
        height: config.iconSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      { input: roundSvgMask, top: 0, left: 0 },
      { input: resizedIconLogo, gravity: 'center' }
    ])
    .png()
    .toFile(roundPath);

    console.log(`[OK] ${config.dir} -> FG: ${config.fgSize}px (${targetFgWidth}px, 60%), Icon: ${config.iconSize}px (${targetIconWidth}px, 60%)`);
  }

  console.log("All 60% icons (Foreground + Legacy + Round) generated successfully!");
}

generateAll60Icons().catch(console.error);
