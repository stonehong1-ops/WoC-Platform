import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 서비스 어카운트 키 경로 설정 (루트 디렉토리의 JSON 파일 사용)
const serviceAccountPath = path.resolve(__dirname, '../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account key not found at:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'woc-platform-seoul-1234.firebasestorage.app'
});

const storage = getStorage(app);
const db = getFirestore(app);

async function run() {
  console.log('1. Uploading poster image to Firebase Storage...');
  
  const localImagePath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\28ad0f1c-02f4-49c8-bb55-664dd5d7b33d\\media__1780927065099.jpg';
  
  if (!fs.existsSync(localImagePath)) {
    console.error('Poster image not found at:', localImagePath);
    process.exit(1);
  }

  const bucket = storage.bucket();
  // socials 디렉토리에 고유 식별자로 저장
  const destination = 'socials/4berrymil_poster.jpg';

  await bucket.upload(localImagePath, {
    destination,
    metadata: { 
      contentType: 'image/jpeg' 
    }
  });

  const file = bucket.file(destination);
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
  console.log('Image uploaded successfully. Public URL:', publicUrl);

  console.log('2. Inserting 4BerryMil document to Firestore socials collection...');

  const description = 
`🎈4베리밀 4토로 기억해주세요🎈

🎈오픈이벤트ㅡ모든 #오거나이저님 초대로
모십니다. 우리가 땅고를 편안하고 즐겁게
출수있도록 애쓰시잖아요.감사감사🎈

🎈사베리표 사사사샌드위치.수제과일화채
아이스와인.꽈배기.달달한간식 등 푸짐히
준비합니다🎈

🎈론다는2개만.손까베금지.너무 먼거리면
자연스럽게 옆에가셔서 눈으로 해주셔요🎈

1.일시: 6월 27일 토요일 7~11시
2.장소 : 반포대로30길82.ENPAZ
3.오거&디제이 : 이사벨
4.입장료 : 13,000원 ㅡ텀블러지참시12,000원
5.딴다순서 : 탱탱발AM 탱탱밀KPOP
6.예약 : 010.8850.6520 (1인석도 예약가능)

#4베리밀4주차토욜7시
#춤추게하라두근거리는음악으로`;

  const newSocial = {
    type: 'regular',
    title: '4BerryMil',
    titleNative: '4베리밀',
    organizerId: 'system1',
    organizerName: 'Isabelle',
    organizerNameNative: '이사벨',
    venueId: 'Hgy2FrsR7F5jJvKMtOK3', // En Paz Studio
    venueName: 'En Paz Studio',
    venueNameNative: '엔빠스',
    imageUrl: publicUrl,
    posterExportUrl: publicUrl,
    startTime: '19:00',
    endTime: '23:00',
    country: 'KOREA',
    city: 'SEOUL',
    district: '서초구',
    dayOfWeek: 6, // 토요일
    recurrence: '4th', // 4째주
    price: '13,000',
    subCategory: 'milonga',
    description: description,
    djName: 'Isabelle',
    djNameNative: '이사벨',
    djs: [
      {
        id: 'dj-isabelle-2026-06-27',
        date: '2026-06-27',
        djName: 'Isabelle',
        djNativeName: '이사벨'
      }
    ],
    createdAt: Timestamp.now()
  };

  const docRef = await db.collection('socials').add(newSocial);
  console.log(`Document created successfully with ID: ${docRef.id}`);
}

run()
  .then(() => {
    console.log('Execution completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error executing script:', err);
    process.exit(1);
  });
