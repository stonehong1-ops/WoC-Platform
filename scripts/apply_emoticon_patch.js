const fs = require('fs');
const path = require('path');

// 1. Define Emoticon Data
const DAILY_EMOTICONS = [
  { id: 'sticker_daily_1', name: 'sticker_daily_1', ko: '인사', en: 'Hello' },
  { id: 'sticker_daily_2', name: 'sticker_daily_2', ko: '감사', en: 'Thanks' },
  { id: 'sticker_daily_3', name: 'sticker_daily_3', ko: '응원', en: 'Cheer up' },
  { id: 'sticker_daily_4', name: 'sticker_daily_4', ko: '기도', en: 'Pray' },
  { id: 'sticker_daily_5', name: 'sticker_daily_5', ko: '축하', en: 'Congrats' },
  { id: 'sticker_daily_6', name: 'sticker_daily_6', ko: '죄송', en: 'Sorry' },
  { id: 'sticker_daily_7', name: 'sticker_daily_7', ko: '사랑', en: 'Love' },
  { id: 'sticker_daily_8', name: 'sticker_daily_8', ko: '질문', en: 'Question' },
  { id: 'sticker_daily_9', name: 'sticker_daily_9', ko: '기쁨', en: 'Joy' },
  { id: 'sticker_daily_10', name: 'sticker_daily_10', ko: '슬픔', en: 'Sadness' },
  { id: 'sticker_daily_11', name: 'sticker_daily_11', ko: '놀람', en: 'Shocked' },
  { id: 'sticker_daily_12', name: 'sticker_daily_12', ko: '화남', en: 'Angry' },
  { id: 'sticker_daily_13', name: 'sticker_daily_13', ko: '윙크', en: 'Wink' },
  { id: 'sticker_daily_14', name: 'sticker_daily_14', ko: '메롱', en: 'Playful' },
  { id: 'sticker_daily_15', name: 'sticker_daily_15', ko: '졸림', en: 'Sleepy' },
  { id: 'sticker_daily_16', name: 'sticker_daily_16', ko: '눈물', en: 'Tears' },
  { id: 'sticker_daily_17', name: 'sticker_daily_17', ko: '당황', en: 'Flustered' },
  { id: 'sticker_daily_18', name: 'sticker_daily_18', ko: '삐짐', en: 'Pouting' },
  { id: 'sticker_daily_19', name: 'sticker_daily_19', ko: '부끄', en: 'Shy' },
  { id: 'sticker_daily_20', name: 'sticker_daily_20', ko: '최고', en: 'Awesome' }
];

const ANIMAL_EMOTICONS = [
  { id: 'sticker_animal_1', name: 'sticker_animal_1', ko: '냥이 안녕', en: 'Cat Hello' },
  { id: 'sticker_animal_2', name: 'sticker_animal_2', ko: '냥이 감사', en: 'Cat Thanks' },
  { id: 'sticker_animal_3', name: 'sticker_animal_3', ko: '냥이 응원', en: 'Cat Cheer' },
  { id: 'sticker_animal_4', name: 'sticker_animal_4', ko: '냥이 하트', en: 'Cat Heart' },
  { id: 'sticker_animal_5', name: 'sticker_animal_5', ko: '냥이 슬픔', en: 'Cat Sad' },
  { id: 'sticker_animal_6', name: 'sticker_animal_6', ko: '댕댕 안녕', en: 'Dog Hello' },
  { id: 'sticker_animal_7', name: 'sticker_animal_7', ko: '댕댕 감사', en: 'Dog Thanks' },
  { id: 'sticker_animal_8', name: 'sticker_animal_8', ko: '댕댕 최고', en: 'Dog Best' },
  { id: 'sticker_animal_9', name: 'sticker_animal_9', ko: '댕댕 하트', en: 'Dog Heart' },
  { id: 'sticker_animal_10', name: 'sticker_animal_10', ko: '댕댕 슬픔', en: 'Dog Sad' },
  { id: 'sticker_animal_11', name: 'sticker_animal_11', ko: '곰돌 인사', en: 'Bear Hello' },
  { id: 'sticker_animal_12', name: 'sticker_animal_12', ko: '곰돌 응원', en: 'Bear Cheer' },
  { id: 'sticker_animal_13', name: 'sticker_animal_13', ko: '곰돌 축하', en: 'Bear Congrats' },
  { id: 'sticker_animal_14', name: 'sticker_animal_14', ko: '토끼 하트', en: 'Bunny Heart' },
  { id: 'sticker_animal_15', name: 'sticker_animal_15', ko: '토끼 메롱', en: 'Bunny Playful' },
  { id: 'sticker_animal_16', name: 'sticker_animal_16', ko: '판다 굿', en: 'Panda Good' },
  { id: 'sticker_animal_17', name: 'sticker_animal_17', ko: '판다 쿨쿨', en: 'Panda Sleepy' },
  { id: 'sticker_animal_18', name: 'sticker_animal_18', ko: '햄찌 냠냠', en: 'Hamster Yummy' },
  { id: 'sticker_animal_19', name: 'sticker_animal_19', ko: '햄찌 미안', en: 'Hamster Sorry' },
  { id: 'sticker_animal_20', name: 'sticker_animal_20', ko: '아기새 럽', en: 'Bird Love' }
];

const REACTION_EMOTICONS = [
  { id: 'sticker_reaction_1', name: 'sticker_reaction_1', ko: 'OK', en: 'OK' },
  { id: 'sticker_reaction_2', name: 'sticker_reaction_2', ko: 'YES', en: 'YES' },
  { id: 'sticker_reaction_3', name: 'sticker_reaction_3', ko: 'NO', en: 'NO' },
  { id: 'sticker_reaction_4', name: 'sticker_reaction_4', ko: '대박', en: 'Wow' },
  { id: 'sticker_reaction_5', name: 'sticker_reaction_5', ko: '축하축하', en: 'Congrats' },
  { id: 'sticker_reaction_6', name: 'sticker_reaction_6', ko: '화이팅', en: 'Fighting' },
  { id: 'sticker_reaction_7', name: 'sticker_reaction_7', ko: '인정', en: 'Agreed' },
  { id: 'sticker_reaction_8', name: 'sticker_reaction_8', ko: '깜놀', en: 'Shocked' },
  { id: 'sticker_reaction_9', name: 'sticker_reaction_9', ko: '헐', en: 'Omg' },
  { id: 'sticker_reaction_10', name: 'sticker_reaction_10', ko: '쉿', en: 'Shh' },
  { id: 'sticker_reaction_11', name: 'sticker_reaction_11', ko: '굿모닝', en: 'Good Morning' },
  { id: 'sticker_reaction_12', name: 'sticker_reaction_12', ko: '굿나잇', en: 'Good Night' },
  { id: 'sticker_reaction_13', name: 'sticker_reaction_13', ko: '문의하기', en: 'Contact Owner' },
  { id: 'sticker_reaction_14', name: 'sticker_reaction_14', ko: '주문완료', en: 'Order Placed' },
  { id: 'sticker_reaction_15', name: 'sticker_reaction_15', ko: '예약완료', en: 'Booked' },
  { id: 'sticker_reaction_16', name: 'sticker_reaction_16', ko: '약속완료', en: 'Meetup Fixed' },
  { id: 'sticker_reaction_17', name: 'sticker_reaction_17', ko: '환영해요', en: 'Welcome' },
  { id: 'sticker_reaction_18', name: 'sticker_reaction_18', ko: '감사해요', en: 'Thank You' },
  { id: 'sticker_reaction_19', name: 'sticker_reaction_19', ko: '최고에요', en: "You're the Best" },
  { id: 'sticker_reaction_20', name: 'sticker_reaction_20', ko: '수고했어', en: 'Great Job' }
];

const ROOT_DIR = path.resolve(__dirname, '..');
const STICKERS_DIR = path.join(ROOT_DIR, 'public', 'stickers');

// Helper to ensure directory exists
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[Dir Created] ${dir}`);
  }
}

// 2. Generate SVG File Contents (100% Transparent, High-End Visuals)
function generateDailySVG(index, key, item) {
  // Yellow character face bases with custom emoji face elements based on index
  const faceColors = {
    normal: ['#FFF59D', '#FBC02D', '#E65100'],
    love: ['#FF8A80', '#FF1744', '#B71C1C'],
    angry: ['#FF7043', '#D84315', '#5D4037'],
    sad: ['#90CAF9', '#1565C0', '#0D47A1'],
    sleepy: ['#E0E0E0', '#757575', '#212121']
  };

  let type = 'normal';
  if (key === 'sticker_daily_7') type = 'love'; // Love
  if (key === 'sticker_daily_12') type = 'angry'; // Angry
  if (key === 'sticker_daily_10' || key === 'sticker_daily_16') type = 'sad'; // Sad/Tears
  if (key === 'sticker_daily_15') type = 'sleepy'; // Sleepy

  const colors = faceColors[type];

  // Specific facial elements
  let faceElements = '';
  let decoration = '';

  switch (key) {
    case 'sticker_daily_1': // Hello (Waving Hand)
      faceElements = `
        <path d="M26,38 Q30,34 34,38" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M46,38 Q50,34 54,38" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M32,48 Q40,56 48,48" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <ellipse cx="26" cy="43" rx="4" ry="2" fill="#FF8A80" opacity="0.6"/>
        <ellipse cx="54" cy="43" rx="4" ry="2" fill="#FF8A80" opacity="0.6"/>
      `;
      decoration = `
        <g transform="translate(56, 38) rotate(15)">
          <path d="M0,0 Q6,-12 12,-6 Q18,0 12,6 Q6,12 0,6 Q-6,0 0,-0" fill="#FFB300" stroke="#FF6F00" stroke-width="1.5"/>
          <path d="M3,-3 Q6,-10 9,-6" stroke="#fff" stroke-width="1" stroke-linecap="round" fill="none"/>
        </g>
      `;
      break;
    case 'sticker_daily_2': // Thanks (Bow / Heart)
      faceElements = `
        <path d="M24,40 C24,36 32,36 32,40" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M48,40 C48,36 56,36 56,40" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M35,48 Q40,52 45,48" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <ellipse cx="24" cy="44" rx="4" ry="3" fill="#FF8A80" opacity="0.7"/>
        <ellipse cx="56" cy="44" rx="4" ry="3" fill="#FF8A80" opacity="0.7"/>
      `;
      decoration = `
        <path d="M40,15 C40,15 37,8 32,8 C27,8 24,12 24,17 C24,24 40,30 40,30 C40,30 56,24 56,17 C56,12 53,8 48,8 C43,8 40,15 40,15 Z" fill="#FF1744" stroke="#B71C1C" stroke-width="1.5"/>
      `;
      break;
    case 'sticker_daily_3': // Cheer (Fist)
      faceElements = `
        <path d="M28,34 L32,38" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
        <path d="M52,34 L48,38" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
        <path d="M30,46 Q40,58 50,46" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      decoration = `
        <g transform="translate(10, 45)">
          <circle cx="12" cy="12" r="10" fill="#FF7043" stroke="#D84315" stroke-width="2"/>
          <path d="M8,12 L16,12 M12,8 L12,16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        </g>
      `;
      break;
    case 'sticker_daily_4': // Pray (Hands)
      faceElements = `
        <path d="M28,36 Q32,34 32,38" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M52,36 Q48,34 48,38" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M34,48 Q40,50 46,48" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
      decoration = `
        <g transform="translate(32, 50)">
          <path d="M4,15 L4,2 Q4,0 8,0 L8,15 Z" fill="#FFF59D" stroke="#FBC02D" stroke-width="1.5"/>
          <path d="M12,15 L12,2 Q12,0 8,0 L8,15 Z" fill="#FFF9C4" stroke="#FBC02D" stroke-width="1.5"/>
        </g>
        <path d="M40,5 L40,11 M37,8 L43,8" stroke="#FFD54F" stroke-width="2" stroke-linecap="round"/>
      `;
      break;
    case 'sticker_daily_5': // Congrats (Party Horn)
      faceElements = `
        <circle cx="28" cy="38" r="3" fill="#5D4037"/>
        <circle cx="52" cy="38" r="3" fill="#5D4037"/>
        <path d="M35,47 Q40,54 45,47" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      decoration = `
        <path d="M30,10 L50,10 L40,25 Z" fill="#FF1744" stroke="#B71C1C" stroke-width="1.5" transform="rotate(-15 40 17)"/>
        <circle cx="15" cy="20" r="2" fill="#E040FB"/>
        <circle cx="65" cy="22" r="3" fill="#00E676"/>
        <path d="M12,50 Q16,46 20,52" stroke="#2979FF" stroke-width="2" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 'sticker_daily_6': // Sorry (Sweat)
      faceElements = `
        <path d="M24,38 Q30,34 32,38" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M56,38 Q50,34 48,38" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M32,50 Q40,44 48,50" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
      decoration = `
        <path d="M60,25 C58,25 54,32 54,35 C54,38 58,40 60,40 C62,40 66,38 66,35 C66,32 62,25 60,25 Z" fill="#29B6F6" opacity="0.8"/>
      `;
      break;
    case 'sticker_daily_7': // Love (Heart Eyes)
      faceElements = `
        <path d="M22,36 C22,36 19,30 15,30 C11,30 9,33 9,37 C9,42 22,47 22,47 C22,47 35,42 35,37 C35,33 33,30 29,30 C25,30 22,36 22,36 Z" fill="#FF1744"/>
        <path d="M58,36 C58,36 55,30 51,30 C47,30 45,33 45,37 C45,42 58,47 58,47 C58,47 71,42 71,37 C71,33 69,30 65,30 C61,30 58,36 58,36 Z" fill="#FF1744"/>
        <path d="M30,52 Q40,64 50,52" stroke="#B71C1C" stroke-width="4" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 'sticker_daily_8': // Question (Question Mark)
      faceElements = `
        <circle cx="28" cy="42" r="3" fill="#5D4037"/>
        <circle cx="52" cy="42" r="3" fill="#5D4037"/>
        <path d="M36,52 Q40,48 44,52" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
      decoration = `
        <path d="M40,22 C37,22 34,24 34,28 C34,29 35,30 36,30 C37,30 38,29 38,28 C38,26 39,25 40,25 C41,25 42,26 42,27 C42,29 40,30 39,32 C38,34 38,36 38,38 L38,39 C38,40 39,41 40,41 C41,41 42,40 42,39 C42,37 43,36 44,34 C46,32 48,30 48,27 C48,24 45,22 40,22 Z M40,45 C39,45 38,46 38,47 C38,48 39,49 40,49 C41,49 42,48 42,47 C42,46 41,45 40,45 Z" fill="#00E676" transform="scale(1.3) translate(-10, -10)"/>
      `;
      break;
    case 'sticker_daily_9': // Joy (Happy Laugh)
      faceElements = `
        <path d="M20,38 Q28,30 32,38" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M60,38 Q52,30 48,38" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M26,46 Q40,64 54,46 Z" fill="#D84315" stroke="#5D4037" stroke-width="2.5"/>
        <path d="M32,52 Q40,56 48,52" fill="#FF8A80"/>
      `;
      break;
    case 'sticker_daily_10': // Sadness (Cry)
      faceElements = `
        <path d="M24,36 Q30,42 32,36" stroke="#0D47A1" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M56,36 Q50,42 48,36" stroke="#0D47A1" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M32,54 Q40,46 48,54" stroke="#0D47A1" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M24,38 L24,52" stroke="#29B6F6" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M56,38 L56,52" stroke="#29B6F6" stroke-width="2.5" stroke-linecap="round"/>
      `;
      break;
    case 'sticker_daily_11': // Shocked
      faceElements = `
        <ellipse cx="26" cy="36" rx="4" ry="6" fill="#1e1e1e"/>
        <ellipse cx="54" cy="36" rx="4" ry="6" fill="#1e1e1e"/>
        <ellipse cx="40" cy="52" rx="7" ry="9" fill="#1e1e1e"/>
        <circle cx="24" cy="33" r="1.5" fill="#fff"/>
        <circle cx="52" cy="33" r="1.5" fill="#fff"/>
      `;
      break;
    case 'sticker_daily_12': // Angry
      faceElements = `
        <path d="M22,32 L32,36" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <path d="M58,32 L48,36" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <circle cx="28" cy="40" r="4" fill="#fff"/>
        <circle cx="52" cy="40" r="4" fill="#fff"/>
        <circle cx="28" cy="40" r="2" fill="#000"/>
        <circle cx="52" cy="40" r="2" fill="#000"/>
        <path d="M30,54 Q40,44 50,54" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 'sticker_daily_13': // Wink
      faceElements = `
        <path d="M20,38 Q28,30 32,38" stroke="#5D4037" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M46,38 L54,34 M46,34 L54,38" stroke="#5D4037" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M30,48 Q40,58 50,48" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 'sticker_daily_14': // Playful (Tongue out)
      faceElements = `
        <path d="M22,36 Q30,34 32,38" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M58,36 Q50,34 48,38" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M34,48 L46,48 Q46,56 40,56 Q34,56 34,48 Z" fill="#FF1744" stroke="#5D4037" stroke-width="2"/>
      `;
      break;
    case 'sticker_daily_15': // Sleepy
      faceElements = `
        <path d="M22,40 L30,40" stroke="#757575" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M50,40 L58,40" stroke="#757575" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse cx="40" cy="50" rx="3" ry="5" fill="#757575"/>
      `;
      decoration = `
        <g transform="translate(56, 15)">
          <text font-family="sans-serif" font-weight="bold" font-size="14" fill="#29B6F6">Zzz</text>
        </g>
      `;
      break;
    case 'sticker_daily_16': // Tears
      faceElements = `
        <circle cx="28" cy="38" r="3" fill="#0D47A1"/>
        <circle cx="52" cy="38" r="3" fill="#0D47A1"/>
        <path d="M34,52 Q40,46 46,52" stroke="#0D47A1" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      decoration = `
        <path d="M26,38 C20,44 20,54 28,58" stroke="#29B6F6" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.8"/>
        <path d="M54,38 C60,44 60,54 52,58" stroke="#29B6F6" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.8"/>
      `;
      break;
    case 'sticker_daily_17': // Flustered
      faceElements = `
        <ellipse cx="26" cy="38" rx="2.5" ry="4" fill="#5D4037"/>
        <ellipse cx="54" cy="38" rx="2.5" ry="4" fill="#5D4037"/>
        <path d="M32,50 Q40,44 48,50" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      decoration = `
        <path d="M18,24 L18,34 M22,24 L22,34 M26,24 L26,34 M54,24 L54,34 M58,24 L58,34 M62,24 L62,34" stroke="#29B6F6" stroke-width="1.5"/>
        <path d="M62,38 C60,34 56,34 56,38 C56,42 62,42 62,38 Z" fill="#29B6F6"/>
      `;
      break;
    case 'sticker_daily_18': // Pouting (삐짐)
      faceElements = `
        <path d="M22,36 L30,34" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
        <path d="M58,36 L50,34" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
        <circle cx="24" cy="40" r="3.5" fill="#5D4037"/>
        <circle cx="48" cy="40" r="3.5" fill="#5D4037"/>
        <path d="M32,50 Q40,44 44,52" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 'sticker_daily_19': // Shy (볼빨간)
      faceElements = `
        <circle cx="28" cy="38" r="3" fill="#5D4037"/>
        <circle cx="52" cy="38" r="3" fill="#5D4037"/>
        <path d="M35,48 Q40,51 45,48" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <ellipse cx="22" cy="43" rx="6" ry="3.5" fill="#FF3D00" opacity="0.5"/>
        <ellipse cx="58" cy="43" rx="6" ry="3.5" fill="#FF3D00" opacity="0.5"/>
      `;
      break;
    case 'sticker_daily_20': // Awesome (Thumbs up)
      faceElements = `
        <circle cx="28" cy="38" r="3.5" fill="#5D4037"/>
        <circle cx="52" cy="38" r="3.5" fill="#5D4037"/>
        <path d="M30,46 Q40,58 50,46" stroke="#5D4037" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      `;
      decoration = `
        <g transform="translate(62, 45)">
          <path d="M5,12 C2,12 0,9 0,7 C0,5 2,4 5,4 L8,4 L8,2 C8,0 10,0 11,0 L12,0 C13,0 14,2 14,3 L12,6 L15,6 C16.5,6 17,7 17,8 C17,9.5 16.5,10 15,10 L16,11 C16.5,12 16,13 15,13 L14,14 C13,15 12,15 10,15 L5,15 Z" fill="#FFD54F" stroke="#FF6F00" stroke-width="1.5"/>
        </g>
      `;
      break;
    default:
      faceElements = `
        <circle cx="28" cy="38" r="3" fill="#5D4037"/>
        <circle cx="52" cy="38" r="3" fill="#5D4037"/>
        <path d="M30,48 Q40,56 50,48" stroke="#5D4037" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="100%" height="100%">
  <defs>
    <linearGradient id="faceGrad_${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors[0]}" />
      <stop offset="100%" stop-color="${colors[1]}" />
    </linearGradient>
    <filter id="shadow_${index}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.1"/>
    </filter>
  </defs>
  <g filter="url(#shadow_${index})">
    <circle cx="40" cy="40" r="30" fill="url(#faceGrad_${index})" stroke="${colors[2]}" stroke-width="2"/>
    ${faceElements}
    ${decoration}
  </g>
</svg>`;
}

function generateAnimalSVG(index, key, item) {
  // Renders cute animals (cats, dogs, bears, bunnies, pandas, hamsters, birds)
  const isCat = key.includes('sticker_animal_1') || key.includes('sticker_animal_2') || key.includes('sticker_animal_3') || key.includes('sticker_animal_4') || key.includes('sticker_animal_5');
  const isDog = key.includes('sticker_animal_6') || key.includes('sticker_animal_7') || key.includes('sticker_animal_8') || key.includes('sticker_animal_9') || key.includes('sticker_animal_10');
  const isBear = key.includes('sticker_animal_11') || key.includes('sticker_animal_12') || key.includes('sticker_animal_13');
  const isBunny = key.includes('sticker_animal_14') || key.includes('sticker_animal_15');
  const isPanda = key.includes('sticker_animal_16') || key.includes('sticker_animal_17');
  const isHamster = key.includes('sticker_animal_18') || key.includes('sticker_animal_19');
  const isBird = key.includes('sticker_animal_20');

  let paths = '';
  
  if (isCat) {
    paths = `
      <!-- Ears -->
      <polygon points="18,22 10,8 26,16" fill="#FFA726" stroke="#E65100" stroke-width="2"/>
      <polygon points="18,22 13,11 23,17" fill="#FF8A80"/>
      <polygon points="62,22 70,8 54,16" fill="#FFA726" stroke="#E65100" stroke-width="2"/>
      <polygon points="62,22 67,11 57,17" fill="#FF8A80"/>
      <!-- Head -->
      <circle cx="40" cy="40" r="26" fill="#FFB74D" stroke="#E65100" stroke-width="2"/>
      <!-- Eyes -->
      <ellipse cx="28" cy="38" rx="3" ry="5" fill="#3E2723"/>
      <ellipse cx="52" cy="38" rx="3" ry="5" fill="#3E2723"/>
      <circle cx="27" cy="36" r="1" fill="#fff"/>
      <circle cx="51" cy="36" r="1" fill="#fff"/>
      <!-- Whiskers -->
      <line x1="12" y1="42" x2="4" y2="40" stroke="#E65100" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12" y1="46" x2="3" y2="47" stroke="#E65100" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="68" y1="42" x2="76" y2="40" stroke="#E65100" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="68" y1="46" x2="77" y2="47" stroke="#E65100" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Nose & Mouth -->
      <polygon points="40,43 38,41 42,41" fill="#FF8A80"/>
      <path d="M36,46 Q40,49 40,46 Q40,49 44,46" stroke="#3E2723" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
    if (key === 'sticker_animal_4') { // Cat Heart
      paths += `<path d="M40,16 Q40,8 34,8 C30,8 28,11 28,14 C28,20 40,24 40,24 C40,24 52,20 52,14 C52,11 50,8 46,8 Q40,8 40,16 Z" fill="#FF1744"/>`;
    }
  } else if (isDog) {
    paths = `
      <!-- Head -->
      <circle cx="40" cy="40" r="26" fill="#D7CCC8" stroke="#5D4037" stroke-width="2"/>
      <!-- Ears -->
      <path d="M16,22 C10,22 8,36 12,42 C16,48 22,42 22,34 Z" fill="#8D6E63" stroke="#5D4037" stroke-width="2"/>
      <path d="M64,22 C70,22 72,36 68,42 C64,48 58,42 58,34 Z" fill="#8D6E63" stroke="#5D4037" stroke-width="2"/>
      <!-- Muzzle -->
      <ellipse cx="40" cy="46" rx="10" ry="7" fill="#F5F5F5" stroke="#5D4037" stroke-width="1.5"/>
      <!-- Nose -->
      <ellipse cx="40" cy="43" rx="4" ry="2.5" fill="#3E2723"/>
      <!-- Eyes -->
      <circle cx="28" cy="36" r="3.5" fill="#3E2723"/>
      <circle cx="52" cy="36" r="3.5" fill="#3E2723"/>
      <circle cx="27" cy="34" r="1.2" fill="#fff"/>
      <circle cx="51" cy="34" r="1.2" fill="#fff"/>
      <!-- Mouth -->
      <path d="M37,48 Q40,50 43,48" stroke="#3E2723" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
    if (key === 'sticker_animal_8') { // Dog Best
      paths += `
        <g transform="translate(56, 46)">
          <path d="M5,10 C3,10 0,8 0,6 C0,4 2,3 5,3 L7,3 L7,1.5 C7,0 9,0 10,0 L11,0 C12,0 13,1.5 13,2.5 L11,5 L14,5 C15.5,5 16,6 16,7 C16,8.5 15.5,9 14,9 L15,10 L13,12 L10,12 Z" fill="#FFD54F" stroke="#FF6F00" stroke-width="1.5"/>
        </g>
      `;
    }
  } else if (isBear) {
    paths = `
      <!-- Ears -->
      <circle cx="20" cy="20" r="10" fill="#A1887F" stroke="#5D4037" stroke-width="2"/>
      <circle cx="20" cy="20" r="6" fill="#D7CCC8"/>
      <circle cx="60" cy="20" r="10" fill="#A1887F" stroke="#5D4037" stroke-width="2"/>
      <circle cx="60" cy="20" r="6" fill="#D7CCC8"/>
      <!-- Head -->
      <circle cx="40" cy="42" r="26" fill="#A1887F" stroke="#5D4037" stroke-width="2"/>
      <!-- Muzzle -->
      <ellipse cx="40" cy="48" rx="8" ry="6" fill="#F5F5F5"/>
      <!-- Nose -->
      <polygon points="40,46 37,44 43,44" fill="#3E2723"/>
      <!-- Eyes -->
      <circle cx="28" cy="38" r="3" fill="#3E2723"/>
      <circle cx="52" cy="38" r="3" fill="#3E2723"/>
      <circle cx="27" cy="36" r="1" fill="#fff"/>
      <circle cx="51" cy="36" r="1" fill="#fff"/>
      <!-- Mouth -->
      <path d="M37,49 Q40,51 43,49" stroke="#3E2723" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
  } else if (isBunny) {
    paths = `
      <!-- Ears -->
      <path d="M22,24 C14,12 18,2 24,6 C30,10 26,20 26,24 Z" fill="#EEEEEE" stroke="#9E9E9E" stroke-width="2"/>
      <path d="M21,20 C16,12 18,5 22,8 C26,11 23,17 23,20 Z" fill="#FFCDD2"/>
      <path d="M58,24 C66,12 62,2 56,6 C50,10 54,20 54,24 Z" fill="#EEEEEE" stroke="#9E9E9E" stroke-width="2"/>
      <path d="M59,20 C64,12 62,5 58,8 C54,11 57,17 57,20 Z" fill="#FFCDD2"/>
      <!-- Head -->
      <circle cx="40" cy="42" r="25" fill="#FAFAFA" stroke="#9E9E9E" stroke-width="2"/>
      <!-- Nose & Mouth -->
      <polygon points="40,44 38,42 42,42" fill="#FF8A80"/>
      <path d="M37,47 Q40,49 40,47 Q40,49 43,47" stroke="#616161" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <!-- Eyes -->
      <ellipse cx="28" cy="38" rx="2.5" ry="4" fill="#424242"/>
      <ellipse cx="52" cy="38" rx="2.5" ry="4" fill="#424242"/>
    `;
  } else if (isPanda) {
    paths = `
      <!-- Ears -->
      <circle cx="20" cy="22" r="9" fill="#212121"/>
      <circle cx="60" cy="22" r="9" fill="#212121"/>
      <!-- Head -->
      <circle cx="40" cy="42" r="25" fill="#FAFAFA" stroke="#212121" stroke-width="2"/>
      <!-- Eye patches -->
      <ellipse cx="28" cy="38" rx="6" ry="8" fill="#212121" transform="rotate(-15 28 38)"/>
      <ellipse cx="52" cy="38" rx="6" ry="8" fill="#212121" transform="rotate(15 52 38)"/>
      <!-- Eyes -->
      <circle cx="29" cy="37" r="2.5" fill="#fff"/>
      <circle cx="51" cy="37" r="2.5" fill="#fff"/>
      <circle cx="29" cy="37" r="1" fill="#000"/>
      <circle cx="51" cy="37" r="1" fill="#000"/>
      <!-- Nose & Mouth -->
      <ellipse cx="40" cy="45" rx="3" ry="2" fill="#212121"/>
      <path d="M37,48 Q40,50 43,48" stroke="#212121" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    `;
  } else if (isHamster) {
    paths = `
      <!-- Ears -->
      <ellipse cx="22" cy="22" rx="7" ry="9" fill="#FFCC80" stroke="#E65100" stroke-width="1.5"/>
      <ellipse cx="22" cy="22" rx="4" ry="6" fill="#FFAB91"/>
      <ellipse cx="58" cy="22" rx="7" ry="9" fill="#FFCC80" stroke="#E65100" stroke-width="1.5"/>
      <ellipse cx="58" cy="22" rx="4" ry="6" fill="#FFAB91"/>
      <!-- Head -->
      <circle cx="40" cy="42" r="24" fill="#FFE082" stroke="#E65100" stroke-width="2"/>
      <!-- Cheek pouches -->
      <circle cx="22" cy="48" r="7" fill="#FFAB91" opacity="0.6"/>
      <circle cx="58" cy="48" r="7" fill="#FFAB91" opacity="0.6"/>
      <!-- Eyes -->
      <circle cx="29" cy="38" r="3" fill="#3E2723"/>
      <circle cx="51" cy="38" r="3" fill="#3E2723"/>
      <circle cx="28.5" cy="36.5" r="1" fill="#fff"/>
      <circle cx="50.5" cy="36.5" r="1" fill="#fff"/>
      <!-- Nose & Mouth -->
      <polygon points="40,43 38,41 42,41" fill="#FF8A80"/>
      <path d="M37,46 Q40,48 40,46 Q40,48 43,46" stroke="#3E2723" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    `;
  } else if (isBird) {
    paths = `
      <!-- Head -->
      <circle cx="40" cy="42" r="24" fill="#FFF59D" stroke="#FBC02D" stroke-width="2"/>
      <!-- Cheeks -->
      <circle cx="22" cy="45" r="5" fill="#FF8A80" opacity="0.7"/>
      <circle cx="58" cy="45" r="5" fill="#FF8A80" opacity="0.7"/>
      <!-- Eyes -->
      <circle cx="28" cy="36" r="3" fill="#37474F"/>
      <circle cx="52" cy="36" r="3" fill="#37474F"/>
      <circle cx="27" cy="34" r="1" fill="#fff"/>
      <circle cx="51" cy="34" r="1" fill="#fff"/>
      <!-- Beak (부리) -->
      <polygon points="40,38 34,44 46,44" fill="#FF9100" stroke="#DD2C00" stroke-width="1.5"/>
      <!-- Feathers on head -->
      <path d="M40,18 Q40,10 44,12 Q40,10 36,12 Z" fill="#FFF59D" stroke="#FBC02D" stroke-width="1.5"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="100%" height="100%">
  <defs>
    <filter id="glow_${index}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <g filter="url(#glow_${index})">
    ${paths}
  </g>
</svg>`;
}

function generateReactionSVG(index, key, item) {
  // Vibrant trendy neon signs on completely transparent background
  const texts = {
    sticker_reaction_1: 'OK',
    sticker_reaction_2: 'YES',
    sticker_reaction_3: 'NO',
    sticker_reaction_4: '대박',
    sticker_reaction_5: '축하',
    sticker_reaction_6: '화이팅',
    sticker_reaction_7: '인정',
    sticker_reaction_8: '깜놀',
    sticker_reaction_9: '헐',
    sticker_reaction_10: '쉿',
    sticker_reaction_11: 'GM',
    sticker_reaction_12: 'GN',
    sticker_reaction_13: 'Q&A',
    sticker_reaction_14: '주문',
    sticker_reaction_15: '예약',
    sticker_reaction_16: '약속',
    sticker_reaction_17: '환영',
    sticker_reaction_18: '감사',
    sticker_reaction_19: '최고',
    sticker_reaction_20: '수고'
  };

  const textColors = {
    sticker_reaction_1: ['#FF1744', '#FF8A80'], // OK (Pink/Red)
    sticker_reaction_2: ['#00E676', '#B9F6CA'], // YES (Lime/Green)
    sticker_reaction_3: ['#D500F9', '#F5D0FF'], // NO (Purple)
    sticker_reaction_4: ['#FFD600', '#FFE57F'], // 대박 (Gold)
    sticker_reaction_5: ['#FF6D00', '#FFD180'], // 축하 (Orange)
    sticker_reaction_6: ['#2979FF', '#82B1FF'], // 화이팅 (Blue)
    sticker_reaction_7: ['#00E5FF', '#84FFFF'], // 인정 (Cyan)
    sticker_reaction_8: ['#FF1744', '#FF8A80'], // 깜놀
    sticker_reaction_9: ['#E040FB', '#F48FB1'], // 헐
    sticker_reaction_10: ['#7C4DFF', '#B388FF'], // 쉿
    sticker_reaction_11: ['#00E676', '#FFF'], // 굿모닝
    sticker_reaction_12: ['#2979FF', '#B3E5FC'], // 굿나잇
    sticker_reaction_13: ['#FF9100', '#FFF'], // Q&A
    sticker_reaction_14: ['#FF3D00', '#FFAB91'], // 주문
    sticker_reaction_15: ['#00C853', '#B9F6CA'], // 예약
    sticker_reaction_16: ['#6200EA', '#E040FB'], // 약속
    sticker_reaction_17: ['#00B0FF', '#E1F5FE'], // 환영
    sticker_reaction_18: ['#FF1744', '#FFF'], // 감사
    sticker_reaction_19: ['#FFD600', '#FFF59D'], // 최고
    sticker_reaction_20: ['#00E676', '#FFF'] // 수고
  };

  const text = texts[key] || 'WOC';
  const colors = textColors[key] || ['#00E5FF', '#84FFFF'];

  // Drawing dynamic vector frame for each neon sign
  let neonFrame = '';
  if (index % 4 === 1) {
    // Elegant Rounded Hexagon
    neonFrame = `<polygon points="40,8 68,22 68,58 40,72 12,58 12,22" fill="none" stroke="${colors[0]}" stroke-width="3" stroke-linejoin="round" opacity="0.9" />
    <polygon points="40,8 68,22 68,58 40,72 12,58 12,22" fill="none" stroke="${colors[1]}" stroke-width="1.2" stroke-linejoin="round" />`;
  } else if (index % 4 === 2) {
    // Dynamic Neon Capsule
    neonFrame = `<rect x="10" y="20" width="60" height="40" rx="20" ry="20" fill="none" stroke="${colors[0]}" stroke-width="3" opacity="0.9"/>
    <rect x="10" y="20" width="60" height="40" rx="20" ry="20" fill="none" stroke="${colors[1]}" stroke-width="1.2"/>`;
  } else if (index % 4 === 3) {
    // Double Star Frame / Star Accents
    neonFrame = `<circle cx="40" cy="40" r="30" fill="none" stroke="${colors[0]}" stroke-dasharray="8 4" stroke-width="3" opacity="0.8" />
    <circle cx="40" cy="40" r="30" fill="none" stroke="${colors[1]}" stroke-width="1.2" />`;
  } else {
    // Double Border Neon Screen
    neonFrame = `<rect x="8" y="16" width="64" height="48" rx="8" fill="none" stroke="${colors[0]}" stroke-width="3" opacity="0.9" />
    <rect x="12" y="20" width="56" height="40" rx="6" fill="none" stroke="${colors[1]}" stroke-width="1" />`;
  }

  // Neon text sizing & baseline adjustment
  const fontSize = text.length === 1 ? 38 : text.length === 2 ? 26 : text.length === 3 ? 20 : 16;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="100%" height="100%">
  <defs>
    <!-- Multi-stage blurring filters to build organic, thick neon bloom -->
    <filter id="neonBloom_${index}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#neonBloom_${index})">
    ${neonFrame}
    <text x="40" y="44" 
          text-anchor="middle" 
          dominant-baseline="middle" 
          font-family="'Outfit', 'Inter', sans-serif" 
          font-weight="900" 
          font-size="${fontSize}" 
          fill="#FFFFFF" 
          stroke="${colors[0]}" 
          stroke-width="1.8" 
          style="letter-spacing: 0.5px;">${text}</text>
  </g>
</svg>`;
}

// 3. Main Executable Loop
function run() {
  console.log('----------------------------------------------------');
  console.log('WoC Platform High-Aesthetic Emoticon Patch Tool');
  console.log('----------------------------------------------------');

  ensureDirectory(STICKERS_DIR);

  // 3-1. Generate Daily SVG Files
  DAILY_EMOTICONS.forEach((sticker, i) => {
    const fileId = sticker.name;
    const content = generateDailySVG(i + 1, fileId, sticker);
    fs.writeFileSync(path.join(STICKERS_DIR, `${fileId}.svg`), content, 'utf8');
  });
  console.log(`[Stickers Generated] 20 Daily Stickers`);

  // 3-2. Generate Animal SVG Files
  ANIMAL_EMOTICONS.forEach((sticker, i) => {
    const fileId = sticker.name;
    const content = generateAnimalSVG(i + 1, fileId, sticker);
    fs.writeFileSync(path.join(STICKERS_DIR, `${fileId}.svg`), content, 'utf8');
  });
  console.log(`[Stickers Generated] 20 Animal Stickers`);

  // 3-3. Generate Reaction SVG Files
  REACTION_EMOTICONS.forEach((sticker, i) => {
    const fileId = sticker.name;
    const content = generateReactionSVG(i + 1, fileId, sticker);
    fs.writeFileSync(path.join(STICKERS_DIR, `${fileId}.svg`), content, 'utf8');
  });
  console.log(`[Stickers Generated] 20 Neon/Reaction Stickers`);

  // 4. Patch ChatInputBar.tsx File
  const chatInputBarPath = path.join(ROOT_DIR, 'src', 'components', 'chat', 'ChatInputBar.tsx');
  if (fs.existsSync(chatInputBarPath)) {
    let code = fs.readFileSync(chatInputBarPath, 'utf8');

    // 4-1. Patch EMOTICONS_DAILY Array
    const dailyBlock = `const EMOTICONS_DAILY = [
  { id: 'sticker_daily_1', fileId: 'sticker_daily_1', labelKey: 'sticker.daily_1', label: '인사' },
  { id: 'sticker_daily_2', fileId: 'sticker_daily_2', labelKey: 'sticker.daily_2', label: '감사' },
  { id: 'sticker_daily_3', fileId: 'sticker_daily_3', labelKey: 'sticker.daily_3', label: '응원' },
  { id: 'sticker_daily_4', fileId: 'sticker_daily_4', labelKey: 'sticker.daily_4', label: '기도' },
  { id: 'sticker_daily_5', fileId: 'sticker_daily_5', labelKey: 'sticker.daily_5', label: '축하' },
  { id: 'sticker_daily_6', fileId: 'sticker_daily_6', labelKey: 'sticker.daily_6', label: '죄송' },
  { id: 'sticker_daily_7', fileId: 'sticker_daily_7', labelKey: 'sticker.daily_7', label: '사랑' },
  { id: 'sticker_daily_8', fileId: 'sticker_daily_8', labelKey: 'sticker.daily_8', label: '질문' },
  { id: 'sticker_daily_9', fileId: 'sticker_daily_9', labelKey: 'sticker.daily_9', label: '기쁨' },
  { id: 'sticker_daily_10', fileId: 'sticker_daily_10', labelKey: 'sticker.daily_10', label: '슬픔' },
  { id: 'sticker_daily_11', fileId: 'sticker_daily_11', labelKey: 'sticker.daily_11', label: '놀람' },
  { id: 'sticker_daily_12', fileId: 'sticker_daily_12', labelKey: 'sticker.daily_12', label: '화남' },
  { id: 'sticker_daily_13', fileId: 'sticker_daily_13', labelKey: 'sticker.daily_13', label: '윙크' },
  { id: 'sticker_daily_14', fileId: 'sticker_daily_14', labelKey: 'sticker.daily_14', label: '메롱' },
  { id: 'sticker_daily_15', fileId: 'sticker_daily_15', labelKey: 'sticker.daily_15', label: '졸림' },
  { id: 'sticker_daily_16', fileId: 'sticker_daily_16', labelKey: 'sticker.daily_16', label: '눈물' },
  { id: 'sticker_daily_17', fileId: 'sticker_daily_17', labelKey: 'sticker.daily_17', label: '당황' },
  { id: 'sticker_daily_18', fileId: 'sticker_daily_18', labelKey: 'sticker.daily_18', label: '삐짐' },
  { id: 'sticker_daily_19', fileId: 'sticker_daily_19', labelKey: 'sticker.daily_19', label: '부끄' },
  { id: 'sticker_daily_20', fileId: 'sticker_daily_20', labelKey: 'sticker.daily_20', label: '최고' }
];`;

    const animalBlock = `const EMOTICONS_ANIMAL = [
  { id: 'sticker_animal_1', fileId: 'sticker_animal_1', labelKey: 'sticker.animal_1', label: '냥이 안녕' },
  { id: 'sticker_animal_2', fileId: 'sticker_animal_2', labelKey: 'sticker.animal_2', label: '냥이 감사' },
  { id: 'sticker_animal_3', fileId: 'sticker_animal_3', labelKey: 'sticker.animal_3', label: '냥이 응원' },
  { id: 'sticker_animal_4', fileId: 'sticker_animal_4', labelKey: 'sticker.animal_4', label: '냥이 하트' },
  { id: 'sticker_animal_5', fileId: 'sticker_animal_5', labelKey: 'sticker.animal_5', label: '냥이 슬픔' },
  { id: 'sticker_animal_6', fileId: 'sticker_animal_6', labelKey: 'sticker.animal_6', label: '댕댕 안녕' },
  { id: 'sticker_animal_7', fileId: 'sticker_animal_7', labelKey: 'sticker.animal_7', label: '댕댕 감사' },
  { id: 'sticker_animal_8', fileId: 'sticker_animal_8', labelKey: 'sticker.animal_8', label: '댕댕 최고' },
  { id: 'sticker_animal_9', fileId: 'sticker_animal_9', labelKey: 'sticker.animal_9', label: '댕댕 하트' },
  { id: 'sticker_animal_10', fileId: 'sticker_animal_10', labelKey: 'sticker.animal_10', label: '댕댕 슬픔' },
  { id: 'sticker_animal_11', fileId: 'sticker_animal_11', labelKey: 'sticker.animal_11', label: '곰돌 인사' },
  { id: 'sticker_animal_12', fileId: 'sticker_animal_12', labelKey: 'sticker.animal_12', label: '곰돌 응원' },
  { id: 'sticker_animal_13', fileId: 'sticker_animal_13', labelKey: 'sticker.animal_13', label: '곰돌 축하' },
  { id: 'sticker_animal_14', fileId: 'sticker_animal_14', labelKey: 'sticker.animal_14', label: '토끼 하트' },
  { id: 'sticker_animal_15', fileId: 'sticker_animal_15', labelKey: 'sticker.animal_15', label: '토끼 메롱' },
  { id: 'sticker_animal_16', fileId: 'sticker_animal_16', labelKey: 'sticker.animal_16', label: '판다 굿' },
  { id: 'sticker_animal_17', fileId: 'sticker_animal_17', labelKey: 'sticker.animal_17', label: '판다 쿨쿨' },
  { id: 'sticker_animal_18', fileId: 'sticker_animal_18', labelKey: 'sticker.animal_18', label: '햄찌 냠냠' },
  { id: 'sticker_animal_19', fileId: 'sticker_animal_19', labelKey: 'sticker.animal_19', label: '햄찌 미안' },
  { id: 'sticker_animal_20', fileId: 'sticker_animal_20', labelKey: 'sticker.animal_20', label: '아기새 럽' }
];`;

    const neonBlock = `const EMOTICONS_NEON = [
  { id: 'sticker_reaction_1', fileId: 'sticker_reaction_1', labelKey: 'sticker.reaction_1', label: 'OK' },
  { id: 'sticker_reaction_2', fileId: 'sticker_reaction_2', labelKey: 'sticker.reaction_2', label: 'YES' },
  { id: 'sticker_reaction_3', fileId: 'sticker_reaction_3', labelKey: 'sticker.reaction_3', label: 'NO' },
  { id: 'sticker_reaction_4', fileId: 'sticker_reaction_4', labelKey: 'sticker.reaction_4', label: '대박' },
  { id: 'sticker_reaction_5', fileId: 'sticker_reaction_5', labelKey: 'sticker.reaction_5', label: '축하축하' },
  { id: 'sticker_reaction_6', fileId: 'sticker_reaction_6', labelKey: 'sticker.reaction_6', label: '화이팅' },
  { id: 'sticker_reaction_7', fileId: 'sticker_reaction_7', labelKey: 'sticker.reaction_7', label: '인정' },
  { id: 'sticker_reaction_8', fileId: 'sticker_reaction_8', labelKey: 'sticker.reaction_8', label: '깜놀' },
  { id: 'sticker_reaction_9', fileId: 'sticker_reaction_9', labelKey: 'sticker.reaction_9', label: '헐' },
  { id: 'sticker_reaction_10', fileId: 'sticker_reaction_10', labelKey: 'sticker.reaction_10', label: '쉿' },
  { id: 'sticker_reaction_11', fileId: 'sticker_reaction_11', labelKey: 'sticker.reaction_11', label: '굿모닝' },
  { id: 'sticker_reaction_12', fileId: 'sticker_reaction_12', labelKey: 'sticker.reaction_12', label: '굿나잇' },
  { id: 'sticker_reaction_13', fileId: 'sticker_reaction_13', labelKey: 'sticker.reaction_13', label: '문의하기' },
  { id: 'sticker_reaction_14', fileId: 'sticker_reaction_14', labelKey: 'sticker.reaction_14', label: '주문완료' },
  { id: 'sticker_reaction_15', fileId: 'sticker_reaction_15', labelKey: 'sticker.reaction_15', label: '예약완료' },
  { id: 'sticker_reaction_16', fileId: 'sticker_reaction_16', labelKey: 'sticker.reaction_16', label: '약속완료' },
  { id: 'sticker_reaction_17', fileId: 'sticker_reaction_17', labelKey: 'sticker.reaction_17', label: '환영해요' },
  { id: 'sticker_reaction_18', fileId: 'sticker_reaction_18', labelKey: 'sticker.reaction_18', label: '감사해요' },
  { id: 'sticker_reaction_19', fileId: 'sticker_reaction_19', labelKey: 'sticker.reaction_19', label: '최고에요' },
  { id: 'sticker_reaction_20', fileId: 'sticker_reaction_20', labelKey: 'sticker.reaction_20', label: '수고했어' }
];`;

    // Replace daily block
    code = code.replace(/const EMOTICONS_DAILY = \[[\s\S]*?\];/, dailyBlock);
    // Replace animal block
    code = code.replace(/const EMOTICONS_ANIMAL = \[[\s\S]*?\];/, animalBlock);
    // Replace neon block
    code = code.replace(/const EMOTICONS_NEON = \[[\s\S]*?\];/, neonBlock);

    // 4-2. Replace stickerUrl creation with Local SVG path
    code = code.replace(
      /const stickerUrl = `https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/woc-platform\.appspot\.com\/o\/stickers%2F\$\{stickerFileId\}\.png\?alt=media`;/,
      'const stickerUrl = `/stickers/${stickerFileId}.svg`;'
    );

    // 4-3. Replace stickerUrl inside grid mapping with Local path
    code = code.replace(
      /const stickerUrl = `https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/woc-platform\.appspot\.com\/o\/stickers%2F\$\{sticker\.fileId\}\.png\?alt=media`;/,
      'const stickerUrl = `/stickers/${sticker.fileId}.svg`;'
    );

    // 4-4. Replace title={sticker.label} and label rendering with key localization
    code = code.replace(
      /title=\{sticker\.label\}/g,
      'title={t(sticker.labelKey, sticker.label)}'
    );
    code = code.replace(
      /<span className="text-\[9\.5px\] font-bold text-gray-400 group-hover:text-gray-600 transition-colors truncate w-full text-center">\{sticker\.label\}<\/span>/g,
      '<span className="text-[9.5px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors truncate w-full text-center">{t(sticker.labelKey, sticker.label)}</span>'
    );

    fs.writeFileSync(chatInputBarPath, code, 'utf8');
    console.log('[File Updated] src/components/chat/ChatInputBar.tsx patched successfully');
  } else {
    console.error(`[Error] ChatInputBar.tsx not found at: ${chatInputBarPath}`);
  }

  // 5. Patch i18n Dictionary Files (kr.ts / en.ts)
  const krPath = path.join(ROOT_DIR, 'src', 'i18n', 'kr.ts');
  const enPath = path.join(ROOT_DIR, 'src', 'i18n', 'en.ts');

  // 5-1. Patch Korean dictionary
  if (fs.existsSync(krPath)) {
    let krContent = fs.readFileSync(krPath, 'utf8');
    
    // Generate localization key-value string
    let krStickerStrings = '\n    // Emoticon Stickers (Korean)\n';
    DAILY_EMOTICONS.forEach(st => {
      krStickerStrings += `    'sticker.daily_${st.id.split('_').pop()}': '${st.ko}',\n`;
    });
    ANIMAL_EMOTICONS.forEach(st => {
      krStickerStrings += `    'sticker.animal_${st.id.split('_').pop()}': '${st.ko}',\n`;
    });
    REACTION_EMOTICONS.forEach(st => {
      krStickerStrings += `    'sticker.reaction_${st.id.split('_').pop()}': '${st.ko}',\n`;
    });

    // Check if keys already exist to prevent duplicate patch
    if (!krContent.includes('sticker.daily_1')) {
      krContent = krContent.replace(/};\s*$/, krStickerStrings + '};');
      fs.writeFileSync(krPath, krContent, 'utf8');
      console.log('[i18n Patched] src/i18n/kr.ts added emoticon translations');
    } else {
      console.log('[i18n Skipped] src/i18n/kr.ts already has emoticon translations');
    }
  }

  // 5-2. Patch English dictionary
  if (fs.existsSync(enPath)) {
    let enContent = fs.readFileSync(enPath, 'utf8');

    let enStickerStrings = '\n    // Emoticon Stickers (English)\n';
    DAILY_EMOTICONS.forEach(st => {
      enStickerStrings += `    'sticker.daily_${st.id.split('_').pop()}': '${st.en.replace(/'/g, "\\'")}',\n`;
    });
    ANIMAL_EMOTICONS.forEach(st => {
      enStickerStrings += `    'sticker.animal_${st.id.split('_').pop()}': '${st.en.replace(/'/g, "\\'")}',\n`;
    });
    REACTION_EMOTICONS.forEach(st => {
      enStickerStrings += `    'sticker.reaction_${st.id.split('_').pop()}': '${st.en.replace(/'/g, "\\'")}',\n`;
    });

    if (!enContent.includes('sticker.daily_1')) {
      enContent = enContent.replace(/};\s*$/, enStickerStrings + '};');
      fs.writeFileSync(enPath, enContent, 'utf8');
      console.log('[i18n Patched] src/i18n/en.ts added emoticon translations');
    } else {
      console.log('[i18n Skipped] src/i18n/en.ts already has emoticon translations');
    }
  }

  console.log('----------------------------------------------------');
  console.log('Patch Process Completed Successfully!');
  console.log('----------------------------------------------------');
}

run();
