const fs = require('fs');

let content = fs.readFileSync('scripts/seed-venues.js', 'utf8');

// 1. 운포코데탱고
content = content.replace(
  /"nameKo": "운포코데탱고"([\s\S]*?)"address": "서울특별시 마포구 월드컵북로2길 12"([\s\S]*?)"latitude": 37.5575748,[\s]*"longitude": 126.9234799/,
  `"nameKo": "운포코데탱고"$1"address": "서울특별시 마포구 월드컵북로2길 81-3"$2"latitude": 37.5583008,\n        "longitude": 126.9243269`
);

// 2. 탱고브루호
content = content.replace(
  /"nameKo": "탱고브루호"([\s\S]*?)"latitude": 37.5538501,[\s]*"longitude": 126.9171659/,
  `"nameKo": "탱고브루호"$1"latitude": 37.5537899,\n        "longitude": 126.9171166`
);

// 3. 플레이스오션
content = content.replace(
  /"nameKo": "플레이스오션"([\s\S]*?)"address": "서울특별시 마포구 월드컵북로6길 40"([\s\S]*?)"latitude": 37.5590938,[\s]*"longitude": 126.9211789/,
  `"nameKo": "플레이스오션"$1"address": "서울특별시 마포구 월드컵북로6길 42"$2"latitude": 37.5587339,\n        "longitude": 126.920801`
);

// 4. 홍대 보니따
content = content.replace(
  /"nameKo": "보니따"([\s\S]*?)"address": "서울특별시 마포구 와우산로21길 31",[\s]*"detailAddress": "지하 1층"([\s\S]*?)"latitude": 37.5522583,[\s]*"longitude": 126.9221208/,
  `"nameKo": "보니따"$1"address": "서울특별시 마포구 동교로 191",\n    "detailAddress": "디비엠빌딩 지하 1층"$2"latitude": 37.5576017,\n        "longitude": 126.9224131`
);

// 5. 오나다2
content = content.replace(
  /"nameKo": "오나다2"([\s\S]*?)"address": "서울특별시 마포구 서교동 351-18"([\s\S]*?)"latitude": 37.5555189,[\s]*"longitude": 126.920799/,
  `"nameKo": "오나다2"$1"address": "서울특별시 마포구 성미산로 187"$2"latitude": 37.5647184,\n        "longitude": 126.9254418`
);

fs.writeFileSync('scripts/seed-venues.js', content, 'utf8');
console.log('Successfully updated scripts/seed-venues.js');
