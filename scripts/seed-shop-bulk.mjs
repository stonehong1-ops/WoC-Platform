import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8'));
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

// Helper
const p = (groupId, groupName, brand, title, desc, cat, price, dp, opts, stock, img) => ({
  groupId, groupName, brand, title, description: desc, category: cat,
  currency: 'KRW', price, ...(dp ? { discountPrice: dp } : {}),
  options: opts, stock, images: [img], status: 'Active', likesCount: 0, viewsCount: 0,
});

const S = (u) => `https://images.unsplash.com/${u}?w=600`;

const PRODUCTS = [
  // === TANGO SHOES KOREA (add 6, total 8) ===
  p('tango-shoes-korea','Tango Shoes Korea','Tango Shoes Korea','Men\'s Classic Patent Leather','Sleek patent leather men\'s tango shoes with split sole for superior flexibility.','Shoes',195000,null,['255','260','265','270','275'],10,S('photo-1614252235316-8c857d38b5f4')),
  p('tango-shoes-korea','Tango Shoes Korea','Tango Shoes Korea','Women\'s Satin Cross-Strap','Elegant satin cross-strap heels with 7cm heel. Perfect for milonga nights.','Shoes',165000,145000,['220','225','230','235','240'],12,S('photo-1596703263926-eb0762ee17e4')),
  p('tango-shoes-korea','Tango Shoes Korea','Tango Shoes Korea','Beginner Starter Pack','Complete starter set including shoes, shoe bag, and sole brush.','Shoes',98000,null,['235','240','245','250'],30,S('photo-1551107696-a4b0c5a0d9a2')),
  p('tango-shoes-korea','Tango Shoes Korea','Tango Shoes Korea','Premium Heel Protectors Set','Set of 6 durable heel protectors in various sizes. Essential for outdoor milongas.','Accessories',25000,null,['S','M','L'],50,S('photo-1606760227091-3dd870d97f1d')),
  p('tango-shoes-korea','Tango Shoes Korea','Tango Shoes Korea','Suede Sole Dance Sneakers','Modern dance sneakers with suede sole. Street style meets dance functionality.','Shoes',135000,null,['240','245','250','255','260'],18,S('photo-1551107696-a4b0c5a0d9a2')),
  p('tango-shoes-korea','Tango Shoes Korea','Tango Shoes Korea','Gold Buckle Strap Heels','Glamorous gold buckle heels with 8cm height. Statement shoes for special nights.','Shoes',210000,185000,['220','225','230','235'],8,S('photo-1543163521-1bf539c55dd2')),

  // === VIVIAN SHOES (add 6, total 8) ===
  p('vivian-shoes-seoul','Vivian Shoes','Vivian Shoes','Vivian Closed-Toe Pump','Classic closed-toe pump with padded insole. Timeless elegance for any occasion.','Shoes',185000,null,['220','225','230','235','240'],10,S('photo-1543163521-1bf539c55dd2')),
  p('vivian-shoes-seoul','Vivian Shoes','Vivian Shoes','Vivian Men\'s Ballroom Shoes','Professional men\'s ballroom shoes with full suede sole. Competition grade.','Shoes',198000,null,['255','260','265','270','275'],8,S('photo-1614252235316-8c857d38b5f4')),
  p('vivian-shoes-seoul','Vivian Shoes','Vivian Shoes','Vivian Ruby Satin Heels','Stunning ruby red satin heels with crystal buckle. 7.5cm heel height.','Shoes',245000,215000,['220','225','230','235'],6,S('photo-1596703263926-eb0762ee17e4')),
  p('vivian-shoes-seoul','Vivian Shoes','Vivian Shoes','Vivian Practice T-Bar','Comfortable T-bar practice shoes with memory foam. Low 5cm heel.','Shoes',125000,null,['225','230','235','240','245'],20,S('photo-1603487742131-4160ec999306')),
  p('vivian-shoes-seoul','Vivian Shoes','Vivian Shoes','Vivian Peep-Toe Platform','Modern peep-toe platform with 3cm platform + 7cm heel. Ultra stable.','Shoes',230000,null,['220','225','230','235'],7,S('photo-1515347619252-60a4bf4fff4f')),
  p('vivian-shoes-seoul','Vivian Shoes','Vivian Shoes','Vivian Shoe Care Kit','Professional shoe care kit with brush, spray, and protective bag.','Accessories',38000,null,['One Size'],40,S('photo-1606760227091-3dd870d97f1d')),

  // === SHARON SHOES (add 5, total 7) ===
  p('sharon-shoes','Sharon Shoes','Sharon Shoes','Sharon Latin Cross-Strap','Versatile Latin cross-strap design suitable for tango and salsa.','Shoes',175000,155000,['220','225','230','235','240'],14,S('photo-1596703263926-eb0762ee17e4')),
  p('sharon-shoes','Sharon Shoes','Sharon Shoes','Sharon Velvet Evening Heels','Luxurious velvet heels in deep burgundy. 8cm heel with anti-slip sole.','Shoes',220000,null,['220','225','230','235'],5,S('photo-1543163521-1bf539c55dd2')),
  p('sharon-shoes','Sharon Shoes','Sharon Shoes','Sharon Men\'s Suede Loafer','Modern suede dance loafer with flexible sole. Casual elegance.','Shoes',160000,null,['255','260','265','270','275'],12,S('photo-1614252235316-8c857d38b5f4')),
  p('sharon-shoes','Sharon Shoes','Sharon Shoes','Sharon Ankle Boot Dance Shoes','Trendy ankle boot style dance shoes with inner zip. 6cm block heel.','Shoes',235000,210000,['225','230','235','240'],8,S('photo-1551107696-a4b0c5a0d9a2')),
  p('sharon-shoes','Sharon Shoes','Sharon Shoes','Sharon Rhinestone Sandals','Sparkling rhinestone sandals with adjustable ankle strap. 7cm heel.','Shoes',195000,null,['220','225','230','235','240'],10,S('photo-1515347619252-60a4bf4fff4f')),

  // === ODILE SHOES (add 5, total 7) ===
  p('odile-shoes','Odile Shoes','Odile Shoes','Odile Silver Metallic Heels','Eye-catching silver metallic heels for stage performances. 8cm heel.','Shoes',260000,null,['220','225','230','235'],6,S('photo-1596703263926-eb0762ee17e4')),
  p('odile-shoes','Odile Shoes','Odile Shoes','Odile Men\'s Patent Dance Shoes','Premium patent leather men\'s shoes with breathable lining.','Shoes',195000,175000,['255','260','265','270','275'],10,S('photo-1614252235316-8c857d38b5f4')),
  p('odile-shoes','Odile Shoes','Odile Shoes','Odile Nude Mesh Heels','Barely-there nude mesh heels. Looks barefoot with full support. 7cm.','Shoes',215000,null,['220','225','230','235','240'],9,S('photo-1543163521-1bf539c55dd2')),
  p('odile-shoes','Odile Shoes','Odile Shoes','Odile Leopard Print Flats','Bold leopard print dance flats with cushioned arch support.','Shoes',110000,null,['225','230','235','240','245'],15,S('photo-1603487742131-4160ec999306')),
  p('odile-shoes','Odile Shoes','Odile Shoes','Odile Suede Sole Renewal Kit','DIY sole renewal kit with adhesive suede patches and tools.','Accessories',32000,null,['One Size'],35,S('photo-1606760227091-3dd870d97f1d')),

  // === T.BALANCE SHOES (add 5, total 7) ===
  p('t-balance-shoes','T.Balance Shoes','T.Balance','T.Balance Women\'s Wide Fit','Extra-wide dance shoes designed for comfort. Memory foam + arch support.','Shoes',165000,null,['235','240','245','250'],15,S('photo-1603487742131-4160ec999306')),
  p('t-balance-shoes','T.Balance Shoes','T.Balance','T.Balance Men\'s Flex Oxford','Ultra-flexible men\'s oxford with split sole. Breathable mesh lining.','Shoes',185000,165000,['255','260','265','270','275'],12,S('photo-1614252235316-8c857d38b5f4')),
  p('t-balance-shoes','T.Balance Shoes','T.Balance','T.Balance Orthopedic Insoles','Custom orthopedic insoles designed specifically for dance shoes.','Accessories',45000,null,['S','M','L','XL'],50,S('photo-1606760227091-3dd870d97f1d')),
  p('t-balance-shoes','T.Balance Shoes','T.Balance','T.Balance Satin Heels 6cm','Elegant satin heels with moderate 6cm height. Great for long milongas.','Shoes',175000,null,['220','225','230','235','240'],10,S('photo-1515347619252-60a4bf4fff4f')),
  p('t-balance-shoes','T.Balance Shoes','T.Balance','T.Balance Vintage Oxford','Retro-style vintage oxford with burnished leather finish.','Shoes',210000,190000,['255','260','265','270'],8,S('photo-1551107696-a4b0c5a0d9a2')),

  // === LEONA SHOES (add 5, total 7) ===
  p('leona-shoes','Leona Shoes','Leona Shoes','Leona Pearl Embellished Heels','Handcrafted pearl-embellished heels. Bridal and special occasion favorite.','Shoes',310000,null,['220','225','230','235'],4,S('photo-1543163521-1bf539c55dd2')),
  p('leona-shoes','Leona Shoes','Leona Shoes','Leona Men\'s Argentine Classic','Traditional Argentine-style men\'s dance shoes. Full leather construction.','Shoes',195000,null,['255','260','265','270','275'],10,S('photo-1614252235316-8c857d38b5f4')),
  p('leona-shoes','Leona Shoes','Leona Shoes','Leona Rose Gold Sandal','Trendy rose gold sandal with comfortable block heel. 6cm height.','Shoes',175000,155000,['220','225','230','235','240'],12,S('photo-1596703263926-eb0762ee17e4')),
  p('leona-shoes','Leona Shoes','Leona Shoes','Leona Stretch Dance Bootie','Stretchy sock-style dance bootie for modern tango dancers.','Shoes',145000,null,['225','230','235','240'],14,S('photo-1551107696-a4b0c5a0d9a2')),
  p('leona-shoes','Leona Shoes','Leona Shoes','Leona Shoe Storage Bag','Premium padded shoe bag with ventilation. Fits 2 pairs.','Accessories',28000,null,['One Size'],60,S('photo-1606760227091-3dd870d97f1d')),

  // === EVENIA (add 5, total 7) ===
  p('evenia-seoul','Evenia','Evenia','Evenia Black Lace Overlay Heels','Sophisticated black lace overlay on nude base. 8cm heel with ankle strap.','Shoes',265000,null,['220','225','230','235'],5,S('photo-1543163521-1bf539c55dd2')),
  p('evenia-seoul','Evenia','Evenia','Evenia Men\'s Two-Tone Oxford','Classic two-tone oxford in black and white. Statement dance shoes.','Shoes',215000,195000,['255','260','265','270','275'],7,S('photo-1614252235316-8c857d38b5f4')),
  p('evenia-seoul','Evenia','Evenia','Evenia Champagne Glitter Pump','Delicate champagne glitter pump. Perfect for weddings and galas. 7cm.','Shoes',235000,null,['220','225','230','235','240'],8,S('photo-1596703263926-eb0762ee17e4')),
  p('evenia-seoul','Evenia','Evenia','Evenia Comfort Practice Shoe','Ultra-comfortable practice shoes with extra cushioning. Low 4cm heel.','Shoes',130000,null,['225','230','235','240','245'],25,S('photo-1603487742131-4160ec999306')),
  p('evenia-seoul','Evenia','Evenia','Evenia Crystal Shoe Clips','Detachable crystal clips to transform any shoes. Set of 2.','Accessories',42000,35000,['One Size'],30,S('photo-1535632066927-ab7c9ab60908')),

  // === MARAVILLA J (add 7, total 10) ===
  p('maravilla-j','Maravilla J','Maravilla J','MJ Patent T-Strap Heels','Polished patent T-strap with contrast stitching. 7cm heel.','Shoes',225000,null,['220','225','230','235','240'],9,S('photo-1515347619252-60a4bf4fff4f')),
  p('maravilla-j','Maravilla J','Maravilla J','MJ Men\'s Tango Boots','Stylish men\'s ankle boots designed for tango. Inner zipper for easy wear.','Shoes',250000,220000,['255','260','265','270'],6,S('photo-1614252235316-8c857d38b5f4')),
  p('maravilla-j','Maravilla J','Maravilla J','MJ Silk Halter Dress','Luxurious silk halter dress with draped back. Perfect for special milongas.','Dresses',320000,null,['S','M','L'],5,S('photo-1566174053879-31528523f8ae')),
  p('maravilla-j','Maravilla J','Maravilla J','MJ Floral Print Midi Skirt','Beautiful floral print midi skirt with godets for movement.','Dresses',165000,null,['S','M','L','XL'],12,S('photo-1583396082539-bdf40e3131f5')),
  p('maravilla-j','Maravilla J','Maravilla J','MJ Stretch Bodysuit','Sleek black stretch bodysuit. Perfect base layer for any skirt.','Dresses',78000,null,['S','M','L'],20,S('photo-1558618666-fcd25c85f82e')),
  p('maravilla-j','Maravilla J','Maravilla J','MJ Mesh Practice Top','Breathable mesh practice top with built-in support.','Dresses',65000,55000,['S','M','L','XL'],25,S('photo-1566174053879-31528523f8ae')),
  p('maravilla-j','Maravilla J','Maravilla J','MJ Tango Accessory Bundle','Bundle: rhinestone earrings + hair clip + shoe bag. Gift set.','Accessories',58000,48000,['One Size'],15,S('photo-1535632066927-ab7c9ab60908')),

  // === TOP DRESS (add 7, total 10) ===
  p('top-dress','Top Dress','Top Dress','Velvet Off-Shoulder Dress','Rich velvet off-shoulder dress with fishtail hem. Deep wine color.','Dresses',380000,320000,['S','M','L'],4,S('photo-1566174053879-31528523f8ae')),
  p('top-dress','Top Dress','Top Dress','Lace Pencil Skirt','Figure-hugging lace pencil skirt with stretch. Back slit for movement.','Dresses',145000,null,['S','M','L','XL'],15,S('photo-1583396082539-bdf40e3131f5')),
  p('top-dress','Top Dress','Top Dress','Chiffon Wrap Top','Lightweight chiffon wrap top. Pairs beautifully with any skirt.','Dresses',95000,null,['S','M','L'],18,S('photo-1558618666-fcd25c85f82e')),
  p('top-dress','Top Dress','Top Dress','Sequin Cocktail Dress','Show-stopping sequin cocktail dress. Above-knee with cape sleeves.','Dresses',420000,null,['S','M','L'],3,S('photo-1566174053879-31528523f8ae')),
  p('top-dress','Top Dress','Top Dress','Jersey Practice Set','Comfortable jersey practice set - crop top + wide-leg pants.','Dresses',118000,98000,['S','M','L','XL'],20,S('photo-1583396082539-bdf40e3131f5')),
  p('top-dress','Top Dress','Top Dress','Asymmetric Hem Skirt','Dramatic asymmetric hem tango skirt. Creates beautiful lines.','Dresses',168000,null,['S','M','L'],10,S('photo-1558618666-fcd25c85f82e')),
  p('top-dress','Top Dress','Top Dress','Sheer Mesh Bolero','Elegant sheer mesh bolero jacket. Adds sophistication to any outfit.','Dresses',75000,null,['S','M','L'],22,S('photo-1566174053879-31528523f8ae')),

  // === J SHOP DRESS (add 7, total 10) ===
  p('j-shop-dress','J Shop Dress','J Shop Dress','J Ruffle Sleeve Dress','Romantic ruffle sleeve dress in soft blush pink. Knee length.','Dresses',245000,null,['S','M','L','XL'],8,S('photo-1566174053879-31528523f8ae')),
  p('j-shop-dress','J Shop Dress','J Shop Dress','J Black Slit Maxi Dress','Dramatic black maxi dress with thigh-high slit. Jersey fabric.','Dresses',298000,258000,['S','M','L'],6,S('photo-1558618666-fcd25c85f82e')),
  p('j-shop-dress','J Shop Dress','J Shop Dress','J Tango Pants','Sleek wide-leg tango pants with high waist. Professional look.','Dresses',158000,null,['S','M','L','XL'],14,S('photo-1583396082539-bdf40e3131f5')),
  p('j-shop-dress','J Shop Dress','J Shop Dress','J Embroidered Mesh Top','Delicate embroidered mesh top with long sleeves. Sheer elegance.','Dresses',112000,null,['S','M','L'],10,S('photo-1566174053879-31528523f8ae')),
  p('j-shop-dress','J Shop Dress','J Shop Dress','J Satin Midi Skirt','Bias-cut satin midi skirt that flows beautifully when dancing.','Dresses',175000,148000,['S','M','L'],9,S('photo-1583396082539-bdf40e3131f5')),
  p('j-shop-dress','J Shop Dress','J Shop Dress','J Sequin Cape Top','Glamorous sequin cape top for performance nights. One size fits most.','Dresses',195000,null,['Free Size'],7,S('photo-1558618666-fcd25c85f82e')),
  p('j-shop-dress','J Shop Dress','J Shop Dress','J Dance Cardigan','Soft knit dance cardigan for warm-up. Thumb-hole cuffs.','Dresses',88000,null,['S','M','L','XL'],20,S('photo-1566174053879-31528523f8ae')),

  // === FREESTYLE ACCESSORIES (add 7, total 10) ===
  p('rglqeyjDHzzhbUwuim5O','Freestyle Tango','Freestyle','Crystal Bobby Pin Set','Set of 10 crystal-studded bobby pins. Mix of sizes for versatile styling.','Accessories',22000,null,['Gold','Silver'],45,S('photo-1606760227091-3dd870d97f1d')),
  p('rglqeyjDHzzhbUwuim5O','Freestyle Tango','Freestyle','Pearl Statement Necklace','Elegant layered pearl necklace. Adjustable length with lobster clasp.','Accessories',55000,45000,['One Size'],15,S('photo-1535632066927-ab7c9ab60908')),
  p('rglqeyjDHzzhbUwuim5O','Freestyle Tango','Freestyle','Silk Flower Corsage','Handmade silk flower corsage/brooch. Attaches to dress or hair.','Accessories',32000,null,['Red','Black','White','Pink'],30,S('photo-1606760227091-3dd870d97f1d')),
  p('rglqeyjDHzzhbUwuim5O','Freestyle Tango','Freestyle','Tango Fan (Abanico)','Hand-painted folding fan. Functional art piece for milonga nights.','Accessories',48000,null,['Floral','Abstract','Classic'],12,S('photo-1611591437281-460bfbe1220a')),
  p('rglqeyjDHzzhbUwuim5O','Freestyle Tango','Freestyle','Ankle Bracelet Chain','Delicate ankle chain with tiny tango shoe charm. 925 silver.','Accessories',38000,32000,['One Size'],20,S('photo-1535632066927-ab7c9ab60908')),
  p('rglqeyjDHzzhbUwuim5O','Freestyle Tango','Freestyle','Embroidered Dance Clutch','Compact embroidered clutch bag for milonga essentials. Wrist strap.','Accessories',52000,null,['Black','Navy','Burgundy'],18,S('photo-1606760227091-3dd870d97f1d')),
  p('rglqeyjDHzzhbUwuim5O','Freestyle Tango','Freestyle','Tango Keychain & Charm Set','Miniature tango shoe keychain + rose charm. Great gift item.','Accessories',15000,null,['Gold','Silver'],60,S('photo-1611591437281-460bfbe1220a')),
];

async function main() {
  console.log(`🛍️ Bulk Seeding: ${PRODUCTS.length} products\n`);
  
  // Firestore batch limit is 500 writes, we have ~80 so one batch is fine
  const batch = db.batch();
  
  for (const product of PRODUCTS) {
    const ref = db.collection('products').doc();
    batch.set(ref, {
      ...product,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`✅ ${PRODUCTS.length} products seeded successfully!`);
  
  // Count totals per group
  const counts = {};
  for (const p of PRODUCTS) {
    counts[p.groupName] = (counts[p.groupName] || 0) + 1;
  }
  console.log('\n📊 Added per group:');
  for (const [name, count] of Object.entries(counts)) {
    console.log(`  ${name}: +${count}`);
  }
  
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
