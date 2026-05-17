// V4: Use correct API version (v8) and proper file content download
const https = require('https');
const fs = require('fs');
const path = require('path');

const DEPLOY_ID = 'dpl_AxFtAdQhaMEhsVyPk2buKoGSavKs';
const TEAM_ID = 'team_A4zsjBLbq6GjoqCFs1eMlhLF';
const RECOVERY_DIR = path.join(__dirname, 'recovered_v4');

const authPath = path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
const TOKEN = auth.token;

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
    // Only collect source files we care about
    if (currentPath.match(/\.(tsx?|jsx?|css)$/)) {
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
  console.log('✅ Token ready');
  
  // Try different API versions for file listing
  console.log('📂 Fetching file tree (v8)...');
  let files = await fetchAPI(`/v8/deployments/${DEPLOY_ID}/files`);
  
  if (files.error) {
    console.log('v8 error:', files.error.message);
    console.log('Trying v7...');
    files = await fetchAPI(`/v7/deployments/${DEPLOY_ID}/files`);
  }
  
  if (files.error) {
    console.log('v7 error:', files.error.message);
    console.log('Trying v5...');
    files = await fetchAPI(`/v5/deployments/${DEPLOY_ID}/files`);
  }

  if (files.error) {
    console.log('v5 error:', files.error.message);
    // Try the newer endpoint format
    console.log('Trying /v13/deployments/{id}...');
    const deployInfo = await fetchAPI(`/v13/deployments/${DEPLOY_ID}`);
    if (deployInfo.error) {
      console.log('v13 deploy error:', deployInfo.error.message);
    } else {
      console.log('Deploy info keys:', Object.keys(deployInfo));
      console.log('Deploy readyState:', deployInfo.readyState);
      console.log('Deploy url:', deployInfo.url);
      
      // Try getting source via the deployment source endpoint
      console.log('\nTrying /v8/deployments/{id}/files/src...');
      const srcFiles = await fetchAPI(`/v8/deployments/${DEPLOY_ID}/files/src`);
      console.log('src files type:', typeof srcFiles);
      if (Array.isArray(srcFiles)) {
        console.log('Found', srcFiles.length, 'files in src/');
      } else if (srcFiles.error) {
        console.log('Error:', srcFiles.error.message);
      } else {
        console.log('Response:', JSON.stringify(srcFiles).slice(0, 200));
      }
    }
    return;
  }
  
  if (!Array.isArray(files)) {
    console.log('Unexpected response:', JSON.stringify(files).slice(0, 500));
    return;
  }
  
  console.log('Top level:', files.map(f => f.name).join(', '));
  
  // Find src directory
  const srcDir = files.find(f => f.name === 'src');
  if (!srcDir || !srcDir.children) {
    console.log('Need to fetch src children separately');
    // The file tree might need recursive fetching
    for (const f of files) {
      if (f.name === 'src' && f.uid) {
        const children = await fetchAPI(`/v8/deployments/${DEPLOY_ID}/files/${f.uid}`);
        console.log('src children:', JSON.stringify(children).slice(0, 300));
      }
    }
    return;
  }
  
  const allFiles = [];
  collectFiles(srcDir, 'src', allFiles);
  console.log(`Found ${allFiles.length} source files`);
  
  // Download with correct API version
  if (!fs.existsSync(RECOVERY_DIR)) fs.mkdirSync(RECOVERY_DIR, { recursive: true });
  
  let downloaded = 0;
  for (let i = 0; i < allFiles.length; i += 5) {
    const batch = allFiles.slice(i, i + 5);
    await Promise.all(batch.map(async (tf) => {
      try {
        // Try v8 for file content
        const content = await fetchAPI(`/v8/deployments/${DEPLOY_ID}/files/${tf.uid}`);
        const outPath = path.join(RECOVERY_DIR, tf.path);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        
        if (typeof content === 'string') {
          fs.writeFileSync(outPath, content);
        } else if (content.error) {
          // Try raw content endpoint
          fs.writeFileSync(outPath, `ERROR: ${content.error.message}`);
        } else {
          fs.writeFileSync(outPath, JSON.stringify(content, null, 2));
        }
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
