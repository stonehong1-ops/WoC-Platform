const fs = require('fs');
const https = require('https');

const MAPS_KEY = "AIzaSyBMSYywxC3FoqGAv6seFo0NsuPzXB2_1HU";

const seedContent = fs.readFileSync('scripts/seed-venues.js', 'utf-8');
const match = seedContent.match(/const venuesList = (\[[\s\S]*?\]);\n\nasync function seed/);
if (!match) {
  console.log("No match found for venuesList array.");
  process.exit(1);
}
let venuesList = eval(match[1]);

async function geocode(address) {
  return new Promise((resolve) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=ko&key=${MAPS_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            resolve(json.results[0].geometry.location); // {lat, lng}
          } else {
            console.log(`WARN: Geocode failed for ${address}`);
            resolve(null);
          }
        } catch(e) {
          console.error(`ERROR: JSON parsing failed for ${address}`, e);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`ERROR: HTTP request failed for ${address}`, err);
      resolve(null);
    });
  });
}

async function run() {
  const changes = [];
  const updatedVenues = [];

  for (let venue of venuesList) {
    const newCoords = await geocode(venue.address);
    let coordsToUse = venue.coordinates;
    let locationChanged = false;

    if (newCoords) {
      if (Math.abs(venue.coordinates.latitude - newCoords.lat) > 0.0001 || 
          Math.abs(venue.coordinates.longitude - newCoords.lng) > 0.0001) {
        changes.push({
          name: venue.nameKo,
          address: venue.address,
          old: venue.coordinates,
          new: { latitude: newCoords.lat, longitude: newCoords.lng }
        });
        coordsToUse = { latitude: newCoords.lat, longitude: newCoords.lng };
        locationChanged = true;
      }
    }
    
    updatedVenues.push({
      ...venue,
      coordinates: coordsToUse
    });

    console.log(`Audited ${venue.nameKo}: Changed? ${locationChanged ? 'Yes' : 'No'}`);
    
    // Rate limit delay to respect API limits
    await new Promise(r => setTimeout(r, 100));
  }
  
  fs.writeFileSync('scratch/changes.json', JSON.stringify(changes, null, 2));
  fs.writeFileSync('scratch/venues-updated.json', JSON.stringify(updatedVenues, null, 2));
  console.log(`Done. Found changes for ${changes.length} out of ${venuesList.length} venues.`);
}

run();
