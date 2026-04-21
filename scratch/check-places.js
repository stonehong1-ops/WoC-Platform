const fs = require('fs');

async function searchPlaces() {
  const apiKey = "AIzaSyBMSYywxC3FoqGAv6seFo0NsuPzXB2_1HU";
  const targets = ["운포코데탱고", "탱고브루호", "플레이스오션", "홍대 보니따", "오나다2"];
  
  for (const name of targets) {
    const query = encodeURIComponent(name);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}&language=ko`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        console.log(`\n=== ${name} ===`);
        const place = data.results[0];
        console.log(`Matched name: ${place.name}`);
        console.log(`Address: ${place.formatted_address}`);
        console.log(`Coordinates: ${place.geometry.location.lat}, ${place.geometry.location.lng}`);
      } else {
        console.log(`\n=== ${name} ===`);
        console.log(`No results found.`);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

searchPlaces();
