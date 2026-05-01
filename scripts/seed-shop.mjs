// Shop 시딩 스크립트: 계좌 세팅 + 샘플 상품 등록
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin (uses ADC or service account)
const app = initializeApp({
  projectId: 'woc-platform-seoul-1234'
});
const db = getFirestore(app);

// ===============================================
// 1. 계좌 세팅할 그룹 목록
// ===============================================
const SHOP_GROUPS = [
  { id: 'tango-shoes-korea', name: 'Tango Shoes Korea', category: 'Shoes' },
  { id: 'vivian-shoes-seoul', name: 'Vivian Shoes', category: 'Shoes' },
  { id: 'sharon-shoes', name: 'Sharon Shoes', category: 'Shoes' },
  { id: 'odile-shoes', name: 'Odile Shoes', category: 'Shoes' },
  { id: 't-balance-shoes', name: 'T.Balance Shoes', category: 'Shoes' },
  { id: 'leona-shoes', name: 'Leona Shoes', category: 'Shoes' },
  { id: 'evenia-seoul', name: 'Evenia', category: 'Shoes' },
  { id: 'maravilla-j', name: 'Maravilla J', category: 'Shoes,Dresses' },
  { id: 'top-dress', name: 'Top Dress', category: 'Dresses' },
  { id: 'j-shop-dress', name: 'J Shop Dress', category: 'Dresses' },
  { id: 'rglqeyjDHzzhbUwuim5O', name: 'Freestyle Tango', category: 'Accessories' },
];

const BANK_DETAILS = {
  bankName: '카카오뱅크',
  accountHolder: '홍병석',
  accountNumber: '3333-14-3159646',
};

// ===============================================
// 2. 샘플 상품 데이터
// ===============================================
const PRODUCTS = [
  // --- 탱고슈즈코리아 (2) ---
  { groupId: 'tango-shoes-korea', groupName: 'Tango Shoes Korea', title: 'Classic Leather Tango Shoes', description: 'Premium Argentine leather tango shoes with suede soles. Perfect for social dancing with excellent floor contact and pivoting ability.', category: 'Shoes', brand: 'Tango Shoes Korea', currency: 'KRW', price: 180000, discountPrice: 155000, options: ['235', '240', '245', '250', '255', '260'], stock: 15, images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'] },
  { groupId: 'tango-shoes-korea', groupName: 'Tango Shoes Korea', title: 'Suede Practice Shoes', description: 'Comfortable suede practice shoes designed for extended class sessions. Lightweight with cushioned insoles for all-day comfort.', category: 'Shoes', brand: 'Tango Shoes Korea', currency: 'KRW', price: 120000, options: ['235', '240', '245', '250', '255'], stock: 20, images: ['https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600'] },

  // --- 비비안슈즈 (2) ---
  { groupId: 'vivian-shoes-seoul', groupName: 'Vivian Shoes', title: 'Vivian Elite Stiletto', description: 'Elegant stiletto heels with 8cm height. Hand-crafted Italian leather upper with chrome suede sole for perfect balance.', category: 'Shoes', brand: 'Vivian Shoes', currency: 'KRW', price: 220000, options: ['220', '225', '230', '235', '240'], stock: 8, images: ['https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600'] },
  { groupId: 'vivian-shoes-seoul', groupName: 'Vivian Shoes', title: 'Vivian Open-Toe Sandal', description: 'Breathable open-toe dance sandal with ankle strap. Perfect for summer milongas with excellent stability.', category: 'Shoes', brand: 'Vivian Shoes', currency: 'KRW', price: 160000, discountPrice: 140000, options: ['220', '225', '230', '235', '240'], stock: 12, images: ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600'] },

  // --- 샤론슈즈 (2) ---
  { groupId: 'sharon-shoes', groupName: 'Sharon Shoes', title: 'Sharon Elegant Heels', description: 'Sophisticated tango heels with cushioned arch support. Premium satin finish with sparkling buckle detail.', category: 'Shoes', brand: 'Sharon Shoes', currency: 'KRW', price: 190000, options: ['220', '225', '230', '235', '240'], stock: 10, images: ['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600'] },
  { groupId: 'sharon-shoes', groupName: 'Sharon Shoes', title: "Sharon Men's Oxford", description: "Classic men's dance oxford with split sole for maximum flexibility. Genuine leather with breathable lining.", category: 'Shoes', brand: 'Sharon Shoes', currency: 'KRW', price: 170000, options: ['255', '260', '265', '270', '275', '280'], stock: 10, images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600'] },

  // --- 오딜슈즈 (2) ---
  { groupId: 'odile-shoes', groupName: 'Odile Shoes', title: 'Odile Gold Glitter Heels', description: 'Show-stopping gold glitter heels for special milonga nights. 7cm heel with padded insole and secure ankle strap.', category: 'Shoes', brand: 'Odile Shoes', currency: 'KRW', price: 250000, options: ['220', '225', '230', '235'], stock: 5, images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'] },
  { groupId: 'odile-shoes', groupName: 'Odile Shoes', title: 'Odile Classic Pump', description: 'Timeless classic pump for everyday dancing. Versatile black leather with moderate 6cm heel height.', category: 'Shoes', brand: 'Odile Shoes', currency: 'KRW', price: 180000, discountPrice: 160000, options: ['220', '225', '230', '235', '240'], stock: 14, images: ['https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600'] },

  // --- 티밸런스 (2) ---
  { groupId: 't-balance-shoes', groupName: 'T.Balance Shoes', title: 'T.Balance Pro Comfort', description: 'Ergonomically designed dance shoes with memory foam insole. Extra wide fit available for maximum comfort during long practice sessions.', category: 'Shoes', brand: 'T.Balance', currency: 'KRW', price: 150000, options: ['240', '245', '250', '255', '260', '265'], stock: 25, images: ['https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600'] },
  { groupId: 't-balance-shoes', groupName: 'T.Balance Shoes', title: 'T.Balance Leather Dance Shoes', description: 'Premium full-grain leather dance shoes with chrome suede outsole. Handcrafted with reinforced heel counter.', category: 'Shoes', brand: 'T.Balance', currency: 'KRW', price: 200000, options: ['240', '245', '250', '255', '260'], stock: 10, images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600'] },

  // --- 레오나슈즈 (2) ---
  { groupId: 'leona-shoes', groupName: 'Leona Shoes', title: 'Leona Crystal Heels', description: 'Luxurious crystal-embellished stiletto heels. Hand-set Swarovski crystals on premium satin upper. The ultimate statement shoes.', category: 'Shoes', brand: 'Leona Shoes', currency: 'KRW', price: 280000, options: ['220', '225', '230', '235'], stock: 4, images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'] },
  { groupId: 'leona-shoes', groupName: 'Leona Shoes', title: 'Leona Practice Flats', description: 'Stylish yet practical flat dance shoes. Soft leather with flexible sole — ideal for beginners and practice sessions.', category: 'Shoes', brand: 'Leona Shoes', currency: 'KRW', price: 90000, options: ['225', '230', '235', '240', '245'], stock: 30, images: ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600'] },

  // --- 이브니아 (2) ---
  { groupId: 'evenia-seoul', groupName: 'Evenia', title: 'Evenia Signature Stiletto', description: 'The iconic Evenia stiletto with 9cm heel. Italian calfskin leather with signature red sole detail. A favorite among professional dancers.', category: 'Shoes', brand: 'Evenia', currency: 'KRW', price: 240000, options: ['220', '225', '230', '235', '240'], stock: 7, images: ['https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600'] },
  { groupId: 'evenia-seoul', groupName: 'Evenia', title: 'Evenia Satin Dance Shoes', description: 'Elegant satin dance shoes available in multiple colors. Ideal for performances and special occasions with customizable heel height.', category: 'Shoes', brand: 'Evenia', currency: 'KRW', price: 200000, discountPrice: 175000, options: ['220', '225', '230', '235'], stock: 9, images: ['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600'] },

  // --- 마라비샤제이 (3: 슈즈2 + 드레스1) ---
  { groupId: 'maravilla-j', groupName: 'Maravilla J', title: 'MJ Tango Heels', description: 'Maravilla J signature tango heels combining Argentine craftsmanship with Korean comfort technology. 7.5cm heel with shock-absorbing insole.', category: 'Shoes', brand: 'Maravilla J', currency: 'KRW', price: 210000, options: ['220', '225', '230', '235', '240'], stock: 12, images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'] },
  { groupId: 'maravilla-j', groupName: 'Maravilla J', title: 'MJ Lace Milonga Dress', description: 'Stunning lace dress designed specifically for milonga nights. Features a flattering A-line silhouette with movement-friendly slit.', category: 'Dresses', brand: 'Maravilla J', currency: 'KRW', price: 280000, options: ['S', 'M', 'L', 'XL'], stock: 6, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'] },
  { groupId: 'maravilla-j', groupName: 'Maravilla J', title: 'MJ Sequin Wrap Skirt', description: 'Versatile sequin wrap skirt that pairs with any top. Adjustable waist tie and asymmetric hemline for dramatic movement.', category: 'Dresses', brand: 'Maravilla J', currency: 'KRW', price: 150000, discountPrice: 128000, options: ['Free Size'], stock: 15, images: ['https://images.unsplash.com/photo-1583396082539-bdf40e3131f5?w=600'] },

  // --- 탑드레스 (3) ---
  { groupId: 'top-dress', groupName: 'Top Dress', title: 'Milonga Night Dress', description: 'Elegant floor-length dress with high slit for freedom of movement. Luxurious jersey fabric with subtle sheen perfect for evening milongas.', category: 'Dresses', brand: 'Top Dress', currency: 'KRW', price: 350000, options: ['S', 'M', 'L'], stock: 4, images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600'] },
  { groupId: 'top-dress', groupName: 'Top Dress', title: 'Elegant Tango Skirt', description: 'Flowing tango skirt with godets for beautiful leg lines. Stretch waistband for comfort during extended dancing.', category: 'Dresses', brand: 'Top Dress', currency: 'KRW', price: 180000, options: ['S', 'M', 'L', 'XL'], stock: 10, images: ['https://images.unsplash.com/photo-1583396082539-bdf40e3131f5?w=600'] },
  { groupId: 'top-dress', groupName: 'Top Dress', title: 'Performance Gown', description: 'Professional-grade performance gown with built-in support. Dramatic neckline and sweep train for stage presence.', category: 'Dresses', brand: 'Top Dress', currency: 'KRW', price: 450000, options: ['S', 'M', 'L'], stock: 3, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'] },

  // --- 제이샵드레스 (3) ---
  { groupId: 'j-shop-dress', groupName: 'J Shop Dress', title: 'J Classic Wrap Dress', description: 'Timeless wrap dress perfect for any milonga. Premium crepe fabric with a flattering V-neckline and 3/4 sleeves.', category: 'Dresses', brand: 'J Shop Dress', currency: 'KRW', price: 198000, options: ['S', 'M', 'L', 'XL'], stock: 12, images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600'] },
  { groupId: 'j-shop-dress', groupName: 'J Shop Dress', title: 'J Velvet Evening Dress', description: 'Luxurious velvet evening dress with open back design. Deep jewel tones that catch the light beautifully on the dance floor.', category: 'Dresses', brand: 'J Shop Dress', currency: 'KRW', price: 320000, discountPrice: 268000, options: ['S', 'M', 'L'], stock: 5, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'] },
  { groupId: 'j-shop-dress', groupName: 'J Shop Dress', title: 'J Practice Top & Skirt Set', description: 'Comfortable yet stylish practice set. Moisture-wicking top with matching flowy skirt. Available in 5 color combinations.', category: 'Dresses', brand: 'J Shop Dress', currency: 'KRW', price: 128000, options: ['S', 'M', 'L'], stock: 20, images: ['https://images.unsplash.com/photo-1583396082539-bdf40e3131f5?w=600'] },

  // --- Freestyle 액세서리 (3) ---
  { groupId: 'rglqeyjDHzzhbUwuim5O', groupName: 'Freestyle Tango', title: 'Tango Hair Clip Set', description: 'Set of 3 elegant hair clips designed for dancers. Secure grip that stays in place during movement with rhinestone accents.', category: 'Accessories', brand: 'Freestyle', currency: 'KRW', price: 35000, options: ['Gold', 'Silver', 'Rose Gold'], stock: 40, images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600'] },
  { groupId: 'rglqeyjDHzzhbUwuim5O', groupName: 'Freestyle Tango', title: 'Rhinestone Drop Earrings', description: 'Stunning rhinestone drop earrings that sparkle under milonga lights. Lightweight design for comfortable all-night wear.', category: 'Accessories', brand: 'Freestyle', currency: 'KRW', price: 45000, discountPrice: 38000, options: ['Crystal', 'Champagne', 'Midnight Blue'], stock: 25, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'] },
  { groupId: 'rglqeyjDHzzhbUwuim5O', groupName: 'Freestyle Tango', title: 'Milonga Charm Bracelet', description: 'Delicate charm bracelet featuring tango-inspired charms — shoes, rose, and music note. Adjustable chain fits all wrist sizes.', category: 'Accessories', brand: 'Freestyle', currency: 'KRW', price: 28000, options: ['Silver', 'Gold'], stock: 30, images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600'] },
];

// ===============================================
// MAIN EXECUTION
// ===============================================
async function main() {
  console.log('🛍️ WoC Shop Seeding Script Started\n');

  // --- STEP 1: Update bank details & shop activation ---
  console.log('=== STEP 1: Updating bank details & shop activation ===');
  const batch1 = db.batch();

  for (const group of SHOP_GROUPS) {
    const ref = db.collection('groups').doc(group.id);
    batch1.update(ref, {
      'bankDetails': BANK_DETAILS,
      'activeServices.shop': true,
    });
    console.log(`  ✅ ${group.name} (${group.id}) — bankDetails + shop ON`);
  }

  await batch1.commit();
  console.log(`\n✅ STEP 1 Complete: ${SHOP_GROUPS.length} groups updated\n`);

  // --- STEP 2: Seed products collection ---
  console.log('=== STEP 2: Seeding products collection ===');
  
  // Process in batches of 20 (Firestore batch limit is 500)
  const batch2 = db.batch();
  
  for (const product of PRODUCTS) {
    const ref = db.collection('products').doc();
    batch2.set(ref, {
      ...product,
      status: 'Active',
      likesCount: 0,
      viewsCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  📦 ${product.groupName} → ${product.title} (₩${product.price.toLocaleString()})`);
  }

  await batch2.commit();
  console.log(`\n✅ STEP 2 Complete: ${PRODUCTS.length} products seeded\n`);
  
  console.log('🎉 All done! Shop is ready.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
