const fs = require('fs');
const data = fs.readFileSync('C:\\Users\\stone\\.gemini\\antigravity\\brain\\9cc0f354-0e6c-4c1d-85ae-e27867a7a51e\\.system_generated\\steps\\3277\\output.txt', 'utf8');
const parsed = JSON.parse(data);
const docsArray = parsed.documents || parsed;
const ft = docsArray.find(d => d.fields && d.fields.name && d.fields.name.stringValue === 'Freestyle Tango');
if (ft) {
  console.log('Found Freestyle Tango group');
  console.log('Fields keys:', Object.keys(ft.fields));
  if (ft.fields.venueId) console.log('venueId:', ft.fields.venueId);
  else console.log('venueId is missing');
} else {
  console.log('Not found');
}
