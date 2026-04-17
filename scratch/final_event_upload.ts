import * as admin from 'firebase-admin';

// Initialize Admin SDK
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(fs.readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const eventsToUpload = [
  {
    title: "Bali Tango Holidys",
    hostName: "Pablo & Emilie Tegli",
    hostId: "system1",
    startDate: new Date("2026-04-25"),
    endDate: new Date("2026-05-02"),
    location: "Bali, Indonesia",
    description: "아름다운 발리에서 펼쳐지는 탱고 홀리데이 및 워크숍 시리즈입니다.",
    type: "festival"
  },
  {
    title: "Indonesia Championship & Paradise",
    hostName: "Ratih Soe Kosasie",
    hostId: "system1",
    startDate: new Date("2026-05-19"),
    endDate: new Date("2026-05-21"),
    location: "Bali, Indonesia",
    description: "인도네시아 탱고 챔피언십과 파라다이스 밀롱가가 결합된 특별한 이벤트입니다.",
    type: "festival"
  },
  {
    title: "Oriental Tango Congress(OTC)",
    hostName: "Simona Wu & Allen Ma",
    hostId: "system1",
    startDate: new Date("2026-04-17"),
    endDate: new Date("2026-04-19"),
    location: "Beijing, China",
    description: "베이징에서 개최되는 오리엔탈 탱고 콩그레스(OTC)로 아시아 전역의 탱고인들이 모입니다.",
    type: "festival"
  },
  {
    title: "Select Tango Weekend",
    hostName: "Shiao Chang",
    hostId: "system1",
    startDate: new Date("2026-05-18"),
    endDate: new Date("2026-05-22"),
    location: "Beijing, China",
    description: "엄선된 마에스트로들과 함께하는 베이징 셀렉트 탱고 위켄드입니다.",
    type: "festival"
  },
  {
    title: "Jonathan & Clarisa",
    hostName: "Moses Park & Nina Park",
    hostId: "system1",
    startDate: new Date("2026-11-18"),
    endDate: new Date("2026-11-25"),
    location: "Busan & Seoul, KR",
    description: "세계적인 마에스트로 Jonathan & Clarisa의 한국 투어 워크숍 및 밀롱가입니다.",
    type: "gathering"
  },
  {
    title: "Murat Erdemsel & Silvina Tse",
    hostName: "Moses Park & Nina Park",
    hostId: "system1",
    startDate: new Date("2026-08-05"),
    endDate: new Date("2026-08-10"),
    location: "Busan & Seoul, KR",
    description: "독창적인 에너지의 Murat과 Silvina의 클래스를 한국에서 만나보세요.",
    type: "gathering"
  },
  {
    title: "Octavio Fernandez & Carolina Giannini",
    hostName: "Moses Park & Nina Park",
    hostId: "system1",
    startDate: new Date("2026-09-09"),
    endDate: new Date("2026-09-14"),
    location: "Busan & Seoul, KR",
    description: "정통 밀롱가 스타일의 진수, Octavio와 Carolina가 선사하는 특별한 시간입니다.",
    type: "gathering"
  },
  {
    title: "Andres Laza Moreno & Eladia Cordoba",
    hostName: "Selene Son & Federico Kim",
    hostId: "system1",
    startDate: new Date("2026-05-28"),
    endDate: new Date("2026-06-01"),
    location: "Busan, Korea",
    description: "안드레스와 엘라디아가 함께하는 부산 탱고 워크숍 시리즈입니다.",
    type: "gathering"
  },
  {
    title: "Busan Tango Marathon",
    hostName: "Moses Park",
    hostId: "system1",
    startDate: new Date("2026-05-24"),
    endDate: new Date("2026-05-29"),
    location: "Busan, Korea",
    description: "부산의 열정과 함께하는 탱고 마라톤 대회입니다.",
    type: "festival"
  },
  {
    title: "Busan Tango Weekend \"El Mar\"",
    hostName: "Chanbee Bokchan Park",
    hostId: "system1",
    startDate: new Date("2026-08-27"),
    endDate: new Date("2026-08-31"),
    location: "Busan, Korea",
    description: "바다와 함께하는 부산 탱고 위켄드 '엘 마르' 이벤트입니다.",
    type: "festival"
  },
  {
    title: "RoyBeDDong",
    hostName: "Rob Roy, Beto, Kim, Kwang Seob Kim",
    hostId: "system1",
    startDate: new Date("2026-12-18"),
    endDate: new Date("2026-12-20"),
    location: "Busan, Korea",
    description: "12월 부산을 뜨겁게 달굴 로이베똥 밀롱가 파티입니다.",
    type: "gathering"
  },
  {
    title: "Cherry Blossoms Milonga",
    hostName: "Han pacino",
    hostId: "system1",
    startDate: new Date("2026-03-26"),
    endDate: new Date("2026-03-30"),
    location: "Changwon, Korea",
    description: "벚꽃 시즌에 맞춰 창원에서 열리는 Cherry Blossoms 밀롱가입니다.",
    type: "gathering"
  },
  {
    title: "Chengdu ICH Tango Festival",
    hostName: "Panda LU",
    hostId: "system1",
    startDate: new Date("2026-05-11"),
    endDate: new Date("2026-05-15"),
    location: "Chengdu, China",
    description: "성도에서 열리는 전통 있는 ICH 탱고 페스티벌 및 컴피티션입니다.",
    type: "festival"
  },
  {
    title: "Greater China Tango Championship",
    hostName: "Unknown",
    hostId: "system1",
    startDate: new Date("2026-04-02"),
    endDate: new Date("2026-04-06"),
    location: "Chengdu, China",
    description: "중화권 최대 규모의 탱고 챔피언십 대회가 성도에서 개최됩니다.",
    type: "festival"
  },
  {
    title: "Chuncheon Tango Festival",
    hostName: "John & White Bear",
    hostId: "system1",
    startDate: new Date("2026-10-02"),
    endDate: new Date("2026-10-05"),
    location: "Chuncheon, Korea",
    description: "호반의 도시 춘천에서 즐기는 로맨틱한 탱고 페스티벌입니다.",
    type: "festival"
  },
  {
    title: "Vientam Tango Marathon(VTM)",
    hostName: "Alice Tango Saigon",
    hostId: "system1",
    startDate: new Date("2026-04-02"),
    endDate: new Date("2026-04-06"),
    location: "Da Nang, Vientam",
    description: "베트남 다낭의 휴양지에서 즐기는 탱고 마라톤 VTM입니다.",
    type: "festival"
  },
  {
    title: "Daegu International Tango Marathon",
    hostName: "doyadoya",
    hostId: "system1",
    startDate: new Date("2026-04-24"),
    endDate: new Date("2026-04-26"),
    location: "Daegu, Korea",
    description: "대구에서 펼쳐지는 뜨거운 열기의 국제 탱고 마라톤 이벤트입니다.",
    type: "festival"
  },
  {
    title: "Sakura Tango Festival",
    hostName: "Fukuoka Chamuya Tango",
    hostId: "system1",
    startDate: new Date("2026-04-02"),
    endDate: new Date("2026-04-05"),
    location: "Fukuoka, Japan",
    description: "벚꽃이 만개한 후쿠오카에서 즐기는 환상적인 탱고 축제입니다.",
    type: "festival"
  },
  {
    title: "South China Argenting Tango Competition",
    hostName: "Pop & Xiao Yang",
    hostId: "system1",
    startDate: new Date("2026-03-19"),
    endDate: new Date("2026-03-22"),
    location: "Guangzhou, China",
    description: "남중국 최고의 탱고 댄서들을 선발하는 대규모 컴피티션입니다.",
    type: "festival"
  },
  {
    title: "Gunsan Sunset Tango Marathon",
    hostName: "IF",
    hostId: "system1",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-05-03"),
    location: "Gunsan, Korea",
    description: "군산의 아름다운 일몰과 함께하는 감성적인 탱고 마라톤입니다.",
    type: "festival"
  },
  {
    title: "Seo-Ra-Beol Milongueros",
    hostName: "Augusto Kim & Moses Park",
    hostId: "system1",
    startDate: new Date("2026-03-12"),
    endDate: new Date("2026-03-15"),
    location: "Gyeongju, Korea",
    description: "천년고도 경주에서 펼쳐지는 서라벌 밀롱게로스 축제입니다.",
    type: "festival"
  },
  {
    title: "Saigon Tango Marathon",
    hostName: "Saigon Tango Marathon",
    hostId: "system1",
    startDate: new Date("2026-10-01"),
    endDate: new Date("2026-10-05"),
    location: "Hochiminh, Vietnam",
    description: "베트남 호치민(사이공)에서 열리는 에너지 넘치는 탱고 마라톤입니다.",
    type: "festival"
  },
  {
    title: "Festivalito de Tango en Hong Kong",
    hostName: "Nathalie Cheng",
    hostId: "system1",
    startDate: new Date("2026-03-13"),
    endDate: new Date("2026-03-15"),
    location: "Hong Kong, China",
    description: "홍콩에서 열리는 아기자기하고 집중도 높은 페스티발리토입니다.",
    type: "festival"
  },
  {
    title: "Jeju Summ Milonga",
    hostName: "Kim Seong Gong & Augusto Kim",
    hostId: "system1",
    startDate: new Date("2026-08-21"),
    endDate: new Date("2026-08-23"),
    location: "Jeju, Korea",
    description: "제주의 푸른 여름 바다와 함께 즐기는 시원한 밀롱가 파티입니다.",
    type: "gathering"
  },
  {
    title: "Nanjing Tango Festival",
    hostName: "Wang Felicia",
    hostId: "system1",
    startDate: new Date("2026-05-05"),
    endDate: new Date("2026-05-07"),
    location: "Nanjing, China",
    description: "중국 난징에서 개최되는 수준 높은 탱고 마스터 클래스 및 밀롱가입니다.",
    type: "festival"
  },
  {
    title: "Crab Milonga (Pos Tango 21th Anniversary)",
    hostName: "Pos Tango",
    hostId: "system1",
    startDate: new Date("2026-03-20"),
    endDate: new Date("2026-03-22"),
    location: "Pohang, Korea",
    description: "포항 포스탱고의 21주년을 기념하는 특별한 대게 밀롱가입니다.",
    type: "gathering"
  },
  {
    title: "Brenno Marques & Fati Caracoch",
    hostName: "Seonmin lee",
    hostId: "system1",
    startDate: new Date("2026-09-03"),
    endDate: new Date("2026-09-09"),
    location: "Seoul, Korea",
    description: "전 세계적으로 사랑받는 브레노와 파티의 고품격 서울 워크숍입니다.",
    type: "gathering"
  },
  {
    title: "Carlitos Espinoza & Agustina Piaggio",
    hostName: "Isabel Jinyoung Roh & Leon Junseok Lee",
    hostId: "system1",
    startDate: new Date("2026-11-05"),
    endDate: new Date("2026-11-08"),
    location: "Seoul, Korea",
    description: "탱고계의 슈퍼스타 깔리또스와 아구스티나의 전설적인 서울 클래스입니다.",
    type: "gathering"
  },
  {
    title: "Champagne Milonga",
    hostName: "Sophia Chung & Eaddie Kang",
    hostId: "system1",
    startDate: new Date("2026-12-30"),
    endDate: new Date("2026-12-31"),
    location: "Seoul, Korea",
    description: "한 해를 마무리하며 샴페인과 함께 즐기는 품격 있는 밀롱가입니다.",
    type: "gathering"
  },
  {
    title: "Dante Sanchez & Roxana Suarez",
    hostName: "Okiz Baek",
    hostId: "system1",
    startDate: new Date("2026-10-21"),
    endDate: new Date("2026-10-27"),
    location: "Seoul, Korea",
    description: "최고의 마에스트로 단테와 록사나가 선사하는 우아한 탱고의 정석입니다.",
    type: "gathering"
  },
  {
    title: "De Coreanas",
    hostName: "Guwoo, Ryuga, Barbie, Jia, Peninsula, Fish, Hwayi, Simona",
    hostId: "system1",
    startDate: new Date("2026-03-26"),
    endDate: new Date("2026-03-29"),
    location: "Seoul, Korea",
    description: "한국의 대표 여성 탱고인들이 주축이 되어 개최하는 특별한 이벤트입니다.",
    type: "gathering"
  },
  {
    title: "Fausto Carpino & Stephanie",
    hostName: "Stone Hong",
    hostId: "system1",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-09-07"),
    location: "Seoul, Korea",
    description: "세밀한 커넥션의 대가 파우스토와 스테파니의 인텐시브 서울 워크숍입니다.",
    type: "gathering"
  },
  {
    title: "Hernan Alvarez Prieto",
    hostName: "Suri Bae",
    hostId: "system1",
    startDate: new Date("2026-03-04"),
    endDate: new Date("2026-04-01"),
    location: "Seoul, Korea",
    description: "탱고의 핵심 원리를 전달하는 에르난 아르바레즈의 특별 강습 시리즈입니다.",
    type: "gathering"
  },
  {
    title: "Horacio Godoy & Maricel Giacomini",
    hostName: "Fish Tango & Tae bong",
    hostId: "system1",
    startDate: new Date("2026-11-11"),
    endDate: new Date("2026-11-16"),
    location: "Seoul, Korea",
    description: "탱고의 악동 오라시오와 마리셀이 보여주는 역동적인 탱고 세계입니다.",
    type: "gathering"
  },
  {
    title: "Korea Tango Championship(KTC)",
    hostName: "Korea Tango Cooperative",
    hostId: "system1",
    startDate: new Date("2026-02-28"),
    endDate: new Date("2026-03-02"),
    location: "Seoul, Korea",
    description: "대한민국 탱고인의 자부심, KTC 챔피언십 대회가 서울에서 열립니다.",
    type: "festival"
  },
  {
    title: "Martín Ojeda & Maria linés Bogado",
    hostName: "Okiz Baek",
    hostId: "system1",
    startDate: new Date("2026-04-15"),
    endDate: new Date("2026-04-23"),
    location: "Seoul, Korea",
    description: "정교한 테크닉과 우아함의 조화, 마르틴과 마리아의 서울 특별 강습입니다.",
    type: "gathering"
  },
  {
    title: "Moira Castellano",
    hostName: "Seon Min Lee",
    hostId: "system1",
    startDate: new Date("2026-04-23"),
    endDate: new Date("2026-04-30"),
    location: "Seoul, Korea",
    description: "정통 아르헨티나 탱고의 깊은 맛을 전하는 모이라 카스텔라노 워크숍입니다.",
    type: "gathering"
  },
  {
    title: "Nom Mil(12h Tango Marathon)",
    hostName: "Carlos, Hernan, Hjun",
    hostId: "system1",
    startDate: new Date("2026-02-16"),
    endDate: new Date("2026-02-16"),
    location: "Seoul, Korea",
    description: "12시간 동안 멈추지 않는 열정적인 서울 탱고 마라톤입니다.",
    type: "festival"
  },
  {
    title: "Pacific Tango Championship(PTC)",
    hostName: "Korea Tango Cooperative",
    hostId: "system1",
    startDate: new Date("2026-05-05"),
    endDate: new Date("2026-05-07"),
    location: "Seoul, Korea",
    description: "아시아 태평양 지역 최고의 탱고 예술가들이 모이는 챔피언십 축제입니다.",
    type: "festival"
  },
  {
    title: "Pancho & Lorena (B.T.S 2026)",
    hostName: "EL Torito JiWoon & Elly & Hyoni",
    hostId: "system1",
    startDate: new Date("2026-04-02"),
    endDate: new Date("2026-04-13"),
    location: "Seoul, Korea",
    description: "2026년 봄, 판초와 로레나가 함께하는 B.T.S 탱고 페스티벌입니다.",
    type: "festival"
  },
  {
    title: "Seoul Tango Festival(STF)",
    hostName: "Leo y Flo Tango",
    hostId: "system1",
    startDate: new Date("2026-04-29"),
    endDate: new Date("2026-05-03"),
    location: "Seoul, Korea",
    description: "역사와 전통을 자랑하는 서울 최대 규모의 축제, STF입니다.",
    type: "festival"
  },
  {
    title: "Shanghai International Tango Festival",
    hostName: "Vivan Yeh",
    hostId: "system1",
    startDate: new Date("2026-07-24"),
    endDate: new Date("2026-07-27"),
    location: "Shanghai, China",
    description: "글로벌 상하이 국제 탱고 페스티벌로 전 세계 탱고인을 초대합니다.",
    type: "festival"
  },
  {
    title: "Shanghai Tango Marathon",
    hostName: "Perni Peng & Sergiy Podbolotny",
    hostId: "system1",
    startDate: new Date("2026-11-19"),
    endDate: new Date("2026-11-22"),
    location: "Shanghai, China",
    description: "상하이의 화려한 야경과 함께 며칠 밤낮으로 이어지는 열정의 탱고 마라톤입니다.",
    type: "festival"
  },
  {
    title: "Tango Caravan(Sha Xi old town)",
    hostName: "Liu Zheng, Will Fred",
    hostId: "system1",
    startDate: new Date("2026-04-10"),
    endDate: new Date("2026-04-12"),
    location: "ShaXi, China",
    description: "중국의 고성 샤시(Sha Xi)에서 즐기는 낭만적인 탱고 캐러밴 여행입니다.",
    type: "festival"
  },
  {
    title: "Shenzhen Tango Maracuentro",
    hostName: "Miranda Xu & Aykut Kazanci",
    hostId: "system1",
    startDate: new Date("2026-03-27"),
    endDate: new Date("2026-03-29"),
    location: "Shenzhen, China",
    description: "심천에서 열리는 특별한 탱고 마라쿠엔트로 이벤트입니다.",
    type: "festival"
  },
  {
    title: "Shenyang Summer Ice & Snow Tango Weekend",
    hostName: "CoCo Feng",
    hostId: "system1",
    startDate: new Date("2026-08-14"),
    endDate: new Date("2026-08-16"),
    location: "Shenyang, China",
    description: "선양에서 시원하게 즐기는 여름 시즌 탱고 위켄드입니다.",
    type: "festival"
  },
  {
    title: "Singapore International Tango Festival(SITF)",
    hostName: "Lily Tan & Gennysam Alcantara",
    hostId: "system1",
    startDate: new Date("2026-10-01"),
    endDate: new Date("2026-10-04"),
    location: "Singapore",
    description: "싱가포르에서 개최되는 권위 있는 국제 탱고 페스티벌 SITF입니다.",
    type: "festival"
  },
  {
    title: "Singapore Tango Marathon",
    hostName: "Chen Wei Li",
    hostId: "system1",
    startDate: new Date("2026-07-03"),
    endDate: new Date("2026-07-05"),
    location: "Singapore",
    description: "아시아 최고의 마라톤 중 하나인 싱가포르 탱고 마라톤 대회입니다.",
    type: "festival"
  },
  {
    title: "Big Milonga \"Estrellas\"",
    hostName: "BongBong & miae na(Navi)",
    hostId: "system1",
    startDate: new Date("2026-10-17"),
    endDate: new Date("2026-10-18"),
    location: "Suncheon, Korea",
    description: "순천의 밤을 수놓는 별들의 밀롱가, 'Estrellas' 이벤트입니다.",
    type: "gathering"
  },
  {
    title: "Taichung Tango Festival",
    hostName: "Weilung Chang",
    hostId: "system1",
    startDate: new Date("2026-04-03"),
    endDate: new Date("2026-04-05"),
    location: "Taichung, Taiwan",
    description: "타이중에서 열리는 대만 대표 탱고 페스티벌 및 공연입니다.",
    type: "festival"
  },
  {
    title: "Asian Tango Championship",
    hostName: "Executive Committee",
    hostId: "system1",
    startDate: new Date("2026-05-13"),
    endDate: new Date("2026-05-14"),
    location: "Tokyo, Japan",
    description: "아시아 최강자를 가리는 도쿄 매치, 아시안 탱고 챔피언십입니다.",
    type: "festival"
  }
];

async function upload() {
  const batch = db.batch();
  
  eventsToUpload.forEach(event => {
    const ref = db.collection('events').doc();
    batch.set(ref, {
      ...event,
      startDate: admin.firestore.Timestamp.fromDate(event.startDate),
      endDate: admin.firestore.Timestamp.fromDate(event.endDate)
    });
  });

  await batch.commit();
  console.log(`TOTAL_UPLOADED: ${eventsToUpload.length}`);
}

upload().catch(err => {
  console.error(err);
  process.exit(1);
});
