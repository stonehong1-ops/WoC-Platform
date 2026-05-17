// V3: Recovery with correct token path
const https = require('https');
const fs = require('fs');
const path = require('path');

const DEPLOY_ID = 'dpl_AxFtAdQhaMEhsVyPk2buKoGSavKs';
const TEAM_ID = 'team_A4zsjBLbq6GjoqCFs1eMlhLF';
const RECOVERY_DIR = path.join(__dirname, 'recovered_source');

// Read token from correct location
const authPath = path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
const TOKEN = auth.token;

if (!TOKEN) {
  console.log('❌ No token in auth.json');
  process.exit(1);
}
console.log('✅ Token found');

function fetchAPI(apiPath) {
  return new Promise((resolve, reject) => {
    const sep = apiPath.includes('?') ? '&' : '?';
    const url = `https://api.vercel.com${apiPath}${sep}teamId=${TEAM_ID}`;
    
    https.get(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf-8');
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function collectFiles(node, currentPath, result) {
  if (node.type === 'file') {
    if (currentPath.match(/\.(tsx?|jsx?|css)$/) && !currentPath.includes('node_modules')) {
      result.push({ path: currentPath, uid: node.uid });
    }
    return;
  }
  if (node.children) {
    for (const child of node.children) {
      collectFiles(child, `${currentPath}/${child.name}`, result);
    }
  }
}

async function main() {
  console.log('📂 Fetching file tree...');
  const files = await fetchAPI(`/v6/deployments/${DEPLOY_ID}/files`);
  
  if (files.error) {
    console.log('API Error:', files.error);
    process.exit(1);
  }
  
  if (!Array.isArray(files)) {
    console.log('Unexpected response:', JSON.stringify(files).slice(0, 500));
    process.exit(1);
  }
  
  console.log('Top level:', files.map(f => f.name).join(', '));
  
  const srcDir = files.find(f => f.name === 'src');
  if (!srcDir) {
    console.log('No src/ found');
    process.exit(1);
  }
  
  const allFiles = [];
  collectFiles(srcDir, 'src', allFiles);
  console.log(`Found ${allFiles.length} source files to download`);
  
  // Create recovery dir
  if (!fs.existsSync(RECOVERY_DIR)) fs.mkdirSync(RECOVERY_DIR, { recursive: true });
  
  // Download files in batches of 5
  let downloaded = 0;
  for (let i = 0; i < allFiles.length; i += 5) {
    const batch = allFiles.slice(i, i + 5);
    await Promise.all(batch.map(async (tf) => {
      try {
        const content = await fetchAPI(`/v6/deployments/${DEPLOY_ID}/files/${tf.uid}`);
        const outPath = path.join(RECOVERY_DIR, tf.path);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
        downloaded++;
      } catch(e) {
        console.log(`  ❌ ${tf.path}: ${e.message}`);
      }
    }));
    process.stdout.write(`\r  Downloaded: ${downloaded}/${allFiles.length}`);
  }
  
  console.log(`\n\n🎉 Done! ${downloaded} files saved to: ${RECOVERY_DIR}`);
}

main().catch(e => console.error('Fatal:', e));
