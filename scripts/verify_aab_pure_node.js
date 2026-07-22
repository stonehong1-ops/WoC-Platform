const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const zlib = require('zlib');

const aabPath = path.resolve('android/app/build/outputs/bundle/release/app-release.aab');
const inspectDir = path.resolve('android/build/tmp/aab_inspect_node');

if (fs.existsSync(inspectDir)) fs.rmSync(inspectDir, { recursive: true, force: true });
fs.mkdirSync(inspectDir, { recursive: true });

// Minimal Zip Parser in pure JS
function readZipEntries(buffer) {
  let entries = [];
  // Find End of Central Directory Record (EOCD)
  let eocdOffset = buffer.length - 22;
  while (eocdOffset >= 0) {
    if (buffer.readUInt32LE(eocdOffset) === 0x06054b50) break;
    eocdOffset--;
  }
  if (eocdOffset < 0) throw new Error("Invalid ZIP file");

  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const cdCount = buffer.readUInt16LE(eocdOffset + 10);

  let offset = cdOffset;
  for (let i = 0; i < cdCount; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const uncompSize = buffer.readUInt32LE(offset + 24);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);

    const filename = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);

    entries.push({
      filename,
      method,
      compSize,
      uncompSize,
      localHeaderOffset
    });

    offset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function extractFile(buffer, entry) {
  const localOffset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error("Invalid Local Header");
  const nameLen = buffer.readUInt16LE(localOffset + 26);
  const extraLen = buffer.readUInt16LE(localOffset + 28);
  const dataOffset = localOffset + 30 + nameLen + extraLen;
  const compData = buffer.subarray(dataOffset, dataOffset + entry.compSize);

  if (entry.method === 0) {
    return compData;
  } else if (entry.method === 8) {
    return zlib.inflateRawSync(compData);
  } else {
    throw new Error(`Unsupported compression method ${entry.method}`);
  }
}

async function verifyAAB() {
  console.log('📌 Reading AAB file...');
  const aabBuffer = fs.readFileSync(aabPath);
  console.log('🔍 Parsing Central Directory...');
  const entries = readZipEntries(aabBuffer);

  const iconEntries = entries.filter(e => e.filename.includes('ic_launcher') && e.filename.endsWith('.png'));
  console.log(`🎯 Found ${iconEntries.length} icon files inside AAB:\n`);

  for (const entry of iconEntries) {
    const fileData = extractFile(aabBuffer, entry);
    const meta = await sharp(fileData).metadata();
    
    // Trim transparency to measure actual logo content width
    const trimInfo = await sharp(fileData).trim().toBuffer({ resolveWithObject: true });
    const logoWidth = trimInfo.info.width;
    const logoHeight = trimInfo.info.height;
    const ratio = ((logoWidth / meta.width) * 100).toFixed(1);

    console.log(` ✅ [Verified AAB Resource] ${entry.filename}`);
    console.log(`    Canvas: ${meta.width}x${meta.height}px | Inner Logo Size: ${logoWidth}x${logoHeight}px (${ratio}% of canvas width)\n`);
  }
}

verifyAAB().catch(console.error);
