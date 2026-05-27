const fs = require('fs');
const files = [
  'shop/WishlistTray.tsx',
  'groups/MyGroupsTray.tsx',
  'lost/LostFoundWishlistTray.tsx',
  'rental/RentalWishlistTray.tsx',
  'resale/ResaleWishlistTray.tsx',
  'stay/StayWishlistTray.tsx'
];

files.forEach(f => {
  const p = 'c:/Users/stone/WoC/src/components/' + f;
  if(fs.existsSync(p)){
    let c = fs.readFileSync(p, 'utf8');
    const oldStr = 'className="fixed bottom-24 left-0 right-0 z-[60] pointer-events-none flex justify-center px-6"';
    const newStr = 'className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100vw-3rem)] max-w-sm pointer-events-none flex justify-center"';
    if(c.includes(oldStr)) {
      c = c.replace(oldStr, newStr);
      fs.writeFileSync(p, c);
      console.log('Updated ' + f);
    } else {
      console.log('String not found in ' + f);
    }
  } else {
    console.log('Not found: ' + f);
  }
});
