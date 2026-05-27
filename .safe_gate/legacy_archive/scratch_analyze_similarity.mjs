import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

// 이미지에서 전사한 커뮤니티 목록 및 분석용 지역 키워드
const sheetCommunities = [
  { raw: "탱고스쿨", region: "서울/전국" },
  { raw: "문뽈꼬떼 탱고", region: "서울/경기" },
  { raw: "문뽈꼬떼", region: "서울/경기" },
  { raw: "문뽈꼬떼탱고", region: "서울/경기" },
  { raw: "모두의 탱고", region: "서울/경기" },
  { raw: "라플라타", region: "서울" },
  { raw: "대전 까미니또", region: "대전" },
  { raw: "온뽀꼬데탱고", region: "서울" },
  { raw: "온뽀꼬떼", region: "서울" },
  { raw: "소셜 탱고 아카데미", region: "서울" },
  { raw: "소셜탱고아카데미", region: "서울" },
  { raw: "소셜탱고", region: "서울" },
  { raw: "서울아르헨티나탱고아카데미", region: "서울" },
  { raw: "서울 아르헨티나 탱고 아카데미", region: "서울" },
  { raw: "솔로탱고", region: "서울" },
  { raw: "솔로땅고", region: "서울" },
  { raw: "SoloTango", region: "서울" },
  { raw: "순간 탱고", region: "서울" },
  { raw: "마뽈탱고", region: "서울" },
  { raw: "마을탱고", region: "서울" },
  { raw: "아르헨티나대사관", region: "서울" },
  { raw: "마음탱고", region: "서울" },
  { raw: "솔땅", region: "서울" },
  { raw: "쏠땅", region: "서울" },
  { raw: "솔땅 126기", region: "서울" },
  { raw: "장원 딴따라땅고", region: "서울/경기" },
  { raw: "장원 딴따라땅고 동호회", region: "서울/경기" },
  { raw: "장원 뗌뻬데땅고", region: "서울/경기" },
  { raw: "장원 뗌뻬데땅고 동호회", region: "서울/경기" },
  { raw: "GATO", region: "서울" },
  { raw: "가또땅고", region: "서울" },
  { raw: "미키 알리나 개인레슨", region: "서울" },
  { raw: "AB.TANGO", region: "서울" },
  { raw: "ABtango", region: "서울" },
  { raw: "AB TANGO", region: "서울" },
  { raw: "탱고와인", region: "서울" },
  { raw: "꼰띡고클럽", region: "서울" },
  { raw: "탱고 포르투", region: "부산" },
  { raw: "명지대학교 아르헨티나탱고", region: "서울" },
  { raw: "부산 태망고", region: "부산" },
  { raw: "외또땅고", region: "서울" },
  { raw: "또도땅고", region: "서울" },
  { raw: "인탱고", region: "대구" },
  { raw: "서아탱 7기", region: "서울/경기" },
  { raw: "분당 실루엣", region: "분당" },
  { raw: "춘천뽀꼬탱고", region: "춘천" },
  { raw: "춘천땅고", region: "춘천" },
  { raw: "라틴속으로 탱고", region: "서울" },
  { raw: "진주탱고피플", region: "진주" }
];

// 레벤슈타인 거리 기반 유사도 계산
function getLevenshteinDistance(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

function calculateSimilarity(str1, str2) {
  const s1 = str1.replace(/\s+/g, "").toLowerCase();
  const s2 = str2.replace(/\s+/g, "").toLowerCase();
  
  if (s1 === s2) return 1.0;
  
  // 포함 관계 보정 (한글 동호회 명칭 특화)
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    if (minLen / maxLen >= 0.5) {
      return 0.85; // 키워드가 포함되어 있고 절반 이상 일치하면 높은 유사성 부여
    }
  }
  
  const distance = getLevenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

async function run() {
  const coll = collection(db, "groups");
  const snapshot = await getDocs(coll);
  
  const dbGroups = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    dbGroups.push({
      id: doc.id,
      name: data.name || "",
      nativeName: data.nativeName || "",
      nativeTitle: data.nativeTitle || "",
      description: data.description || ""
    });
  });

  console.log(`DB Groups Loaded: ${dbGroups.length}`);
  
  const matched = [];
  const unmatched = [];
  
  // 명단 내 중복 제거된 유니크 커뮤니티 매핑 대상
  const uniqueSheets = [];
  const seenRaw = new Set();
  sheetCommunities.forEach(item => {
    // 공백 무시하고 키워드 중복 제거
    const normalized = item.raw.replace(/\s+/g, "").toLowerCase();
    if (!seenRaw.has(normalized)) {
      seenRaw.add(normalized);
      uniqueSheets.push(item);
    }
  });

  console.log(`Unique sheet communities to analyze: ${uniqueSheets.length}`);

  for (const community of uniqueSheets) {
    let bestMatch = null;
    let maxSim = 0.0;
    
    for (const dbGroup of dbGroups) {
      // dbGroup의 한글/영어 명칭 후보군 전체 대조
      const candidates = [
        dbGroup.name,
        dbGroup.nativeName,
        dbGroup.nativeTitle
      ].filter(Boolean);
      
      for (const candidate of candidates) {
        const sim = calculateSimilarity(community.raw, candidate);
        if (sim > maxSim) {
          maxSim = sim;
          bestMatch = { dbGroup, candidate, similarity: sim };
        }
      }
    }
    
    if (maxSim >= 0.8) {
      matched.push({
        sheetName: community.raw,
        region: community.region,
        dbName: bestMatch.candidate,
        dbId: bestMatch.dbGroup.id,
        similarity: Math.round(maxSim * 100)
      });
    } else {
      unmatched.push({
        sheetName: community.raw,
        region: community.region,
        bestMatchName: bestMatch ? bestMatch.candidate : "N/A",
        similarity: bestMatch ? Math.round(maxSim * 100) : 0
      });
    }
  }

  console.log("\n=== MATCHED (우리 클럽에 있음 - 80% 이상 유사성) ===");
  console.log(JSON.stringify(matched, null, 2));

  console.log("\n=== UNMATCHED (우리 클럽에 없음 - 80% 미만 유사성) ===");
  console.log(JSON.stringify(unmatched, null, 2));
}

run().then(() => process.exit(0)).catch(console.error);
