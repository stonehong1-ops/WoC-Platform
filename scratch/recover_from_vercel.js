// Recovery script: Download source files from Vercel deployment AxFtAdQha
// Uses Vercel CLI's stored token to authenticate API calls

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'prj_KHsdwmmHoOrfA3JCPElaZADrpdPm';
const TEAM_ID = 'team_A4zsjBLbq6GjoqCFs1eMlhLF';

// Get token from vercel CLI
function getToken() {
  // Try to find token from global config
  const possiblePaths = [
    path.join(process.env.LOCALAPPDATA || '', 'com.vercel.cli', 'auth.json'),
    path.join(process.env.APPDATA || '', 'com.vercel.cli', 'auth.json'),
    path.join(process.env.USERPROFILE || '', '.vercel', 'auth.json'),
  ];
  
  for (const p of possiblePaths) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (data.token) return data.token;
      // Try nested structure
      if (data.tokens && data.tokens.length > 0) return data.tokens[0].token;
    } catch (e) {}
  }
  
  // Try extracting from vercel CLI debug output
  try {
    const result = execSync('npx -y vercel whoami --debug 2>&1', { encoding: 'utf-8', timeout: 15000 });
    const tokenMatch = result.match(/Token: (.+)/);
    if (tokenMatch) return tokenMatch[1].trim();
    
    // Try to find Bearer token
    const bearerMatch = result.match(/Bearer ([a-zA-Z0-9]+)/);
    if (bearerMatch) return bearerMatch[1];
  } catch (e) {}
  
  return null;
}

function apiCall(path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.vercel.com${path}`);
    if (TEAM_ID) url.searchParams.append('teamId', TEAM_ID);
    
    const req = https.get(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  console.log('🔍 Looking for Vercel auth token...');
  const token = getToken();
  if (!token) {
    console.log('❌ Could not find Vercel token. Try: npx vercel login');
    process.exit(1);
  }
  console.log('✅ Token found');
  
  // Step 1: List deployments to find AxFtAdQha
  console.log('\n📋 Listing recent deployments...');
  const deploys = await apiCall(`/v6/deployments?projectId=${PROJECT_ID}&limit=20`, token);
  
  if (!deploys.deployments) {
    console.log('❌ Failed to list deployments:', JSON.stringify(deploys).slice(0, 200));
    process.exit(1);
  }
  
  console.log(`Found ${deploys.deployments.length} deployments:`);
  for (const d of deploys.deployments.slice(0, 15)) {
    const date = new Date(d.created).toISOString();
    const shortId = d.uid?.slice(0, 9) || 'unknown';
    console.log(`  ${shortId} | ${date} | ${d.state} | ${d.url}`);
  }
  
  // The user identified AxFtAdQha as the 4th deployment (about 2h ago from ~10:24)
  // Let's find it by listing and letting user confirm
  console.log('\n🎯 Looking for deployment matching AxFtAdQha...');
  
  // Try to find by checking each deployment's meta
  let targetDeploy = null;
  for (const d of deploys.deployments) {
    // Check if the short ID matches
    if (d.uid && d.uid.toLowerCase().includes('axftadqha'.toLowerCase())) {
      targetDeploy = d;
      break;
    }
    // Also check the URL
    if (d.url && d.url.toLowerCase().includes('axftadqha'.toLowerCase())) {
      targetDeploy = d;
      break;
    }
  }
  
  if (!targetDeploy) {
    // Try matching by position - AxFtAdQha was the 4th Ready deployment (2h ago)
    const readyDeploys = deploys.deployments.filter(d => d.state === 'READY' || d.readyState === 'READY');
    console.log(`\nReady deployments (${readyDeploys.length}):`);
    readyDeploys.forEach((d, i) => {
      const date = new Date(d.created).toLocaleString();
      console.log(`  [${i}] ${d.uid?.slice(0,12)} | ${date} | ${d.url?.slice(0,60)}`);
    });
    
    // AxFtAdQha was ~2h before current, let's check timestamps
    // Current deployment was 39min ago at 10:24, so ~09:45
    // AxFtAdQha was 2h ago, so ~08:24
    // That means it was deployed around 2026-05-16T23:24 UTC
    console.log('\n⚠️  Could not find exact match. Saving deployment list for manual selection.');
  }

  if (targetDeploy) {
    console.log(`\n✅ Found target: ${targetDeploy.uid} | ${targetDeploy.url}`);
    await downloadDeploymentFiles(targetDeploy.uid, token);
  }
}

async function downloadDeploymentFiles(deployId, token) {
  console.log(`\n📂 Getting file tree for deployment ${deployId}...`);
  const files = await apiCall(`/v6/deployments/${deployId}/files`, token);
  
  if (!Array.isArray(files)) {
    console.log('File tree response:', JSON.stringify(files).slice(0, 500));
    return;
  }
  
  // Find src directory
  const srcDir = files.find(f => f.name === 'src');
  if (srcDir) {
    console.log(`Found src/ directory with ${srcDir.children?.length || 0} children`);
    // Recursively list important files
    await listAndDownload(deployId, srcDir, 'src', token);
  }
}

async function listAndDownload(deployId, node, currentPath, token) {
  if (node.type === 'file') {
    // Only download .tsx, .ts files in src/
    if (currentPath.match(/\.(tsx?|js|jsx)$/)) {
      console.log(`  📄 ${currentPath} (${node.uid})`);
    }
    return;
  }
  
  if (node.children) {
    for (const child of node.children) {
      await listAndDownload(deployId, child, `${currentPath}/${child.name}`, token);
    }
  }
}

main().catch(e => console.error('Error:', e.message));
