const fs = require('fs');
const files = [
  'src/components/shop/WishlistTray.tsx',
  'src/components/groups/MyGroupsTray.tsx',
  'src/components/lost/LostFoundWishlistTray.tsx',
  'src/components/rental/RentalWishlistTray.tsx',
  'src/components/resale/ResaleWishlistTray.tsx',
  'src/components/stay/StayWishlistTray.tsx'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(
      /className="fixed bottom-24 left-1\/2 -translate-x-1\/2 z-\[60\] w-\[calc\(100vw-3rem\)\] max-w-sm pointer-events-none flex justify-center"/g,
      'className="fixed bottom-24 inset-x-0 z-[60] px-6 w-full max-w-sm mx-auto pointer-events-none flex justify-center"'
    );
    fs.writeFileSync(f, content);
    console.log(`Updated ${f}`);
  }
}
