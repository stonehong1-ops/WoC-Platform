import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateTranslations() {
  const translations = {
    'First time dancing to live orchestra music! It brings a completely different flavor to the embrace. Unforgettable experience tonight. 🎻🎼': 
      '라이브 오케스트라 음악에 맞춰 처음 춤을 춰봤어요! 평소와는 완전히 다른 느낌이었습니다. 오늘 밤은 잊을 수 없는 경험이었어요. 🎻🎼',
    'A beautiful night of dancing with friends. Tango connects us all regardless of where we are from. Captured some beautiful moments on the floor! ❤️':
      '친구들과 함께 춤을 춘 아름다운 밤. 탱고는 우리가 어디서 왔는지에 상관없이 우리 모두를 연결해줍니다. 플로어에서 아름다운 순간들을 사진으로 남겼어요! ❤️',
    'Just had an amazing time exploring the cultural spots in Seoul before hitting the dance floor tonight. Highly recommend visiting the palaces!':
      '오늘 밤 댄스 플로어에 가기 전에 서울의 문화 명소들을 둘러보며 정말 즐거운 시간을 보냈습니다. 고궁 방문을 강력 추천합니다!',
    'Anyone going to the milonga event in Hongdae this Friday? Let me know if you want to meet up for some food beforehand!':
      '이번 주 금요일 홍대 밀롱가 이벤트 가시는 분 계신가요? 가기 전에 같이 식사하실 분 있으면 알려주세요!',
    'First time dancing to live orchestra music here in Seoul. The musicians were phenomenal and it brings a completely different flavor to the embrace! 🎻🎼':
      '여기 서울에서 라이브 오케스트라 음악에 맞춰 처음 춤을 춰봤습니다. 연주자들이 경이로웠고 춤출 때 완전히 다른 느낌을 주네요! 🎻🎼'
  };

  const snapshot = await db.collection('feeds').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.content && translations[data.content]) {
      await db.collection('feeds').doc(doc.id).update({
        translatedContent: translations[data.content]
      });
      console.log(`Updated translation for: ${doc.id}`);
    }
  }
  console.log('Done!');
}

updateTranslations().catch(console.error);
