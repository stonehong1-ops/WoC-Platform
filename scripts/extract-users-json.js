const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\9160f435-8240-4da8-8237-f737bb0be6c6\\.system_generated\\steps\\1858\\output.txt';
const outputPath = 'scripts/users-for-migration.json';

try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(rawData);
    
    const users = data.documents.map(doc => {
        const fields = doc.fields;
        const nameParts = doc.name.split('/');
        const uid = nameParts[nameParts.length - 1];
        
        return {
            uid: uid,
            nickname: fields.nickname ? fields.nickname.stringValue : 'Unknown',
            nativeNickname: fields.nativeNickname ? fields.nativeNickname.stringValue : '',
            photoURL: fields.photoURL ? fields.photoURL.stringValue : '/anonymous-user.png',
            phoneNumber: fields.phoneNumber ? fields.phoneNumber.stringValue : uid,
            createdAt: doc.createTime
        };
    });
    
    fs.writeFileSync(outputPath, JSON.stringify(users, null, 2));
    console.log(`Extracted ${users.length} users to ${outputPath}`);
} catch (err) {
    console.error('Extraction failed:', err);
}
