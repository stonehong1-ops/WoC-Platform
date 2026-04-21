const fs = require('fs');
const listPath = 'C:/Users/stone/.gemini/antigravity/brain/863c0cf6-6bad-4da4-a5ae-ea3e836657b3/.system_generated/steps/198/output.txt';
const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const changes = JSON.parse(fs.readFileSync('scratch/changes.json', 'utf8'));

const nameToDoc = {};
list.documents.forEach(d => {
  if (d.fields && d.fields.nameKo) {
    nameToDoc[d.fields.nameKo.stringValue] = d;
  }
});

let count = 0;
const toolCalls = [];
changes.forEach(c => {
  const doc = nameToDoc[c.name];
  if (doc) {
    toolCalls.push({
      document: {
        name: doc.name,
        fields: {
          coordinates: {
            mapValue: {
              fields: {
                latitude: { doubleValue: c.new.latitude },
                longitude: { doubleValue: c.new.longitude }
              }
            }
          }
        }
      },
      updateMask: "coordinates",
      toolAction: `Updating coordinates for ${c.name}`,
      toolSummary: "Firestore update",
      waitForPreviousTools: false
    });
    count++;
  }
});

fs.writeFileSync('scratch/update-payloads.json', JSON.stringify(toolCalls, null, 2));
console.log('Saved payloads for ' + count + ' venues to scratch/update-payloads.json');
