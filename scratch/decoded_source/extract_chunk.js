const fs = require('fs');
const logPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\b9ef8859-cf30-4971-b10e-18aaed55bb92\\.system_generated\\logs\\overview.txt';
const content = fs.readFileSync(logPath, 'utf8');
const index = content.indexOf('6. <!DOCTYPE html>');
if (index !== -1) {
    console.log('Found marker at index', index);
    // Take a large enough chunk to cover the whole design
    const chunk = content.substring(index, index + 50000); 
    fs.writeFileSync('chunk_6.txt', chunk);
    console.log('Saved 50KB chunk to chunk_6.txt');
} else {
    console.log('Marker not found');
}
