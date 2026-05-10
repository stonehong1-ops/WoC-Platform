## Summary of Remaining Hardcoded Korean Strings

- **@modal**: 5 strings in 1 files
- **actions**: 5 strings in 1 files
- **admin**: 39 strings in 3 files
- **api**: 15 strings in 3 files
- **events**: 27 strings in 1 files
- **rental**: 1 strings in 1 files
- **resale**: 1 strings in 1 files
- **seed-rentals**: 7 strings in 1 files
- **shop**: 3 strings in 1 files
- **social**: 7 strings in 1 files
- **stay**: 8 strings in 3 files
- **components**: 82 strings in 14 files
- **hooks**: 3 strings in 3 files
- **lib**: 78 strings in 9 files
- **scripts**: 1 strings in 1 files
- **types**: 70 strings in 6 files


# Remaining Localization Targets

## Module: @modal
### app/@modal/(.)stay/[id]/page.bak.tsx (5 strings)
- Line 171: alert('留곹겕媛 蹂듭궗?섏뿀?듬땲??');
- Line 212: alert('?좏깮?섏떊 湲곌컙 ?ъ씠???덉빟 遺덇??ν븳 ?좎쭨媛 ?ы븿?섏뼱 ?덉뒿?덈떎.');
- Line 319: <p className="font-body-md">?ㅽ뀒?대? 李얠쓣 ???놁뒿?덈떎.</p>
- Line 605: alert('二쇱냼媛 蹂듭궗?섏뿀?듬땲??');
- Line 609: title="二쇱냼 蹂듭궗"

## Module: actions
### app/actions/smsActions.ts (5 strings)
- Line 12: console.warn('Solapi ?섍꼍 蹂?섍? ?ㅼ젙?섏? ?딆븯?듬땲?? 臾몄옄 諛쒖넚???ㅽ궢?⑸땲??');
- Line 13: return { success: false, error: 'Solapi ?섍꼍 蹂???꾨씫 (env.local ?뺤씤 ?꾩슂)' };
- Line 26: autoTypeDetect: true, // 硫붿떆吏 湲몄씠???곕씪 SMS/LMS/MMS ?먮룞 ?꾪솚
- Line 32: console.error('Solapi ?꾩넚 ?ㅽ뙣:', error);
- Line 33: return { success: false, error: error.message || '臾몄옄 諛쒖넚???ㅽ뙣?덉뒿?덈떎.' };

## Module: admin
### app/admin/people/page.tsx (3 strings)
- Line 126: {/* Search Bar Section - ?좎??섎㈃???섎떒 ?щ갚 議곗젙 */}
- Line 153: {/* Member List - ?щ갚???쒖썝?섍쾶 (mt-12) */}
- Line 234: {/* ?섎룞 ??蹂닿린 踰꾪듉 */}

### app/admin/seed-scenario/page.tsx (34 strings)
- Line 20: alert('Admin 怨꾩젙怨?User 怨꾩젙??紐⑤몢 ?낅젰?댁＜?몄슂.');
- Line 26: addLog('?? ?쒕뱶 ?쒕굹由ъ삤 ?앹꽦???쒖옉?⑸땲??..');
- Line 30: addLog(`?ъ슜??寃??以? ${adminAccount}, ${userAccount}`);
- Line 41: if (adminSnap.empty) throw new Error(`Admin ?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎: ${adminAccount}`);
- Line 42: if (userSnap.empty) throw new Error(`User ?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎: ${userAccount}`);
- Line 47: addLog(`???좎? 留ㅼ묶 ?깃났! Admin(${adminUser.nickname}), User(${normalUser.nickname})`);
- Line 57: description: '?쒕굹由ъ삤濡??앹꽦???뚯뒪??洹몃９?낅땲??',
- Line 67: addLog('??[1/5] 洹몃９ ?곗씠??(Tango Life Seoul) ?앹꽦 以鍮꾨맖.');
- Line 85: addLog('??[2/5] 洹몃９ 硫ㅻ쾭 沅뚰븳 (owner, active) 遺??以鍮꾨맖.');
- Line 91: title: '諛濡깃? 珥덇툒 吏묒쨷 ?대옒??(Seed)',
- Line 92: description: '?쒕굹由ъ삤 ?앹꽦???붾? ?대옒?ㅼ엯?덈떎.',
- Line 99: instructors: [{ name: adminUser.nickname || '媛뺤궗', role: 'Main Instructor' }],
- Line 101: { week: 1, date: '2026-05-10', timeSlot: '19:00 - 21:00', content: '諛濡깃? 踰좎씠吏? },
- Line 102: { week: 2, date: '2026-05-17', timeSlot: '19:00 - 21:00', content: '諛濡깃? 由щ벉' }
- Line 106: addLog('??[3/5] 洹몃９ ???대옒??(諛濡깃? 珥덇툒) ?앹꽦 以鍮꾨맖.');
- Line 115: classTitle: '諛濡깃? 珥덇툒 吏묒쨷 ?대옒??(Seed)',
- Line 118: status: 'PAYMENT_REPORTED', // 愿由ъ옄 ?뱀씤 ?湲??곹깭
- Line 128: addLog('??[4/5] ?쇰컲 ?ъ슜?먯쓽 ?대옒???섍컯 ?좎껌 ?댁뿭(History) ?앹꽦 以鍮꾨맖.');
- Line 133: addLog('?뮶 DB Batch ????꾨즺!');
- Line 140: title: '洹몃９ 媛???뱀씤',
- Line 141: message: `'Tango Life Seoul' 洹몃９??媛?낆씠 ?뱀씤?섏뿀?듬땲??`,
- Line 150: title: '?덈줈???섍컯 ?좎껌',
- Line 151: message: `${normalUser.nickname}?섏씠 '諛濡깃? 珥덇툒 吏묒쨷 ?대옒?????섍컯 ?좎껌(?낃툑蹂닿퀬)???섏??듬땲??`,
- Line 156: addLog('??[5/5] ???ъ슜?먯쓽 ?뚮┝(Notifications) 諛쒖넚 ?꾨즺!');
- Line 157: addLog('?럦 ?쒕굹由ъ삤 ?⑤뱶 ?곗씠???앹꽦???깃났?곸쑝濡??꾨즺?섏뿀?듬땲??');
- Line 161: addLog(`???ㅻ쪟 諛쒖깮: ${error.message}`);
- Line 168: return <div className="p-10 text-center text-red-500 font-bold">?묎렐 沅뚰븳???놁뒿?덈떎 (?쒖뒪??愿由ъ옄留?媛??.</div>;
- Line 173: <h1 className="text-2xl font-black mb-6">?뙮 ?쒕굹由ъ삤 湲곕컲 ?⑤뱶 ?곗씠???앹꽦湲?/h1>
- Line 175: ???꾧뎄???곸긽??媛吏??곗씠?곌? ?꾨땲?? ?ㅼ젣 ?쒕퉬?ㅼ쓽 <code>addDoc</code>, <code>setDoc</code> 援ъ“? ??꾩뒪?ы봽 濡쒖쭅??洹몃?濡?嫄곗퀜 洹몃９, ?대옒?? 硫ㅻ쾭, ?섍컯 ?좎껌 ?댁뿭, 洹몃━怨??뚮┝(Notification)源뚯? ?좉린?곸쑝濡??곌껐???꾨꼍???곗씠?곕? 援ъ꽦?⑸땲??
- Line 180: <label className="block text-sm font-bold text-gray-700 mb-2">Admin 怨꾩젙 (?대찓???먮뒗 ?꾪솕踰덊샇)</label>
- Line 184: placeholder="admin@example.com ?먮뒗 +8210..."
- Line 190: <label className="block text-sm font-bold text-gray-700 mb-2">User 怨꾩젙 (?대찓???먮뒗 ?꾪솕踰덊샇)</label>
- Line 194: placeholder="user@example.com ?먮뒗 +8210..."
- Line 204: {loading ? '?앹꽦 以?..' : '?쒕굹由ъ삤 ?곗씠??二쇱엯 ?ㅽ뻾'}

### app/admin/todo/page.tsx (2 strings)
- Line 255: const msg = `[WoC ?좎껌 ?덈궡]\n${guestName}?? '${booking.stayTitle}' ?좎껌???묒닔?섏뿀?듬땲??\n\n?꾨옒 怨꾩쥖濡?${totalPrice.toLocaleString()}?먯쓣 ?낃툑?댁＜?쒕㈃ ?깅줉???뺤젙?⑸땲??\n\n???낃툑 怨꾩쥖\n${bankString}\n??湲고븳: ?ㅻ뒛 ?먯젙源뚯?\n\n?낃툑???뺤씤?섎㈃ ?뺤젙 臾몄옄瑜?蹂대궡?쒕┰?덈떎. 媛먯궗?⑸땲??`;
- Line 271: const msg = `[WoC ?깅줉 ?뺤젙]\n${guestName}?? ?낃툑???뺤씤?섏뼱 '${booking.stayTitle}' ?깅줉??理쒖쥌 ?뺤젙?섏뿀?듬땲??\n\n???쇱젙: ${checkInDate} ~ ${checkOutDate}\n\n?됱궗/?섏뾽?먯꽌 逾숆쿋?듬땲?? 媛먯궗?⑸땲??`;

## Module: api
### app/api/migrate/route.ts (1 strings)
- Line 14: console.error('Firebase Admin 珥덇린???ㅻ쪟:', error.stack);

### app/api/notifications/route.ts (2 strings)
- Line 16: console.error('Firebase Admin 珥덇린???ㅻ쪟:', error.stack);
- Line 31: title: title || '?뚮┝',

### app/api/seed-rentals/route.ts (12 strings)
- Line 16: title: groupData.name || '?ㅽ뒠?붿삤',
- Line 17: description: groupData.description || '苡뚯쟻???꾩뒪 ?ㅽ뒠?붿삤?낅땲??',
- Line 18: location: groupData.description?.includes('留덊룷援?) ? '留덊룷援? :
- Line 19: groupData.description?.includes('媛뺣궓援?) ? '媛뺣궓援? :
- Line 20: groupData.description?.includes('?깅룞援?) ? '?깅룞援? :
- Line 21: groupData.description?.includes('?댁슫?援?) ? '?댁슫?援? :
- Line 22: groupData.description?.includes('?좎꽦援?) ? '?좎꽦援? :
- Line 23: groupData.description?.includes('遺?곗쭊援?) ? '遺?곗쭊援? : '?쒖슱',
- Line 24: address: groupData.description?.split('?꾩튂??)?.[0]?.trim() || '?곸꽭二쇱냼 誘몄젙',
- Line 25: category: '?꾩뒪 ?ㅽ뒠?붿삤',
- Line 28: facilities: ['?꾨㈃ 嫄곗슱', '釉붾（?ъ뒪 ?ㅻ뵒??, '?뺤닔湲?, '留덈（ 諛붾떏'],
- Line 29: rules: '?ㅻ궡 ?꾩슜 ?대룞???꾩뒪?? 李⑹슜 ?꾩닔, ?뚯떇臾?諛섏엯 湲덉?',

## Module: events
### app/events/page.tsx (27 strings)
- Line 31: 'korea': 'kr', 'south korea': 'kr', 'korea, republic of': 'kr', '??쒕?援?: 'kr', '?쒓뎅': 'kr',
- Line 32: 'japan': 'jp', '?쇰낯': 'jp',
- Line 33: 'china': 'cn', '以묎뎅': 'cn',
- Line 34: 'taiwan': 'tw', '?留?: 'tw',
- Line 35: 'hong kong': 'hk', '?띿쉘': 'hk',
- Line 36: 'united states': 'us', 'usa': 'us', 'us': 'us', '誘멸뎅': 'us',
- Line 37: 'argentina': 'ar', '?꾨Ⅴ?⑦떚??: 'ar',
- Line 38: 'singapore': 'sg', '?깃??щⅤ': 'sg',
- Line 39: 'uk': 'gb', 'united kingdom': 'gb', 'england': 'gb', '?곴뎅': 'gb',
- Line 40: 'france': 'fr', '?꾨옉??: 'fr',
- Line 41: 'germany': 'de', '?낆씪': 'de',
- Line 42: 'italy': 'it', '?댄깉由ъ븘': 'it',
- Line 43: 'spain': 'es', '?ㅽ럹??: 'es',
- Line 44: 'australia': 'au', '?몄＜': 'au',
- Line 45: 'canada': 'ca', '罹먮굹??: 'ca',
- Line 46: 'brazil': 'br', '釉뚮씪吏?: 'br',
- Line 47: 'mexico': 'mx', '硫뺤떆肄?: 'mx',
- Line 48: 'vietnam': 'vn', '踰좏듃??: 'vn',
- Line 49: 'thailand': 'th', '?쒓뎅': 'th',
- Line 50: 'indonesia': 'id', '?몃룄?ㅼ떆??: 'id',
- Line 51: 'malaysia': 'my', '留먮젅?댁떆??: 'my',
- Line 52: 'philippines': 'ph', '?꾨━?': 'ph',
- Line 135: return; // 以묒꺽 紐⑤떖 ?ロ옒
- Line 176: 'korea': [/\bkr\b/i, /\bkorea\b/i, /??쒕?援?, /?쒓뎅/],
- Line 177: 'japan': [/\bjp\b/i, /\bjapan\b/i, /?쇰낯/],
- Line 178: 'china': [/\bcn\b/i, /\bchina\b/i, /以묎뎅/],
- Line 179: 'taiwan': [/\btw\b/i, /\btaiwan\b/i, /?留?],

## Module: rental
### app/rental/[id]/page.tsx (1 strings)
- Line 103: const spaceInfo = `[?愿 臾몄쓽]\n怨듦컙紐? ${space.title}\n?쒓컙?? ??{(space.pricePerHour || 0).toLocaleString()}\n?꾩튂: ${space.location}\n諛붾줈媛湲? ${window.location.origin}/rental/${space.id}`;

## Module: resale
### app/resale/page.tsx (1 strings)
- Line 311: {/* ??Product Grid (?꾪꽣+?뺣젹 寃곌낵) */}

## Module: seed-rentals
### app/seed-rentals/page.tsx (7 strings)
- Line 61: rentalInfo: groupData.description || '苡뚯쟻???愿 怨듦컙?낅땲??',
- Line 75: title: (groupData.name || '?ㅽ뒠?붿삤') + ' ?愿',
- Line 76: description: groupData.description || '苡뚯쟻???ㅻぉ??怨듦컙?낅땲??',
- Line 77: location: '?쒖슱',
- Line 78: address: groupData.description?.split('?꾩튂??)?.[0]?.trim() || '?쒖슱',
- Line 82: facilities: ['Wi-Fi', '嫄곗슱', '?됰궃諛⑷린'],
- Line 83: rules: '?ㅻ궡??李⑹슜 ?꾩닔, ?뚯떇臾?諛섏엯 湲덉?',

## Module: shop
### app/shop/page.tsx (3 strings)
- Line 342: {/* ??Product Grid (?꾪꽣+?뺣젹 寃곌낵) */}
- Line 411: {/* ??Hero Banner (Admin UX ??愿묎퀬 諛곕꼫) */}
- Line 428: {/* ??Wishlist Tray (Map-style FAB ???꾨즺) */}

## Module: social
### app/social/page.tsx (7 strings)
- Line 134: window.history.back(); // ???몄텧??popstate ?대깽?몃? 諛쒖깮?쒗궢?덈떎
- Line 143: return; // 以묒꺽 紐⑤떖(紐⑤㉫???????ロ삍吏留??꾩옱 ?곹깭??硫붿씤 紐⑤떖???대젮?덉뼱????  Line 434: if (d === '媛뺣턿') return 0;
- Line 435: if (d === '媛뺣궓') return 1;
- Line 796: {/* ?뚰삎 ?몃꽕??*/}
- Line 835: {/* ?좉퇋 ?깅줉 (Create 紐⑤뱶) */}
- Line 843: {/* 湲곗〈 ?뚯뀥 ?몄쭛 (Edit 紐⑤뱶) */}
- Line 851: {/* 酉?紐⑤뱶 (?쇰컲 ?ъ슜?? */}

## Module: stay
### app/stay/page.tsx (1 strings)
- Line 266: {/* ??Stay Grid (?꾪꽣+?뺣젹 寃곌낵) */}

### app/stay/[id]/checkout/complete/page.tsx (1 strings)
- Line 26: await stayBookingService.updateBookingStatus(bookingId, 'PAID', user.uid, '?낃툑 ?꾨즺 蹂닿퀬');

### app/stay/[id]/checkout/page.tsx (6 strings)
- Line 112: <p className="font-body-md">?ㅽ뀒?대? 李얠쓣 ???놁뒿?덈떎.</p>
- Line 156: alert("濡쒓렇?몄씠 ?꾩슂?⑸땲??");
- Line 160: alert("?좎껌???깊븿, ?곕씫泥? ?낃툑?먮챸??紐⑤몢 ?낅젰?댁＜?몄슂.");
- Line 169: alert("寃곗젣 怨꾩쥖 ?뺣낫媛 ?ㅼ젙?섏? ?딆븯?듬땲?? ?몄뒪?몄뿉寃?臾몄쓽?댁＜?몄슂.");
- Line 224: const smsContent = `[WoC] ?덉빟???묒닔?섏뿀?듬땲??\n?숈냼: ${stay.title}\n?쇱젙: ${formatDate(checkIn)} - ${formatDate(checkOut)}\n?덉빟?? ${applicantName}\n湲덉븸: ${grandTotal.toLocaleString()}??n\n?몄뒪?몄쓽 ?뺤씤 ??理쒖쥌 ?뺤젙?⑸땲??`;
- Line 272: alert("?덉빟 ?좎껌???ㅽ뙣?덉뒿?덈떎. " + (error.message || ''));

## Module: components
### components/auth/AuthModal.tsx (1 strings)
- Line 512: placeholder={t('auth.native_nickname_placeholder', '?ㅼ뭡??)}

### components/chat/ChatRoom.tsx (33 strings)
- Line 316: ORDER_PLACED: ['[ORDER PLACED]', '[??二쇰Ц ?뚮┝]', '[二쇰Ц ?꾨즺]'],
- Line 317: PAYMENT_REPORTED: ['[PAYMENT REPORTED]', '[?낃툑 ?꾨즺 蹂닿퀬]', '[寃곗젣 蹂닿퀬??'],
- Line 318: PRODUCT_INQUIRY: ['[PRODUCT INQUIRY]', '[?곹뭹 臾몄쓽]'],
- Line 319: STAY_BOOKING: ['[STAY BOOKING]', '[?숈냼 ?덉빟]', '[?ㅽ뀒???덉빟]'],
- Line 320: STAY_PAYMENT: ['[STAY PAYMENT]', '[?숈냼 ?낃툑]', '[?ㅽ뀒??寃곗젣]'],
- Line 321: RENTAL_INQUIRY: ['[RENTAL INQUIRY]', '[?愿 臾몄쓽]', '[?뚰깉 臾몄쓽]']
- Line 327: const orderNo = getVal(lines, ['Order No', '二쇰Ц踰덊샇', '二쇰Ц 踰덊샇']);
- Line 328: const product = getVal(lines, ['Product', '?곹뭹紐?]);
- Line 329: const option = getVal(lines, ['Option', '?듭뀡']);
- Line 330: const amount = getVal(lines, ['Amount', '寃곗젣湲덉븸', '?섎웾']);
- Line 331: const image = getVal(lines, ['Image', '?대?吏']);
- Line 362: const orderNo = getVal(lines, ['Order No', '二쇰Ц踰덊샇', '二쇰Ц 踰덊샇']);
- Line 363: const depositor = getVal(lines, ['Depositor', '?낃툑?먮챸']);
- Line 383: const brand = getVal(lines, ['Brand', '釉뚮옖??]);
- Line 384: const title = getVal(lines, ['Title', '?곹뭹紐?]);
- Line 385: const price = getVal(lines, ['Price', '媛寃?]);
- Line 386: const link = getVal(lines, ['Link', '留곹겕', '諛붾줈媛湲?]);
- Line 387: const image = getVal(lines, ['Image', '?대?吏']);
- Line 425: const stayName = getVal(lines, ['Stay', '?숈냼']);
- Line 426: const dates = getVal(lines, ['Dates', '?쇱젙']);
- Line 427: const nights = getVal(lines, ['Nights', '諛?, '?숇컯 ?쇱닔']);
- Line 428: const guests = getVal(lines, ['Guests', '?몄썝']);
- Line 429: const amount = getVal(lines, ['Amount', '湲덉븸']);
- Line 430: const applicant = getVal(lines, ['Applicant', '?덉빟??]);
- Line 431: const image = getVal(lines, ['Image', '?대?吏']);
- Line 460: const stayName = getVal(lines, ['Stay', '?숈냼']);
- Line 461: const dates = getVal(lines, ['Dates', '?쇱젙']);
- Line 482: const space = getVal(lines, ['Space', '怨듦컙']);
- Line 483: const date = getVal(lines, ['Date', '?좎쭨']);
- Line 484: const time = getVal(lines, ['Time', '?쒓컙']);
- Line 485: const purpose = getVal(lines, ['Purpose', '紐⑹쟻']);
- Line 486: const headcount = getVal(lines, ['Headcount', '?몄썝']);
- Line 487: const message = getVal(lines, ['Message', '硫붿떆吏']);

### components/feed/CreateFeedPopup.tsx (1 strings)
- Line 304: {/* Style Row ??Impact + Emphasis ??餓?(??0??????뽯뻻) */}

### components/feed/MediaViewerPopup.tsx (5 strings)
- Line 63: history.back(); // popstate 諛쒖깮 ??handlePopState?먯꽌 onClose() ?몄텧
- Line 144: {/* ?곷떒 ?ㅻ뜑 */}
- Line 157: {/* 誘몃뵒???곸뿭 */}
- Line 186: {/* ?댁쟾/?ㅼ쓬 踰꾪듉 */}
- Line 205: {/* ?섎떒 ?꾪듃 ?몃뵒耳?댄꽣 */}

### components/groups/GroupAbout.tsx (4 strings)
- Line 91: {group.publicTransport || '?⑹젙??8踰?異쒓뎄?먯꽌 10遺?(10 mins from Hapjeong St. Exit 8)'}
- Line 123: const query = encodeURIComponent(group.address || '媛뺣궓援?42-1');
- Line 133: const query = encodeURIComponent(group.address || '媛뺣궓援?42-1');
- Line 143: const query = encodeURIComponent(group.address || '媛뺣궓援?42-1');

### components/groups/GroupAccountEditor.tsx (23 strings)
- Line 121: <option value="KB援????? className="bg-[#0a0f1d] text-white font-normal">{t("bank.kb", "KB Kookmin Bank")}</option>
- Line 122: <option value="?좏븳??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.shinhan", "Shinhan Bank")}</option>
- Line 123: <option value="?섎굹??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.hana", "Hana Bank")}</option>
- Line 124: <option value="?곕━??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.woori", "Woori Bank")}</option>
- Line 125: <option value="NH?랁삊??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.nh", "NH Nonghyup Bank")}</option>
- Line 126: <option value="IBK湲곗뾽??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.ibk", "IBK Industrial Bank")}</option>
- Line 127: <option value="移댁뭅?ㅻ콉?? className="bg-[#0a0f1d] text-white font-normal">{t("bank.kakao", "KakaoBank")}</option>
- Line 128: <option value="?좎뒪諭낇겕" className="bg-[#0a0f1d] text-white font-normal">{t("bank.toss", "Toss Bank")}</option>
- Line 129: <option value="耳?대콉?? className="bg-[#0a0f1d] text-white font-normal">{t("bank.kbank", "K Bank")}</option>
- Line 132: <option value="iM諭낇겕" className="bg-[#0a0f1d] text-white font-normal">{t("bank.im", "iM Bank (formerly DGB)")}</option>
- Line 133: <option value="遺?곗??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.busan", "Busan Bank")}</option>
- Line 134: <option value="寃쎈궓??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.kyongnam", "Kyongnam Bank")}</option>
- Line 135: <option value="愿묒＜??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.kwangju", "Kwangju Bank")}</option>
- Line 136: <option value="?꾨턿??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.jeonbuk", "Jeonbuk Bank")}</option>
- Line 137: <option value="?쒖＜??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.jeju", "Jeju Bank")}</option>
- Line 140: <option value="SC?쒖씪??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.sc", "SC First Bank")}</option>
- Line 141: <option value="?쒓뎅?⑦떚??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.citi", "Citibank Korea")}</option>
- Line 142: <option value="?섑삊??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.suhyup", "Suhyup Bank")}</option>
- Line 145: <option value="?곗껜援? className="bg-[#0a0f1d] text-white font-normal">{t("bank.post", "Post Office")}</option>
- Line 146: <option value="?덈쭏?꾧툑怨? className="bg-[#0a0f1d] text-white font-normal">{t("bank.mg", "MG Community Credit Cooperatives")}</option>
- Line 147: <option value="?좏삊" className="bg-[#0a0f1d] text-white font-normal">{t("bank.shinhyup", "Shinhyup")}</option>
- Line 148: <option value="?異뺤??? className="bg-[#0a0f1d] text-white font-normal">{t("bank.savings", "Savings Bank")}</option>
- Line 149: <option value="?곕┝議고빀" className="bg-[#0a0f1d] text-white font-normal">{t("bank.forest", "Forestry Cooperative")}</option>

### components/groups/GroupCalendar.tsx (2 strings)
- Line 87: type: s.title.toLowerCase().includes('milonga') || s.title.toLowerCase().includes('諛濡깃?') ? 'milonga' : 'social',
- Line 102: type: s.title.toLowerCase().includes('milonga') || s.title.toLowerCase().includes('諛濡깃?') ? 'milonga' : 'social',

### components/groups/GroupHome.tsx (3 strings)
- Line 162: if (total === 0) return { male: 45, female: 55 }; // 湲곕낯 鍮꾩쑉 (?곗씠???놁쓣 ??
- Line 251: setShowJoinModal(true); // "?섏쁺?⑸땲?? ?앹뾽
- Line 254: setShowJoinModal(true); // "?좎껌 ?꾨즺" ?앹뾽

### components/groups/PostEditorModal.tsx (2 strings)
- Line 66: setBgTheme(null); // ?뚮쭏 ?댁젣
- Line 107: setMediaPreview(null); // ?대?吏 ?쒓굅

### components/layout/InAppBrowserGuard.tsx (1 strings)
- Line 111: {t('guard.desc_kr', '?몃? 釉뚮씪?곗??먯꽌 ?대㈃ ???덉젙?곸쑝濡??댁슜?????덉뒿?덈떎.')}

### components/layout/NavigationDrawer.tsx (1 strings)
- Line 14: { code: 'ko', name: 'Korean', native: '?쒓뎅??, active: false },

### components/providers/AuthProvider.tsx (2 strings)
- Line 203: duration: 15000, // 15珥????먮룞 ?ロ옒
- Line 228: }, 3000); // ?섏씠吏 濡쒕뵫 ??3珥??ㅼ뿉 ?꾩?

### components/shop/ProductDetail.tsx (1 strings)
- Line 377: {/* 2) Scarcity Bar ???쒖씪 ?꾨줈 */}

### components/social/SocialHeroCard.tsx (3 strings)
- Line 11: const hasKorean = /[媛-??/.test(text);
- Line 15: main = text.replace(/[媛-??)]+/g, '').replace(/\s+/g, ' ').trim();
- Line 16: const subMatch = text.match(/[媛-??+/g);

## Module: hooks
### hooks/useHistoryBack.ts (1 strings)
- Line 85: history.back(); // ?붾? ?곹깭 ?쒓굅

### hooks/useModalNavigation.ts (1 strings)
- Line 47: searchParams // 異붽??곸씤 ?뚮씪誘명꽣 ?쒖뼱瑜??꾪빐 諛섑솚

### hooks/useNavigationGuard.ts (1 strings)
- Line 8: warningMessage: string = "??踰????꾨Ⅴ硫?諛⑹쓣 ?섍컩?덈떎"

## Module: lib
### lib/ai/helpDeskAI.ts (7 strings)
- Line 18: KR: `吏덈Ц???④꺼二쇱뀛??媛먯궗?⑸땲?? ?쨼
- Line 20: ???????뺤씤 ??怨??듬??쒕━寃좎뒿?덈떎.
- Line 21: ??鍮좊Ⅸ ?꾩????꾩슂?섏떆硫??꾨옒 ?듭떖 硫붾돱瑜?李멸퀬??二쇱꽭??
- Line 23: ??**Social**: 諛濡깃?/?꾨옓?곗뭅 ?뺤씤 諛??덉빟
- Line 24: ??**Events**: ?섏뒪?곕쾶/留덈씪?????밸퀎 ?대깽??  Line 25: ??**Groups**: 而ㅻ??덊떚 洹몃９ 媛??諛?愿由?  Line 26: ??**Live**: ?ㅼ떆媛??ъ쭊/?곸긽 怨듭쑀
- Line 27: ??**My Page ??Wallet**: 寃곗젣 諛??붿븸 愿由?  Line 28: ??**My Page ??My Info**: ?꾨줈???ㅼ젙`,
- Line 46: return /[????????媛-??/.test(content);

### lib/ai/wocSystemGuide.ts (32 strings)
- Line 154: keywords: ['login', 'log in', 'sign in', 'signin', '濡쒓렇??, '?묒냽', '?몄쬆', 'verification', 'sms', '臾몄옄'],
- Line 155: responseKR: '濡쒓렇??愿???덈궡?낅땲???벑\n\n1. ?щ컮瑜?援?? 肄붾뱶瑜??좏깮?덈뒗吏 ?뺤씤??二쇱꽭??\n2. SMS ?몄쬆 肄붾뱶瑜?諛쏆? 紐삵뻽?ㅻ㈃ 60珥????ㅼ떆 ?쒕룄??二쇱꽭??\n3. 怨꾩냽 臾몄젣媛 ?덈떎硫??ъ슜 以묒씤 ?꾪솕踰덊샇? ?④퍡 ?곸꽭???④꺼二쇱꽭??',
- Line 159: keywords: ['register', 'registration', 'book', 'booking', 'ticket', '?깅줉', '?덉빟', '?곗폆', '?좎껌', 'sign up'],
- Line 160: responseKR: '?대깽???깅줉 諛⑸쾿 ?덈궡?낅땲???렖\n\n1. ?대떦 ?대깽???뚯뀥 ?섏씠吏濡??대룞\n2. **Registration** ??쓣 ??n3. ?먰븯???⑦궎吏瑜??좏깮\n4. 寃곗젣瑜??꾨즺?섎㈃ ?깅줉 ?꾨즺!\n\n?깅줉 ?댁뿭? My Page ??History?먯꽌 ?뺤씤 媛?ν빀?덈떎.',
- Line 164: keywords: ['milonga', 'social', 'practica', '諛濡깃?', '?꾨옓?곗뭅', 'dance', '異?, '?뚯뀥'],
- Line 165: responseKR: '?뚯뀥/諛濡깃? 愿???덈궡?낅땲???뭴\n\n**Social** ??뿉?????멸퀎 諛濡깃?? ?꾨옓?곗뭅瑜??뺤씤?섏떎 ???덉뒿?덈떎.\n- ?꾩떆/?좎쭨蹂??꾪꽣留?媛??n- DJ ?쇱씤?? ?ㅼ?以? ?쒕젅?ㅼ퐫???뺤씤\n- 諛붾줈 ?깅줉/?덉빟 媛??n\n媛??뚯뀥?먮뒗 Home / Programs / Feed / Live / Registration ??씠 ?덉뒿?덈떎.',
- Line 169: keywords: ['event', 'festival', 'marathon', 'encuentro', '?대깽??, '?섏뒪?곕쾶', '留덈씪??],
- Line 170: responseKR: '?대깽???섏뒪?곕쾶 愿???덈궡?낅땲???럦\n\n**Events** ??뿉???섏뒪?곕쾶, 留덈씪?? ?붿퓼?뷀듃濡????밸퀎 ?대깽?몃? ?뺤씤?섏꽭??\n- ?꾪떚?ㅽ듃/媛뺤궗 ?꾨줈???뺤씤\n- ?곸꽭 ?꾨줈洹몃옩 ?쇱젙 ?뺤씤\n- ?⑦궎吏 ?좏깮 諛??깅줉 媛??n\n媛??대깽?몄뿉??Home / Programs / Feed / Live / Registration ??씠 ?덉뒿?덈떎.',
- Line 174: keywords: ['group', 'groups', 'join', '洹몃９', '媛??, '?뚮え??, 'member'],
- Line 175: responseKR: '洹몃９ 愿???덈궡?낅땲???뫁\n\n**Groups** ??뿉??而ㅻ??덊떚 洹몃９??李얠븘 媛?낇븯?????덉뒿?덈떎.\n- 媛?낇븯硫?洹몃９ 梨꾪똿諛⑹씠 ?먮룞 ?앹꽦?⑸땲??n- 洹몃９ 罹섎┛?? ?쇰뱶, ?대깽???뺤씤 媛??n- 硫ㅻ쾭 珥덈???媛?ν빀?덈떎\n\n??洹몃９ 媛쒖꽕??媛?ν빀?덈떎!',
- Line 179: keywords: ['live', 'photo', 'video', 'gallery', '媛ㅻ윭由?, '?ъ쭊', '?곸긽', '?쇱씠釉?],
- Line 180: responseKR: 'Live 媛ㅻ윭由?愿???덈궡?낅땲???벝\n\n**Live** ??뿉???ㅼ떆媛??ъ쭊/?곸긽??怨듭쑀?????덉뒿?덈떎.\n- + 踰꾪듉???뚮윭 ???ъ뒪???묒꽦\n- ?щ엺, 洹몃９, ?뚯뀥, ?대깽?? ?대옒?ㅻ? ?쒓렇 媛??n- "Also show in Live" ?좉?濡?Live ?쇰뱶 ?몄텧 ?щ? ?좏깮\n- 醫뗭븘?? ?볤? 湲곕뒫 吏??,
- Line 184: keywords: ['profile', 'nickname', 'photo', 'edit', '?꾨줈??, '?됰꽕??, '?섏젙', '蹂寃?, '?ㅼ젙'],
- Line 185: responseKR: '?꾨줈???ㅼ젙 ?덈궡?낅땲???숋툘\n\nMy Page ??**My Info**?먯꽌 ?꾨줈?꾩쓣 ?섏젙?????덉뒿?덈떎.\n- ?됰꽕?? ?ㅼ씠?곕툕 ?됰꽕??鍮꾩쁺臾??대쫫)\n- ?꾨줈???ъ쭊 ?낅줈??n- ?꾩뒪 ??븷 ?ㅼ젙 (Leader/Follower/Both)\n- ?먭린?뚭컻, SNS 留곹겕 異붽?',
- Line 189: keywords: ['wallet', 'payment', 'pay', 'money', 'refund', '?붾젢', '寃곗젣', '?섎텋', '??, '?낃툑', '異⑹쟾'],
- Line 190: responseKR: '?붾젢/寃곗젣 愿???덈궡?낅땲???뮥\n\nMy Page ??**Wallet**?먯꽌 ?붿븸怨?嫄곕옒 ?댁뿭???뺤씤?????덉뒿?덈떎.\n- ?대깽???깅줉 ???붾젢?쇰줈 寃곗젣 媛??n- ?섎텋 ?붿껌? ?대떦 ?대깽??二쇱턀?먯뿉寃?臾몄쓽?섏꽭??n- 嫄곕옒 ?댁뿭?먯꽌 ?꾩껜 ?대젰 ?뺤씤 媛??,
- Line 194: keywords: ['chat', 'message', 'dm', '梨꾪똿', '硫붿떆吏', '???],
- Line 195: responseKR: '梨꾪똿 愿???덈궡?낅땲???뮠\n\n**Chat** 硫붾돱?먯꽌 1:1 硫붿떆吏? 洹몃９ 梨꾪똿???댁슜?????덉뒿?덈떎.\n- 洹몃９ 媛????洹몃９ 梨꾪똿諛⑹씠 ?먮룞 ?앹꽦?⑸땲??n- People ??뿉???ъ슜?먮? 李얠븘 硫붿떆吏瑜?蹂대궪 ???덉뒿?덈떎',
- Line 199: keywords: ['lost', 'found', 'missing', '遺꾩떎', '?껋뼱踰?, '李얠븘'],
- Line 200: responseKR: '遺꾩떎臾?愿???덈궡?낅땲???뵇\n\n**Lost & Found** (/lost)?먯꽌 遺꾩떎臾쇱쓣 ?좉퀬?섍굅??寃?됲븷 ???덉뒿?덈떎.\n- Register 踰꾪듉?쇰줈 遺꾩떎臾??깅줉\n- ?ㅻ챸怨??ъ쭊???④퍡 ?щ젮二쇱떆硫?李얘린 ?쎌뒿?덈떎\n- ?ㅻⅨ ?ъ슜?먭? 諛쒓껄?섎㈃ ?곕씫??諛쏆쓣 ???덉뒿?덈떎',
- Line 204: keywords: ['class', 'lesson', 'workshop', 'instructor', 'teacher', '?대옒??, '?섏뾽', '?덉뒯', '?뚰겕??, '媛뺤궗'],
- Line 205: responseKR: '?대옒??愿???덈궡?낅땲???럳\n\n**Class** ??뿉???깃퀬 ?섏뾽怨??뚰겕?띿쓣 ?뺤씤?????덉뒿?덈떎.\n- 洹몃９/媛뺤궗蹂꾨줈 寃??媛??n- ?섏뾽 ?쇱젙怨??곸꽭 ?댁슜 ?뺤씤\n- 諛붾줈 ?깅줉 媛?ν빀?덈떎',
- Line 209: keywords: ['venue', 'place', 'location', 'address', '?μ냼', '踰좊돱', '二쇱냼', '?꾩튂'],
- Line 210: responseKR: '踰좊돱 愿???덈궡?낅땲???뱧\n\n**Venues** ??뿉?????멸퀎 ?깃퀬 踰좊돱瑜?寃?됲븷 ???덉뒿?덈떎.\n- ?곸꽭 ?뺣낫, ?꾩튂, ?대깽???뺤씤\n- 由щ럭 ?뺤씤 媛??n- 吏?꾩뿉??二쇰? 踰좊돱 寃??,
- Line 214: keywords: ['shop', 'buy', 'shoe', 'clothing', '?쇳븨', '援щℓ', '?좊컻', '?섎쪟', '?곹뭹'],
- Line 215: responseKR: '?쇳븨 愿???덈궡?낅땲???썚截?n\n**Shop** ??뿉???깃퀬 ?덉쫰, ?섎쪟, ?≪꽭?쒕━瑜?援щℓ?????덉뒿?덈떎.\n以묎퀬 嫄곕옒??**Resale** ??쓣 ?댁슜??二쇱꽭??',
- Line 219: keywords: ['rental', 'rent', '?뚰깉', '???, '?愿'],
- Line 220: responseKR: '?뚰깉 愿???덈궡?낅땲???쩃\n\n**Rental** ??뿉??踰좊돱 ?愿 諛??섏긽/?λ퉬 ?뚰깉 ?쒕퉬?ㅻ? ?댁슜?????덉뒿?덈떎.\n- ?뚰깉 ?곹뭹 ?깅줉??媛?ν빀?덈떎',
- Line 224: keywords: ['stay', 'accommodation', 'hotel', 'airbnb', '?숈냼', '?명뀛', '?숇컯'],
- Line 225: responseKR: '?숈냼 愿???덈궡?낅땲???룧\n\n**Stay** ??뿉???ы뻾?섎뒗 ?꾩꽌瑜??꾪븳 ?숈냼瑜?李얠쓣 ???덉뒿?덈떎.\n- ?대깽??湲곌컙 ?숈븞???숈냼 寃??n- ?꾩떆由ъ뒪??湲곕뒫?쇰줈 愿???숈냼 ???,
- Line 229: keywords: ['error', 'bug', 'crash', 'not working', 'broken', '?ㅻ쪟', '?먮윭', '?덈뤌', '怨좎옣', '?묐룞', '?덈맖', '臾몄젣'],
- Line 230: responseKR: '遺덊렪???쒕젮 二꾩넚?⑸땲???삦\n\n臾몄젣 ?닿껐???꾪빐 ?ㅼ쓬 ?뺣낫瑜??④꺼二쇱꽭??\n1. ?대뼡 ?섏씠吏?먯꽌 諛쒖깮?덈굹??\n2. ?대뼡 ?숈옉???섎떎媛 臾몄젣媛 ?앷꼈?섏슂?\n3. ?먮윭 硫붿떆吏媛 ?덈떎硫??ㅽ겕由곗꺑??泥⑤???二쇱꽭??\n\n?꾩떆濡??섏씠吏 ?덈줈怨좎묠???쒕룄??蹂댁꽭?? 湲곗닠????뺤씤 ???듬??쒕━寃좎뒿?덈떎!',

### lib/constants/navigation.ts (15 strings)
- Line 20: { id: 'home', label: '??, group: 'Tango World', icon: Map, href: '/home' },
- Line 21: { id: 'plaza', label: '?꾨씪??, group: 'Tango World', icon: Library, href: '/plaza' },
- Line 22: { id: 'venues', label: '?μ냼(踰좊돱)', group: 'Tango World', icon: MapPin, href: '/venues' },
- Line 23: { id: 'groups', label: '洹몃９', group: 'Tango World', icon: Users, href: '/groups' },
- Line 26: { id: 'events', label: '?대깽??, group: 'Activity', icon: Calendar, href: '/events' },
- Line 27: { id: 'social', label: '?뚯뀥', group: 'Activity', icon: Heart, href: '/social' },
- Line 29: { id: 'class', label: '?대옒??, group: 'Activity', icon: Library, href: '/class' },
- Line 32: { id: 'shop', label: '??, group: 'Space', icon: ShoppingBag, href: '/shop' },
- Line 33: { id: 'resale', label: '由ъ꽭??, group: 'Space', icon: Store, href: '/resale' },
- Line 34: { id: 'stay', label: '?ㅽ뀒??, group: 'Space', icon: Tent, href: '/stay' },
- Line 35: { id: 'lost', label: '遺꾩떎臾쇱갼湲?, group: 'Space', icon: MessageSquare, href: '/lost' },
- Line 36: { id: 'hub', label: '?대룞', group: 'Space', icon: Cpu, href: '/hub' },
- Line 39: { id: 'wallet', label: '吏媛?, group: 'My Page', icon: Wallet, href: '/wallet' },
- Line 40: { id: 'history', label: '?덉뒪?좊━', group: 'My Page', icon: MessageSquare, href: '/history' },
- Line 41: { id: 'profile', label: '???뺣낫', group: 'My Page', icon: Settings, href: '/profile' },

### lib/constants/socialData.ts (14 strings)
- Line 11: day?: string; // e.g., '03/24(??'
- Line 16: title: 'Lucas & Paula ?쒖슱 ?뚰겕??,
- Line 17: subtitle: '10/25-30 (6?쇨컙) / ?쇰━踰꾨뱶 15% d.c',
- Line 25: title: `?깃퀬 ?뚯뀥 ?섏씠??#${i + 1}`,
- Line 26: place: '媛뺣궓 ?깃퀬 ?띿뒪',
- Line 35: day: string; // e.g., '03/24(??'
- Line 40: day: `03/${24 + i}(${['??, '??, '紐?, '湲?, '??, '??, '??][i]})`,
- Line 43: title: `諛濡깃? ??遺덈┛`,
- Line 44: place: '?⑹젙 ??,
- Line 45: time: '20:00 - ?듭씪 01:00',
- Line 55: title: '遺?먮끂?ㅼ븘?대젅??留덉뒪??留덈씪??,
- Line 56: place: '?몄쿇 ?뚮씪?ㅼ씠???쒗떚',
- Line 57: time: '48?쒓컙 ?곗냽 吏꾪뻾',
- Line 66: export const REGIONS = ['?쒖슱', '寃쎄린', '遺??, '???, '?援?, '愿묒＜', '?쒖＜'];

### lib/firebase/chatService.ts (1 strings)
- Line 267: lastMessage: type === 'business' ? '?곹뭹 臾몄쓽媛 ?쒖옉?섏뿀?듬땲??' : '??붽? ?쒖옉?섏뿀?듬땲??'

### lib/firebase/fcmService.ts (3 strings)
- Line 25: console.warn('VAPID Key媛 ?ㅼ젙?섏? ?딆븘 ?몄떆 ?좏겙??諛쒓툒?????놁뒿?덈떎.');
- Line 47: console.error('FCM ?좏겙 諛쒓툒 以??ㅻ쪟:', error);
- Line 62: console.error('FCM ?좏겙 ???以??ㅻ쪟:', error);

### lib/firebase/feedService.ts (2 strings)
- Line 167: likesCount: increment(-1) // ?섏쐞 ?명솚??  Line 233: parentId: commentData.parentId || null, // 紐낆떆?곸쑝濡?null ?ㅼ젙
- Line 283: where('parentId', '==', null), // ?? 湲곗〈 ?곗씠?곌? parentId媛 ?녿뒗 寃쎌슦 ???섏삱 ???덉쓬

### lib/firebase/galleryService.ts (2 strings)
- Line 25: groupId?: string;       // class媛 ?랁븳 洹몃９ ID
- Line 27: avatar?: string;        // people???꾨줈???ъ쭊

### lib/firebase/notificationService.ts (2 strings)
- Line 161: groupId: string | undefined, // undefined硫?紐⑤뱺 洹몃９??Todo 媛?몄삤湲?--- lib/firebase/shopService.ts ---
- Line 200: throw new Error("?댁넚??踰덊샇媛 ?꾩슂?⑸땲??");

## Module: scripts
### scripts/find-venue.ts (1 strings)
- Line 28: if (data.nameKo && data.nameKo.toLowerCase().includes('留덈씪鍮?)) {

## Module: types
### types/event.ts (22 strings)
- Line 7: id: string;                      // "G1", "C1", "A1" ??(?ㅺ굅?섏씠?媛 吏??
- Line 9: titleNative?: string;            // "?깃퀬 ?대”"
- Line 10: description?: string;            // ?곷Ц ?곸꽭 ?ㅻ챸
- Line 12: category?: string;               // "?쇰컲?섏뾽" / "?뚰듃?덉닔?? / "?몃??섎━?? (洹몃９?묒슜)
- Line 18: duration?: number;               // 遺?(80遺?
- Line 22: level?: string;                  // "all" | "adv" | "intermediate" ??  Line 24: isRecommended?: boolean;         // 媛뺤궗 異붿쿇 ?쒓렇
- Line 32: capacityUnit?: 'person' | 'couple'; // "15紐? vs "12?"
- Line 35: price?: number;                  // ???꾨줈洹몃옩??媛寃?(?쒕━利??꾩껜 or 1??
- Line 36: priceUnit?: 'total' | 'per_session'; // ?쒕━利??꾩껜媛寃?vs ?뚮떦媛寃?  Line 45: advance: number;               // ?덈ℓ媛 (??5,000)
- Line 46: door?: number;                 // ?꾨ℓ媛 (??0,000)
- Line 55: label?: string;                // "?뚰겕??6 + 諛濡깃?"
- Line 60: earlyBirdDeadline?: string;      // ISO date (?덉쑝硫?advance=early bird)
- Line 76: selectedProgramIds: string[];    // ["G1","G3","S1"] ?먮뒗 full_pass硫??꾩껜
- Line 152: programViewMode?: 'by_date' | 'by_category'; // ?꾨줈洹몃옩 ??酉?紐⑤뱶
- Line 163: galleryImages?: string[];           // 媛ㅻ윭由??ъ쭊??(硫붿씤 ?대?吏 ??
- Line 164: artists?: EventArtist[];            // ?꾪떚?ㅽ듃 (Maestro / DJ)
- Line 165: eventVenues?: EventVenueItem[];     // ?대깽??踰좊돱 (蹂듭닔)
- Line 166: packages?: EventPackage[];          // ?⑦궎吏 (?대옒??踰덈뱾)
- Line 167: scheduleDays?: EventScheduleDay[];  // ?ㅼ?以?(?쇰퀎 ?쒓컙???대?吏)
- Line 172: registrationUrl?: string;       // ?몃? ?깅줉 ??(tally.so ??
- Line 173: bankInfo?: string;              // ?낃툑 怨꾩쥖 ?뺣낫
- Line 174: tag?: string;                   // ?쇰뱶/?쇱씠釉뚯슜 ?쒓렇 ?뺣낫 (?? ?뱀젙 ?꾪떚?ㅽ듃??洹몃９ ?앸퀎??

### types/group.ts (15 strings)
- Line 174: buildingType?: string; // e.g. ?꾪뙆?? ?ㅽ뵾?ㅽ뀛, 鍮뚮씪, ?⑤룆二쇳깮
- Line 175: structure?: string; // e.g. ?먮８, ?щ８, ?곕━猷?
- Line 176: floor?: string; // e.g. 1痢? 2痢? 諛섏??? ?ν깙
- Line 188: includedUtilities?: string[]; // e.g. ?꾧린, 媛?? ?섎룄, ?명꽣??  Line 192: parkingPolicy?: string; // e.g. 遺덇?, 1? 臾대즺, ?좊즺
- Line 195: rules?: string[]; // e.g. 諛섎젮?숇Ъ 遺덇?, ?ㅻ궡 ?≪뿰 湲덉?
- Line 351: confirmedAt?: any;          // 愿由ъ옄媛 ?묒닔 ?꾨즺 泥섎━ ??(?ν썑 援ы쁽)
- Line 352: itemType?: 'class' | 'discount' | 'monthlyPass';  // ?좉퇋 ?깅줉 ?????  Line 353: groupName?: string;         // ?좉퇋 ?깅줉 ?????--- types/lostFound.ts ---
- Line 13: location: string;       // ?대읇, ?μ냼 ?대쫫
- Line 14: date: string;           // 遺꾩떎/?듬뱷 ?쇱옄 (YYYY-MM-DD ?뺤떇 沅뚯옣)
- Line 16: reward?: number;        // ?щ?湲?(Bounty)
- Line 18: authorId: string;       // ?묒꽦??UID
- Line 19: authorName?: string;    // ?묒꽦???대쫫 (?쒖떆??
- Line 20: authorPhoto?: string;   // ?묒꽦???꾨줈???ъ쭊
- Line 22: isFeatured?: boolean;   // ?곷떒 ?몄텧 ?щ?
- Line 24: likesCount: number;     // 愿???꾩떆 ??  Line 25: viewsCount: number;     // 議고쉶??  Line 33: id: string;             // 臾몄꽌 ID: {userId}_{itemId}

### types/rental.ts (1 strings)
- Line 10: category: string; // e.g., '?꾩뒪 ?ㅽ뒠?붿삤', '?뚰떚猷?, '?곗뒿??

### types/shop.ts (10 strings)
- Line 52: id: string;             // 臾몄꽌 ID: {userId}_{productId}
- Line 55: status?: 'liked' | 'pending' | 'in_progress'; // 異붽???  Line 74: | 'PENDING'             // ?낃툑 ?湲?(1?쒓컙 ?대궡)
- Line 75: | 'PAYMENT_REPORTED'    // ?낃툑 蹂닿퀬 (legacy compat)
- Line 76: | 'CONFIRMED'           // ?낃툑 ?뺤씤 (?먮ℓ???뺤씤)
- Line 77: | 'IN_PRODUCTION'       // ?쒖옉以?  Line 78: | 'READY_PICKUP'        // 留ㅼ옣?섎졊 媛??  Line 79: | 'SHIPPING'            // 諛곗넚以?  Line 80: | 'COMPLETED'           // ?꾨즺
- Line 81: | 'EXPIRED'             // 1?쒓컙 珥덇낵 ?먮룞 留뚮즺
- Line 82: | 'CANCELLED';          // 痍⑥냼
- Line 160: label: string;          // UI label: '諛쒕낵', '諛쒕벑'
- Line 163: labels?: string[];      // UI display: ['?덇랠??, '??대뱶', '?묒뒪?몃씪 ??대뱶']
- Line 174: label: string;           // "5,000???좎씤"

### types/stay.ts (21 strings)
- Line 18: baseRate: number;          // 1諛?湲곕낯 ?붽툑
- Line 31: swiftCode?: string;        // ?댁쇅 ?↔툑??  Line 36: transferDeadlineHours: number; // ?낃툑 湲고븳 (?쒓컙)
- Line 66: paymentRequest?: string;   // ?낃툑 ?붿껌 ?쒗뵆由?  Line 67: confirmed?: string;        // 怨꾩빟 ?뺤젙 ?쒗뵆由?  Line 68: doorCode?: string;         // 鍮꾨?踰덊샇 ?꾩넚 ?쒗뵆由?  Line 86: doorCode: string;           // 湲곕낯 "9999"
- Line 105: status?: 'liked' | 'pending' | 'in_progress'; // 鍮꾩쫰?덉뒪 ?뚯씠?꾨씪???곹깭
- Line 116: | 'APPLIED'               // ???먮떂???덉빟 ?좎껌
- Line 117: | 'PAYMENT_REQUESTED'     // ??愿由ъ옄媛 ?낃툑 ?붿껌 SMS 諛쒖넚
- Line 118: | 'PAID'                  // ???먮떂 ?낃툑 ??愿由ъ옄 ?뺤씤
- Line 119: | 'CONFIRMED'             // ??怨꾩빟 ?뺤젙 + ?뺤젙 SMS + 罹섎┛??諛섏쁺
- Line 120: | 'CODE_SENT'             // ??泥댄겕???뱀씪 鍮꾨?踰덊샇 SMS 諛쒖넚
- Line 121: | 'COMPLETED'             // ???숇컯 ?꾨즺
- Line 122: | 'REJECTED'              // 愿由ъ옄 嫄곗젅
- Line 123: | 'CANCELLED';            // ?먮떂 痍⑥냼
- Line 135: sentBy: string;            // 諛쒖넚??userId
- Line 136: to: string;                // ?섏떊 ?꾪솕踰덊샇
- Line 156: depositorName?: string;    // ?낃툑?먮챸
- Line 157: depositDate?: string;      // ?낃툑 ?덉젙??  Line 158: transferredAt?: any;       // ?ㅼ젣 ?낃툑 ?쒓컖 (Timestamp)
- Line 159: confirmedAt?: any;         // 愿由ъ옄 ?뺤씤 ?쒓컖 (Timestamp)
- Line 165: groupId: string;           // FK ??groups/{groupId} (Manager Todo ?꾪꽣)
- Line 166: stayTitle: string;         // 鍮꾩젙洹쒗솕
- Line 173: contactNumber: string;     // SMS 諛쒖넚 ???  Line 210: itemTitle: string;           // ?대옒?ㅻ챸 or Stay紐?  Line 211: itemDetail?: string;         // "3 nights" | "2?쒓컙"
- Line 215: contactNumber?: string;      // SMS 諛쒖넚??  Line 219: sourceData?: any;            // ?먮낯 ?곗씠???꾩껜 (?≪뀡 泥섎━??

### types/venue.ts (1 strings)
- Line 8: nameKo?: string; // Korean name (e.g. ?깃퀬?쇱씠??

