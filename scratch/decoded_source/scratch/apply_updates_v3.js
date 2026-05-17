const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const updatesFile = 'C:/Users/stone/.gemini/antigravity/brain/dc58e2cc-d9ad-4ce7-a730-2dc73b2b12b3/scratch/updates_v2.json';
const updates = JSON.parse(fs.readFileSync(updatesFile, 'utf8'));

const scratchDir = 'C:/Users/stone/WoC/scratch';
if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
}

for (const update of updates) {
    const data = { description: update.description };
    const tempFile = path.join(scratchDir, `temp_${update.id}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(data));
    
    console.log(`Updating ${update.title} (${update.id})...`);
    try {
        // Use the temp file to avoid quoting issues
        const command = `npx -y firebase-tools firestore:set --merge socials/${update.id} ${tempFile} --project woc-platform-seoul-1234`;
        execSync(command, { stdio: 'inherit' });
        fs.unlinkSync(tempFile);
    } catch (error) {
        console.error(`Failed to update ${update.id}:`, error.message);
    }
}
