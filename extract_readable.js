const fs = require('fs');
const content = fs.readFileSync('original_design.html', 'utf8');
// Extract the body content
const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (bodyMatch) {
    const body = bodyMatch[1];
    // Split by common block elements to make it readable
    const readable = body.replace(/<(div|section|header|footer|h1|h2|h3|p|button)/g, '\n<$1');
    fs.writeFileSync('readable_body.html', readable);
    console.log('Readable body saved to readable_body.html');
} else {
    console.log('No body found');
    // If no body, just format the whole thing
    const readable = content.replace(/<(div|section|header|footer|h1|h2|h3|p|button)/g, '\n<$1');
    fs.writeFileSync('readable_body.html', readable);
}
