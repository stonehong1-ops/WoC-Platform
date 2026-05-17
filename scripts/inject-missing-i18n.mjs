import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/missing-i18n-keys.json', 'utf-8'));
const staticKeys = data.filter(k => !k.key.includes('${'));

function keyToEnLabel(key) {
  const last = key.split('.').pop();
  return last
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const knownLabels = {
  'loadingCoupons': 'Loading Coupons',
  'noActiveCouponsFound': 'No Active Coupons Found',
  'createNewGroupCoupon': 'Create New Group Coupon',
  'couponTitle': 'Coupon Title',
  'couponTitlePlaceholder': 'Enter coupon name',
  'discountType': 'Discount Type',
  'freePass': 'Free Pass',
  'discountAmountKrw': 'Discount Amount (KRW)',
  'durationMonths': 'Duration (Months)',
  'months': 'months',
  'validity': 'Validity',
  'quantity': 'Quantity',
  'totalQuantity': 'Total Quantity',
  'unlimited': 'Unlimited',
  'zeroForUnlimited': '0 = Unlimited',
  'createCoupon': 'Create Coupon',
  'creating': 'Creating...',
  'activeCoupons': 'Active Coupons',
  'couponCreatedSuccess': 'Coupon created successfully!',
  'couponDeactivated': 'Coupon deactivated.',
  'failedToCreateCoupon': 'Failed to create coupon.',
  'failedToDeactivateCoupon': 'Failed to deactivate coupon.',
  'failedToLoadCoupons': 'Failed to load coupons.',
  'confirmDeactivateCoupon': 'Are you sure you want to deactivate this coupon?',
  'pleaseEnterCouponTitle': 'Please enter a coupon title.',
  'noPostsFound': 'No Posts Found',
  'loadMorePosts': 'Load More',
  'beTheFirstToShare': 'Be the first to share!',
  'all': 'All',
  'general': 'General',
  'home.coming_soon_desc': 'More features coming soon.',
  'home.global_tango_society': 'Global Tango Society',
  'lost.clear_all': 'Clear All',
  'lost.confirm_clear_likes': 'Clear all saved items?',
  'lost.contact_number_label': 'Contact Number',
  'lost.contact_number_placeholder': 'Enter your phone number',
  'lost.message_label': 'Message',
  'lost.message_placeholder': 'Leave a message to the owner...',
  'lost.status_in_progress': 'In Progress',
  'lost.status_pending': 'Pending',
  'social.seats': 'Seats',
  'social.select_date': 'Select Date',
  'social.status': 'Status',
  'social.unknown_error': 'An unknown error occurred.',
  'resale.msg_max_photos': 'You can upload up to 10 photos.',
  'shop.msg_fill_required': 'Please fill in all required fields.',
  'shop.msg_max_photos': 'You can upload up to 10 photos.',
  'myinfo.dance_role': 'Dance Role',
};

const LANG_PATH = 'src/contexts/LanguageContext.tsx';
let lines = fs.readFileSync(LANG_PATH, 'utf-8').split('\n');

// 각 줄의 \r 제거 여부 확인 (CRLF 처리)
const hasCR = lines[0].endsWith('\r');

function stripCR(s) { return s.replace(/\r$/, ''); }
function addCR(s) { return hasCR ? s + '\r' : s; }

// 이미 정의된 키 확인
const allContent = lines.join('\n');
function isKeyDefined(key) {
  return allContent.includes(`'${key}':`);
}

const toAdd = staticKeys.filter(({ key }) => !isKeyDefined(key));
console.log(`📝 추가할 키: ${toAdd.length}개`);

// EN 블록 끝 라인 찾기: "  }," 이고 다음 줄이 "  KR: {"
let enEndLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (stripCR(lines[i]) === '  },' && i + 1 < lines.length && stripCR(lines[i+1]).trim() === 'KR: {') {
    enEndLine = i;
    break;
  }
}
if (enEndLine === -1) {
  // 대안: line 2254-1 (0-indexed: 2253)
  console.log('EN 블록 직접 탐색...');
  for (let i = 0; i < lines.length; i++) {
    const cur = stripCR(lines[i]);
    const next = i+1 < lines.length ? stripCR(lines[i+1]) : '';
    if (cur === '  },' && next === '  KR: {') {
      enEndLine = i;
      console.log(`  EN 블록 끝 발견: 라인 ${i+1}`);
      break;
    }
  }
}
console.log('EN 블록 끝 라인:', enEndLine + 1);

// KR 블록 끝 라인 찾기: "  }" (쉼표 없음) 이고 다음 줄이 "};"
let krEndLine = -1;
for (let i = 0; i < lines.length; i++) {
  const cur = stripCR(lines[i]);
  const next = i+1 < lines.length ? stripCR(lines[i+1]) : '';
  if (cur === '  }' && next === '};') {
    krEndLine = i;
    break;
  }
}
console.log('KR 블록 끝 라인:', krEndLine + 1);

if (enEndLine === -1 || krEndLine === -1) {
  console.error('❌ 블록 경계 탐색 실패');
  process.exit(1);
}

// 삽입 라인 생성
const enEntryLines = toAdd.map(({ key }) => {
  const val = (knownLabels[key] || keyToEnLabel(key)).replace(/'/g, "\\'");
  return addCR(`    '${key}': '${val}',`);
});
const krEntryLines = toAdd.map(({ key }) => {
  const val = (knownLabels[key] || keyToEnLabel(key)).replace(/'/g, "\\'");
  return addCR(`    '${key}': '${val}',`);
});

// KR 먼저 삽입 (인덱스가 앞에서부터 밀리지 않도록 뒤부터 삽입)
lines.splice(krEndLine, 0, ...krEntryLines);
console.log('✅ KR 주입 완료');

// EN 삽입 (krEndLine 이 뒤에 있으므로 enEndLine 은 그대로)
lines.splice(enEndLine, 0, ...enEntryLines);
console.log('✅ EN 주입 완료');

fs.writeFileSync(LANG_PATH, lines.join('\n'), 'utf-8');
console.log(`✅ 완료: ${toAdd.length}개 키 추가됨`);
