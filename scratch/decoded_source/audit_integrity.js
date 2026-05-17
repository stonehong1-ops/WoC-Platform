const fs = require('fs');

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

const report = {
    totalWoc: Object.keys(wocUsers).length,
    totalFree: Object.keys(freeUsers).length,
    missingNickname: [],
    dataDiscrepancies: [],
    onlyInWoc: [],
    onlyInFree: []
};

for (const [uid, wocData] of Object.entries(wocUsers)) {
    const freeData = normalizedFree[uid];
    
    if (!wocData.nickname) {
        report.missingNickname.push({ uid, wocData, freeData });
    } else if (freeData) {
        // Check for discrepancies in core fields
        if (wocData.nickname !== freeData.nickname || wocData.role !== freeData.role) {
            report.dataDiscrepancies.push({
                uid,
                woc: { nickname: wocData.nickname, role: wocData.role },
                free: { nickname: freeData.nickname, role: freeData.role }
            });
        }
    } else {
        report.onlyInWoc.push(uid);
    }
}

for (const uid of Object.keys(normalizedFree)) {
    if (!wocUsers[uid]) {
        report.onlyInFree.push(uid);
    }
}

console.log(`Total WOC: ${report.totalWoc}`);
console.log(`Total Free: ${report.totalFree}`);
console.log(`Missing nickname in WOC: ${report.missingNickname.length}`);
console.log(`Data discrepancies (WOC vs Free): ${report.dataDiscrepancies.length}`);
console.log(`Only in WOC: ${report.onlyInWoc.length}`);
console.log(`Only in Free: ${report.onlyInFree.length}`);

fs.writeFileSync('integrity_report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('Saved integrity_report.json');
