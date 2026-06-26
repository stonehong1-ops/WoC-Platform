import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccountPath = 'C:\\Users\\stone\\WoC\\woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';

const app = initializeApp({
  credential: cert(serviceAccountPath)
});

const db = getFirestore(app);

async function run() {
  console.log('=== Starting GTP 12th Anniversary Party Data Cleanup & Update ===');

  const mainDocId = 'gtp_12th_anniversary';
  const duplicateDocId = 'HADfTAU0Fbb6dtVUWi30';

  // 1. 중복 문서 삭제
  console.log(`Deleting duplicate document: ${duplicateDocId}`);
  await db.collection('socials').doc(duplicateDocId).delete();
  console.log('Duplicate document deleted.');

  // 2. 메인 문서 업데이트
  console.log(`Updating main document: ${mainDocId}`);
  const mainRef = db.collection('socials').doc(mainDocId);
  const mainDoc = await mainRef.get();

  if (!mainDoc.exists) {
    throw new Error(`Main document ${mainDocId} does not exist.`);
  }

  const updatedData = {
    venueId: 'nOpG4qOzsVR8OZ1V9PpK', // 클럽판 (Club PAN)
    venueName: 'Club PAN',
    venueNameNative: '클럽판',
    district: '서초구',
    price: '수퍼얼리버드가: 2만원(~6/30) / 얼리버드가: 2.5만원(7/1~7/15) / 현장: 3만원 (스폰서테이블 10만원)',
    description: `서로 다른 개성들이 모여 아름다운 추억을 만들고, 때로는 아슬아슬한 순간도 있었지만 서로가 있었기에 멋진 균형을 이루며 여기까지 걸어올 수 있었습니다.\n그 감사한 마음을 담아, 강남탱고 판(GTP) 12주년 기념 파티를 엽니다! 🎉\n\n✨ GANGNAM TANGO PAN 12th Anniversary Party\n\n📅 일시: 2026년 7월 17일 (금) 저녁 7시 30분 ~ 밤 12시\n🎵 DJ: 곤즈 (Gonz)\n🔸 MC: 요노 (Yono)\n📸 Photo: 전문 포토그래퍼 오실장\n👗 드레스코드: 파티플랙스 (Party Flex)\n\n💰 예매 안내:\n- 수퍼 얼리버드: 20,000원 (~6월 30일까지)\n- 얼리버드: 25,000원 (7월 1일 ~ 15일까지)\n- 현장 판매: 30,000원\n- 스폰서 테이블: 100,000원 (파티비 별도)\n\n🎁 파티 이벤트:\n1. 드레스코드 풀착 시 론다 런웨이 참여 가능 (추첨을 통해 드레스 경품 증정!)\n2. 포토월 인생 프사 촬영 (패션/웨딩 전문 작가 등판!)\n\n🍷 무제한 화이트 와인 & 최고급 핑거푸드 제공 (과일, 케이크, 샌드위치, 햄치즈, 올리브, 카나페, 초콜릿, 캔디 등)\n\n📍 장소: 강남 클럽 판땅고 (서초구 강남대로 595 경승빌딩 B1, 신사역 4번출구 앞 스타벅스 건물)\n🚗 주차: 롯데건설본사 주차장 (밤 11시 이후 출차 시 무료)\n\n<< 행사 일정 >>\n- 19:30 파티 시작\n- 22:00 기념 행사\n- 24:00 파티 종료 & 뒤풀이 시작\n\n* 4인 이상 예매 시 테이블 선착순 지정 가능 (입장 21:00까지 적용)`,
    djs: [
      {
        date: '2026-07-17',
        djName: 'Gonz',
        djNativeName: '곤즈',
        message: 'GTP 12주년 파티 DJ는 곤즈님입니다. (MC: 요노, Photo: 오실장)',
        id: 'dj-gonz-2026-07-17'
      }
    ],
    updatedAt: FieldValue.serverTimestamp()
  };

  await mainRef.update(updatedData);
  console.log('Main document updated successfully.');
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
