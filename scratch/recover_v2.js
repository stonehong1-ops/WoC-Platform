// V2: Use vercel CLI's internal token to call the API
const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const DEPLOY_ID = 'dpl_AxFtAdQhaMEhsVyPk2buKoGSavKs';
const TEAM_ID = 'team_A4zsjBLbq6GjoqCFs1eMlhLF';
const RECOVERY_DIR = path.join(__dirname, 'recovered_source');

// Extract token from vercel CLI's internal config
function getToken() {
  try {
    // Vercel stores global config at ~/.config/com.vercel.cli or similar
    const configPaths = [
      path.join(process.env.XDG_CONFIG_HOME || path.join(process.env.USERPROFILE, '.config'), 'com.vercel.cli', 'auth.json'),
      path.join(process.env.USERPROFILE, '.config', 'com.vercel.cli', 'auth.json'),
    ];
    
    for (const p of configPaths) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (data.token) return data.token;
      } catch(e) {}
    }
  } catch(e) {}
  
  // Last resort: try to use the vercel CLI's internal call
  try {
    // The vercel CLI uses a global config at ~/.config/com.vercel.cli
    const globalDir = path.join(process.env.USERPROFILE, '.config', 'com.vercel.cli');
    if (fs.existsSync(globalDir)) {
      const files = fs.readdirSync(globalDir);
      console.log('Config dir files:', files);
      for (const f of files) {
        try {
          const content = fs.readFileSync(path.join(globalDir, f), 'utf-8');
          if (content.includes('token')) {
            const parsed = JSON.parse(content);
            if (parsed.token) return parsed.token;
          }
        } catch(e) {}
      }
    }
  } catch(e) {}
  
  return null;
}

function apiCall(apiPath) {
  return new Promise((resolve, reject) => {
    // Use vercel CLI to make the call via a proxy approach
    try {
      // Direct approach: use node-fetch style with vercel's stored credentials
      const url = `https://api.vercel.com${apiPath}${apiPath.includes('?') ? '&' : '?'}teamId=${TEAM_ID}`;
      
      const result = execSync(`npx -y vercel inspect ${DEPLOY_ID} 2>&1`, { encoding: 'utf-8', timeout: 15000 });
      resolve(result);
    } catch(e) {
      reject(e);
    }
  });
}

async function main() {
  // Check if token exists anywhere
  const token = getToken();
  
  if (token) {
    console.log('✅ Found token, using API directly');
    await downloadWithToken(token);
  } else {
    console.log('⚠️ No token found in config files.');
    console.log('Trying alternative approach: checking for Vercel environment token...');
    
    // Check if there's a VERCEL_TOKEN env var
    if (process.env.VERCEL_TOKEN) {
      await downloadWithToken(process.env.VERCEL_TOKEN);
    } else {
      // List where vercel might store config
      const home = process.env.USERPROFILE;
      const checkDirs = [
        path.join(home, '.config'),
        path.join(home, '.config', 'com.vercel.cli'),
        path.join(home, '.vercel'),
        path.join(home, 'AppData', 'Roaming', 'com.vercel.cli'),
      ];
      
      for (const d of checkDirs) {
        try {
          if (fs.existsSync(d)) {
            const items = fs.readdirSync(d);
            console.log(`📁 ${d}: [${items.join(', ')}]`);
            
            // Read any JSON files
            for (const item of items) {
              const fp = path.join(d, item);
              const stat = fs.statSync(fp);
              if (stat.isFile() && item.endsWith('.json')) {
                const content = fs.readFileSync(fp, 'utf-8');
                if (content.includes('token')) {
                  console.log(`  🔑 ${item} contains "token"!`);
                  try {
                    const parsed = JSON.parse(content);
                    console.log(`  Keys: ${Object.keys(parsed).join(', ')}`);
                    if (parsed.token) {
                      console.log('  ✅ Found token!');
                      await downloadWithToken(parsed.token);
                      return;
                    }
                  } catch(e) {}
                }
              }
            }
          }
        } catch(e) {}
      }
      
      console.log('\n❌ Cannot find Vercel token. Manual token needed.');
      console.log('Run: npx vercel login');
      console.log('Or set VERCEL_TOKEN env variable');
    }
  }
}

async function downloadWithToken(token) {
  console.log('\n📂 Fetching file tree from deployment...');
  
  const files = await fetchAPI(`/v6/deployments/${DEPLOY_ID}/files`, token);
  
  if (!Array.isArray(files)) {
    console.log('Response:', JSON.stringify(files).slice(0, 300));
    return;
  }
  
  // Create recovery directory
  if (!fs.existsSync(RECOVERY_DIR)) fs.mkdirSync(RECOVERY_DIR, { recursive: true });
  
  // Find src directory
  const srcDir = files.find(f => f.name === 'src');
  if (!srcDir) {
    console.log('No src/ dir found. Top-level files:', files.map(f => f.name).join(', '));
    return;
  }
  
  // Collect all .tsx/.ts files we want to recover
  const targetFiles = [];
  collectFiles(srcDir, 'src', targetFiles);
  
  console.log(`\nFound ${targetFiles.length} source files to download`);
  
  // Download each file
  for (const tf of targetFiles) {
    try {
      const content = await fetchAPI(`/v6/deployments/${DEPLOY_ID}/files/${tf.uid}`, token);
      const outPath = path.join(RECOVERY_DIR, tf.path);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, typeof content === 'string' ? content : JSON.stringify(content));
      console.log(`  ✅ ${tf.path}`);
    } catch(e) {
      console.log(`  ❌ ${tf.path}: ${e.message}`);
    }
  }
  
  console.log(`\n🎉 Recovery complete! Files saved to: ${RECOVERY_DIR}`);
}

function collectFiles(node, currentPath, result) {
  if (node.type === 'file') {
    if (currentPath.match(/\.(tsx?|jsx?|css|json)$/) && !currentPath.includes('node_modules')) {
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

function fetchAPI(apiPath, token) {
  return new Promise((resolve, reject) => {
    const url = `https://api.vercel.com${apiPath}?teamId=${TEAM_ID}`;
    
    https.get(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

main().catch(e => console.error('Fatal:', e));
