import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import fs from 'fs';
import { matchSocialCandidate, MiniSocial } from '@/app/admin/social-radar/lib/socialMatchService';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export async function POST(req: Request) {
  try {
    const { text, url } = await req.json();
    if (!text) {
      return NextResponse.json({ error: '분석할 텍스트가 없습니다.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 서버에 설정되어 있지 않습니다.' }, { status: 503 });
    }

    // 1. Gemini API를 사용하여 텍스트 분석 및 정보 추출
    const prompt = `
당신은 대한민국 탱고 커뮤니티 통합 플랫폼(WoC)의 전문 데이터 기획자입니다.
주어진 텍스트(소셜/밀롱가 공지글)를 읽고, 아래의 규칙을 엄격히 지켜 탱고 이벤트를 파싱하여 JSON 형태로 추출해 주세요.

[SOP 및 추출 규칙]
1. 장소(Venue)명을 주최자(Organizer/ORG)로 지정하는 것을 엄격히 금지합니다.
   - 예: '홍대 오초', '오나다', '탱고라이프' 등은 베뉴(venue)이지 주최자가 아닙니다.
   - 만약 주최자에 해당하는 실명이나 닉네임(예: 현우, 쟌루카, 진아 등)이 없다면 비워두거나 "manual_unknown" 등으로 하세요.
2. 역할 구분 (쁘락지기 vs DJ):
   - 쁘락띠까(Practica)의 스태프나 '쁘락지기'는 DJ가 아니므로 dj 필드가 아니라 organizer 또는 description 본문에 기입해 주세요. (dj 필드는 비워둡니다)
   - 밀롱가(Milonga) 공지일 경우에만 음악 틀어주는 사람을 dj 필드에 기입해 주세요.
3. 자정/밤 12시 시간 표기:
   - 종료 시간이 밤 12시인 경우 "12:00"(정오)로 표기하는 치명적인 실수를 방지하고, 반드시 "24:00" 또는 "00:00"으로 올바르게 정규화해 주세요.
4. 요일 표기:
   - dayOfWeek는 일요일=0, 월요일=1, 화요일=2, 수요일=3, 목요일=4, 금요일=5, 토요일=6의 숫자를 문자열(예: "3") 형태로만 반환해야 합니다.

[반환할 JSON 구조 스키마]
{
  "title": "영문 소셜 타이틀 (예: Milonga Abrazo)",
  "titleKo": "한글 소셜 타이틀 (예: 밀롱가 아브라소)",
  "date": "이벤트 해당 날짜 (YYYY-MM-DD 형식, regular일 경우 가장 가까운 다음 날짜 추정)",
  "dayOfWeek": "0부터 6 사이의 문자열 요일 번호 (일요일=0)",
  "startTime": "HH:MM 형식 (예: 19:30)",
  "endTime": "HH:MM 형식 (예: 23:30 또는 24:00)",
  "venue": "장소 한글 또는 영문 이름",
  "region": "대문자 도시 코드 (예: SEOUL, DAEJEON, BUSAN, CHANGWON 등)",
  "organizer": "자연인 주최자 이름 (닉네임)",
  "dj": "DJ 이름",
  "description": "이벤트 상세 설명 요약 및 본문 정제 내용"
}

분석할 원문:
"${text}"
    `;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API Error:', errText);
      return NextResponse.json({ error: 'Gemini 분석을 완료할 수 없습니다.' }, { status: 502 });
    }

    const resData = await geminiRes.json();
    const extractedJsonText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedJsonText) {
      return NextResponse.json({ error: 'Gemini로부터 비어있는 응답을 받았습니다.' }, { status: 502 });
    }

    const parsedData = JSON.parse(extractedJsonText);

    // 2. 기존 socials 데이터 로드 후 매칭 보조 서비스 구동
    const socialsSnap = await db.collection('socials').get();
    const existingSocials: MiniSocial[] = [];
    socialsSnap.forEach(docSnap => {
      const data = docSnap.data();
      existingSocials.push({
        id: docSnap.id,
        title: data.title || '',
        titleNative: data.titleNative || '',
        venueId: data.venueId || '',
        venueName: data.venueName || '',
        venueNameNative: data.venueNameNative || '',
        dayOfWeek: data.dayOfWeek !== undefined ? Number(data.dayOfWeek) : undefined,
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        djName: data.djName || '',
        organizerName: data.organizerName || '',
        organizerNameNative: data.organizerNameNative || '',
        recurrence: data.recurrence || '',
        description: data.description || '',
        imageUrl: data.imageUrl || ''
      });
    });

    const matchResult = matchSocialCandidate(
      {
        title: parsedData.titleKo || parsedData.title,
        date: parsedData.date,
        dayOfWeek: parsedData.dayOfWeek,
        startTime: parsedData.startTime,
        endTime: parsedData.endTime,
        venue: parsedData.venue,
        region: parsedData.region,
        organizer: parsedData.organizer,
        dj: parsedData.dj,
        description: parsedData.description
      },
      existingSocials
    );

    // 3. Firestore socialRadarCandidates 컬렉션에 후보 문서 저장
    const candidateData = {
      sourceType: url ? 'website' : 'manual',
      sourceUrl: url || '',
      sourceSnippet: text.substring(0, 300),
      sourceText: text,
      extracted: {
        title: parsedData.title || '',
        titleNative: parsedData.titleKo || '',
        date: parsedData.date || '',
        dayOfWeek: parsedData.dayOfWeek || '',
        startTime: parsedData.startTime || '',
        endTime: parsedData.endTime || '',
        venue: parsedData.venue || '',
        region: parsedData.region || '',
        organizer: parsedData.organizer || '',
        dj: parsedData.dj || '',
        description: parsedData.description || ''
      },
      match: {
        status: matchResult.status,
        socialId: matchResult.socialId || '',
        socialTitle: matchResult.socialTitle || '',
        confidence: matchResult.confidence,
        reason: matchResult.reason
      },
      detectedChanges: matchResult.detectedChanges,
      confidence: matchResult.confidence,
      handoffStatus: 'candidate',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('socialRadarCandidates').add(candidateData);
    const finalResponse = {
      id: docRef.id,
      ...candidateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(finalResponse);
  } catch (err: any) {
    console.error('Analyze route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
