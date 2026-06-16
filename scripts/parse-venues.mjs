import fs from 'fs';

const filePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\28ad0f1c-02f4-49c8-bb55-664dd5d7b33d\\.system_generated\\steps\\11190\\output.txt';
const content = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(content);

// 4대 권역 매핑 로직 (regionMapping.ts와 유사 구조)
function getCityGroup(city) {
  if (!city) return 'ALL';
  const c = city.trim().toUpperCase();
  
  if (['SEOUL', 'INCHEON', 'GYEONGGI', 'GANGWON', '인천', '경기', '강원', '서울'].some(x => c.includes(x.toUpperCase()))) {
    return '서울';
  }
  if (['BUSAN', 'DAEGU', 'ULSAN', 'GYEONGSANG', 'YEONGNAM', 'GYEONGBUK', 'GYEONGNAM', '부산', '대구', '울산', '경상', '영남', '경북', '경남', '창원'].some(x => c.includes(x.toUpperCase()))) {
    return '부산';
  }
  if (['GWANGJU', 'JEONBUK', 'JEONNAM', 'HONAM', 'JEJU', '광주', '전북', '전남', '호남', '제주'].some(x => c.includes(x.toUpperCase()))) {
    return '광주';
  }
  if (['DAEJEON', 'SEJONG', 'CHUNGBUK', 'CHUNGNAM', 'CHUNGCHEONG', '대전', '세종', '충북', '충남', '충청'].some(x => c.includes(x.toUpperCase()))) {
    return '대전';
  }
  
  return 'ALL';
}

const list = [];

data.documents.forEach(doc => {
  const fields = doc.fields;
  const nameNative = fields.nameNative?.stringValue || fields.nameKo?.stringValue || fields.titleNative?.stringValue || '';
  const nameEn = fields.name?.stringValue || '';
  const city = fields.city?.stringValue || '';
  const address = fields.address?.stringValue || '';
  const ownerId = fields.ownerId?.stringValue || '';
  const ownerName = fields.ownerName?.stringValue || '';
  
  const venueName = nameNative ? `${nameNative} (${nameEn})` : nameEn;
  const regionGroup = getCityGroup(city || address);
  
  list.push({
    name: venueName,
    region: regionGroup,
    city: city || '미지정',
    owner: ownerName ? `${ownerName} (${ownerId})` : (ownerId || '없음')
  });
});

console.log("| 장소명 | 도시(광역권) | 세부도시 | 오너 |");
console.log("| --- | --- | --- | --- |");
list.forEach(item => {
  console.log(`| ${item.name} | ${item.region} | ${item.city} | ${item.owner} |`);
});
