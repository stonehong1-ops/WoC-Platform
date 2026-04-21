const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, GeoPoint } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBFLzc4F7F_E9XidGRwB4EsAr5LN-Hu7i0",
  authDomain: "woc-platform-seoul-1234.firebaseapp.com",
  projectId: "woc-platform-seoul-1234",
  storageBucket: "woc-platform-seoul-1234.firebasestorage.app",
  messagingSenderId: "1021887439599",
  appId: "1:1021887439599:web:7c5741009dd928b8fd311a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const updates = [
  { nameKo: '운포코데탱고', lat: 37.5583008, lng: 126.9243269, address: '서울특별시 마포구 월드컵북로2길 81-3' },
  { nameKo: '탱고브루호', lat: 37.5537899, lng: 126.9171166 },
  { nameKo: '플레이스오션', lat: 37.5587339, lng: 126.920801, address: '서울특별시 마포구 월드컵북로6길 42' },
  { nameKo: '보니따', lat: 37.5576017, lng: 126.9224131, address: '서울특별시 마포구 동교로 191', detailAddress: '디비엠빌딩 지하 1층' },
  { nameKo: '오나다2', lat: 37.5647184, lng: 126.9254418, address: '서울특별시 마포구 성미산로 187' }
];

async function updateVenues() {
  const venuesRef = collection(db, 'venues');
  
  for (const update of updates) {
    const q = query(venuesRef, where('nameKo', '==', update.nameKo));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`No matching documents for: ${update.nameKo}`);
      continue;
    }
    
    for (const d of snapshot.docs) {
      const payload = {
        coordinates: new GeoPoint(update.lat, update.lng)
      };
      if (update.address) payload.address = update.address;
      if (update.detailAddress) payload.detailAddress = update.detailAddress;
      
      await updateDoc(d.ref, payload);
      console.log(`Successfully updated ${update.nameKo} (${d.id})`);
    }
  }
  process.exit(0);
}

updateVenues().catch(err => {
  console.error(err);
  process.exit(1);
});
