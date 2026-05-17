const fs = require('fs');
const path = require('path');

const woc_file = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\198c5f21-be48-41c4-850c-c04866c93693\\.system_generated\\steps\\4696\\output.txt';
const free_file = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\198c5f21-be48-41c4-850c-c04866c93693\\.system_generated\\steps\\4705\\output.txt';

function extractVal(field) {
    if (!field) return null;
    if ('stringValue' in field) return field.stringValue;
    if ('booleanValue' in field) return field.booleanValue;
    if ('timestampValue' in field) return field.timestampValue;
    if ('integerValue' in field) return field.integerValue;
    return null;
}

function loadUsers(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const users = {};
    (data.documents || []).forEach(doc => {
        const fields = doc.fields || {};
        const uid = doc.name.split('/').pop();
        const userData = {};
        for (const [k, v] of Object.entries(fields)) {
            userData[k] = extractVal(v);
        }
        users[uid] = userData;
    });
    return users;
}

const wocUsers = loadUsers(woc_file);
const freeUsers = loadUsers(free_file);

const normalizedFree = {};
for (const [uid, data] of Object.entries(freeUsers)) {
    const normId = uid.startsWith('010') ? '+82' + uid.substring(1) : uid;
    normalizedFree[normId] = data;
}

const updates = [];
let corruptedCount = 0;

for (const [uid, data] of Object.entries(wocUsers)) {
    if (!data.nickname) {
        const source = normalizedFree[uid];
        if (source) {
            updates.push({
                uid,
                sourceData: source,
                type: 'recovery'
            });
            corruptedCount++;
        } else {
            updates.push({
                uid,
                type: 'unknown_corrupted'
            });
        }
    }
}

console.log(`Total WOC users: ${Object.keys(wocUsers).length}`);
console.log(`Total Freestyle users: ${Object.keys(freeUsers).length}`);
console.log(`Corrupted users found in WOC: ${corruptedCount}`);
console.log(`Users found in WOC but not in Freestyle (unknown): ${updates.filter(u => u.type === 'unknown_corrupted').length}`);

fs.writeFileSync('recovery_work_items.json', JSON.stringify(updates, null, 2), 'utf8');
console.log('Saved recovery_work_items.json');
