import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../src/lib/firebase/clientApp';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

// Mapping from the current Korean titles (which replaced the original) to English titles
const mappings: Record<string, string> = {
    "대구 국제 탱고 마라톤": "Daegu International Tango Marathon",
    "샤먼 국제 탱고 페스티벌": "Xiamen International Tango Festival",
    "부산 탱고 위켄드 - 안드레스 & 엘라디아": "Busan Tango Weekend - Andres & Eladia",
    "탱고 워크숍 & 밀롱가 - 옥타비오 & 카롤리나": "Tango Workshop & Milonga - Octavio & Carolina",
    "서울 탱고 페스티벌": "Seoul Tango Festival",
    "홍콩 탱고 페스티발리토": "Hong Kong Tango Festivalito",
    "싱가포르 선셋 탱고 마라톤": "Singapore Sunset Tango Marathon",
    "난징 탱고 페스티벌": "Nanjing Tango Festival",
    "톈진 탱고 마라톤": "Tianjin Tango Marathon",
    "한국 탱고 위켄드 - 세바스티안 & 조아나": "Korea Tango Weekend - Sebastian & Joana",
    "베트남 탱고 마라톤 (VTM)": "Vietnam Tango Marathon (VTM)",
    "조나단 & 클라리사": "Jonathan & Clarisa",
    "옥타비오 페르난데스 & 카롤리나 지아니니": "Octavio Fernandez & Carolina Giannini",
    "안드레스 라자 모레노 & 엘라디아 코르도바": "Andres Laza Moreno & Eladia Cordoba",
    "월드컵 아시아 & 아시아 태평양 탱고 페스티벌": "World Cup Asia & Asia Pacific Tango Festival",
    "도쿄 탱고 마라톤": "Tokyo Tango Marathon",
    "오사카 탱고 페스티벌": "Osaka Tango Festival",
    "탱고 워크숍 & 밀롱가 - 안드레스 & 엘라디아": "Tango Workshop & Milonga - Andres & Eladia",
    "인도네시아 챔피언십 & 파라다이스": "Indonesia Championship & Paradise",
    "도쿄 탱고 페스티벌": "Tokyo Tango Festival",
    "아시아 태평양 탱고 챔피언십": "Asia Pacific Tango Championship",
    "베이징 셀렉트 탱고 위켄드 - 조나단 & 클라리사": "Beijing Select Tango Weekend - Jonathan & Clarisa",
    "상하이 탱고 마라톤": "Shanghai Tango Marathon",
    "타이베이 탱고 페스티벌": "Taipei Tango Festival",
    "중화권 탱고 챔피언십": "Greater China Tango Championship",
    "부산 탱고 위켄드 \"엘 마르\"": "Busan Tango Weekend \"El Mar\"",
    "아시아 태평양 밀롱가 & 워크숍 투어": "Asia Pacific Milonga & Workshop Tour",
    "무라트 에르뎀셀 & 실비나 체": "Murat Erdemsel & Silvina Tse",
    "아시아 탱고 챔피언십": "Asia Tango Championship",
    "사이공 탱고 마라톤": "Saigon Tango Marathon",
    "도쿄 퀴어 탱고 페스티벌": "Tokyo Queer Tango Festival",
    "청두 ICH 탱고 페스티벌": "Chengdu ICH Tango Festival",
    "윈터 탱고 페스티벌": "Winter Tango Festival",
    "발리 탱고 홀리데이": "Bali Tango Holiday",
    "셀렉트 탱고 위켄드": "Select Tango Weekend",
    "대만 탱고 마라톤": "Taiwan Tango Marathon",
    "서라벌 밀롱게로스": "Seorabeol Milongueros",
    "춘천 탱고 페스티벌": "Chuncheon Tango Festival",
    "베이징 셀렉트 탱고 위켄드 - 안드레스 & 엘라디아": "Beijing Select Tango Weekend - Andres & Eladia",
    "오리엔탈 탱고 콩그레스 (OTC)": "Oriental Tango Congress (OTC)",
    "아시아 태평양 탱고 페스티벌 - APTF": "Asia Pacific Tango Festival - APTF",
    "남중국 아르헨티나 탱고 챔피언십": "South China Argentine Tango Championship",
    "서울 탱고 피에스타": "Seoul Tango Fiesta",
    "체리 블라썸 밀롱가": "Cherry Blossom Milonga",
    "사쿠라 탱고 페스티벌": "Sakura Tango Festival",
    "한국 탱고 위켄드 - 막시모 & 팔로마": "Korea Tango Weekend - Maximo & Paloma",
    "제주 썸머 밀롱가": "Jeju Summer Milonga"
};

async function fixEvents() {
    console.log('Starting full event update...');
    const snapshot = await getDocs(collection(db, 'events'));
    
    let updatedCount = 0;
    const batchSize = 100;
    let batch = writeBatch(db);
    let operationCount = 0;

    for (const d of snapshot.docs) {
        const data = d.data();
        const currentTitle = data.title || "";
        const currentNativeTitle = data.nativeTitle || "";
        
        let newTitle = currentTitle;
        let newNativeTitle = currentNativeTitle;

        // If the current title is in our mapping (meaning it's Korean), we swap it.
        if (mappings[currentTitle]) {
            newTitle = mappings[currentTitle];
            newNativeTitle = currentTitle;
        } else if (Object.values(mappings).includes(currentTitle)) {
            // It's already English in the title. Make sure nativeTitle is set.
            const kr = Object.keys(mappings).find(key => mappings[key] === currentTitle);
            if (kr) {
                newNativeTitle = kr;
            }
        }

        // We update if the title or nativeTitle needs to be changed
        if (newTitle !== data.title || newNativeTitle !== data.nativeTitle) {
            const eventRef = doc(db, 'events', d.id);
            batch.update(eventRef, {
                title: newTitle,
                nativeTitle: newNativeTitle
            });
            updatedCount++;
            operationCount++;
        }

        if (operationCount >= batchSize) {
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
        }
    }

    if (operationCount > 0) {
        await batch.commit();
    }

    console.log('Updated', updatedCount, 'events');
    process.exit(0);
}

fixEvents().catch(console.error);
