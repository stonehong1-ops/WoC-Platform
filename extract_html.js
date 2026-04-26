const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\84e1fa76-c970-4813-905c-505e61c47663\\.system_generated\\logs\\overview.txt', 'utf8').split('\n');
const getStep = (idx) => {
  for(let line of lines) {
    if(line.includes('"step_index":'+idx)) {
      const data = JSON.parse(line);
      return data.content;
    }
  }
  return '';
};
if (!fs.existsSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\84e1fa76-c970-4813-905c-505e61c47663\\scratch')) {
    fs.mkdirSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\84e1fa76-c970-4813-905c-505e61c47663\\scratch');
}
fs.writeFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\84e1fa76-c970-4813-905c-505e61c47663\\scratch\\history_html.txt', getStep(9157));
fs.writeFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\84e1fa76-c970-4813-905c-505e61c47663\\scratch\\details_html.txt', getStep(9205));
console.log('done');
